
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit2, Trash2, Phone, Mail, Calendar, User, History } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Customer, CreateCustomerInput, UpdateCustomerInput, AppointmentWithDetails, ServiceHistoryWithDetails } from '../../../server/src/schema';

interface CustomerManagementProps {
  onRefreshDashboard: () => void;
}

export function CustomerManagement({ onRefreshDashboard }: CustomerManagementProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerAppointments, setCustomerAppointments] = useState<AppointmentWithDetails[]>([]);
  const [customerHistory, setCustomerHistory] = useState<ServiceHistoryWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [formData, setFormData] = useState<CreateCustomerInput>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: null,
    notes: null
  });

  const loadCustomers = useCallback(async () => {
    try {
      const result = await trpc.getCustomers.query();
      setCustomers(result);
    } catch (error) {
      console.error('Failed to load customers:', error);
    }
  }, []);

  const loadCustomerDetails = useCallback(async (customerId: number) => {
    try {
      const [appointments, history] = await Promise.all([
        trpc.getAppointmentsByCustomer.query(customerId),
        trpc.getServiceHistoryByCustomer.query(customerId)
      ]);
      setCustomerAppointments(appointments);
      setCustomerHistory(history);
    } catch (error) {
      console.error('Failed to load customer details:', error);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  useEffect(() => {
    if (selectedCustomer) {
      loadCustomerDetails(selectedCustomer.id);
    }
  }, [selectedCustomer, loadCustomerDetails]);

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      date_of_birth: null,
      notes: null
    });
    setEditingCustomer(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      first_name: customer.first_name,
      last_name: customer.last_name,
      email: customer.email,
      phone: customer.phone,
      date_of_birth: customer.date_of_birth,
      notes: customer.notes
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (editingCustomer) {
        const updateData: UpdateCustomerInput = {
          id: editingCustomer.id,
          ...formData
        };
        const updatedCustomer = await trpc.updateCustomer.mutate(updateData);
        setCustomers((prev: Customer[]) => 
          prev.map((customer: Customer) => 
            customer.id === editingCustomer.id ? updatedCustomer : customer
          )
        );
        if (selectedCustomer?.id === editingCustomer.id) {
          setSelectedCustomer(updatedCustomer);
        }
      } else {
        const newCustomer = await trpc.createCustomer.mutate(formData);
        setCustomers((prev: Customer[]) => [...prev, newCustomer]);
      }
      setIsDialogOpen(false);
      resetForm();
      onRefreshDashboard();
    } catch (error) {
      console.error('Failed to save customer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (customerId: number) => {
    try {
      await trpc.deleteCustomer.mutate(customerId);
      setCustomers((prev: Customer[]) => prev.filter((customer: Customer) => customer.id !== customerId));
      if (selectedCustomer?.id === customerId) {
        setSelectedCustomer(null);
      }
      onRefreshDashboard();
    } catch (error) {
      console.error('Failed to delete customer:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Customer List */}
      <Card className="lg:col-span-1 bg-white/70 backdrop-blur-sm border-pink-200 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5 text-pink-600" />
                <span>Customers</span>
              </CardTitle>
              <CardDescription>Manage your customer database</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreateDialog} className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-xl">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Customer
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-sm border-pink-200">
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2">
                    <User className="w-5 h-5 text-pink-600" />
                    <span>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</span>
                  </DialogTitle>
                  <DialogDescription>
                    {editingCustomer ? 'Update customer information' : 'Add a new customer to your database'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">First Name</Label>
                      <Input
                        id="first_name"
                        value={formData.first_name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateCustomerInput) => ({ ...prev, first_name: e.target.value }))
                        }
                        className="border-pink-200 focus:border-pink-400 rounded-lg"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Last Name</Label>
                      <Input
                        id="last_name"
                        value={formData.last_name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateCustomerInput) => ({ ...prev, last_name: e.target.value }))
                        }
                        className="border-pink-200 focus:border-pink-400 rounded-lg"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateCustomerInput) => ({ ...prev, email: e.target.value }))
                      }
                      className="border-pink-200 focus:border-pink-400 rounded-lg"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateCustomerInput) => ({ ...prev, phone: e.target.value }))
                      }
                      className="border-pink-200 focus:border-pink-400 rounded-lg"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth">Date of Birth (Optional)</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={formData.date_of_birth ? formData.date_of_birth.toISOString().split('T')[0] : ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateCustomerInput) => ({
                          ...prev,
                          date_of_birth: e.target.value ? new Date(e.target.value) : null
                        }))
                      }
                      className="border-pink-200 focus:border-pink-400 rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setFormData((prev: CreateCustomerInput) => ({
                          ...prev,
                          notes: e.target.value || null
                        }))
                      }
                      className="border-pink-200 focus:border-pink-400 rounded-lg"
                      rows={3}
                      placeholder="Any special notes about the customer..."
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isLoading} className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-lg">
                      {isLoading ? 'Saving...' : editingCustomer ? 'Update Customer' : 'Add Customer'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {customers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No customers yet</p>
              <p className="text-sm">Add your first customer to get started!</p>
            </div>
          ) : (
            customers.map((customer: Customer) => (
              <div
                key={customer.id}
                className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                  selectedCustomer?.id === customer.id
                    ? 'border-pink-300 bg-pink-50/50 shadow-sm'
                    : 'border-pink-100 bg-white/50 hover:border-pink-200'
                }`}
                onClick={() => setSelectedCustomer(customer)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-gradient-to-br from-pink-400 to-purple-500 text-white text-sm">
                        {customer.first_name[0]}{customer.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">
                        {customer.first_name} {customer.last_name}
                      </p>
                      <p className="text-xs text-gray-500">{customer.email}</p>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditDialog(customer);
                      }}
                      className="h-8 w-8 p-0 hover:bg-pink-100"
                    >
                      <Edit2 className="w-3 h-3 text-pink-600" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => e.stopPropagation()}
                          className="h-8 w-8 p-0 hover:bg-red-100"
                        >
                          <Trash2 className="w-3 h-3 text-red-600" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-white/95 backdrop-blur-sm border-pink-200">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Customer</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete {customer.first_name} {customer.last_name}? 
                            This action cannot be undone and will remove all associated appointments and history.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(customer.id)}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Customer Details */}
      <div className="lg:col-span-2">
        {selectedCustomer ? (
          <Card className="bg-white/70 backdrop-blur-sm border-pink-200 shadow-lg">
            <CardHeader>
              <div className="flex items-center space-x-4">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="bg-gradient-to-br from-pink-400 to-purple-500 text-white text-xl">
                    {selectedCustomer.first_name[0]}{selectedCustomer.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-xl">
                    {selectedCustomer.first_name} {selectedCustomer.last_name}
                  </CardTitle>
                  <CardDescription className="flex items-center space-x-4 mt-2">
                    <span className="flex items-center space-x-1">
                      <Mail className="w-4 h-4" />
                      <span>{selectedCustomer.email}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Phone className="w-4 h-4" />
                      <span>{selectedCustomer.phone}</span>
                    </span>
                    {selectedCustomer.date_of_birth && (
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{selectedCustomer.date_of_birth.toLocaleDateString()}</span>
                      </span>
                    )}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="appointments" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2 bg-pink-50 border border-pink-200 rounded-lg">
                  <TabsTrigger value="appointments" className="data-[state=active]:bg-white data-[state=active]:text-pink-700 rounded-md">
                    Appointments
                  </TabsTrigger>
                  <TabsTrigger value="history" className="data-[state=active]:bg-white data-[state=active]:text-pink-700 rounded-md">
                    Service History
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="appointments" className="space-y-4">
                  {customerAppointments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>No appointments found</p>
                    </div>
                  ) : (
                    customerAppointments.map((appointment: AppointmentWithDetails) => (
                      <div key={appointment.id} className="p-4 bg-white/50 rounded-lg border border-pink-100">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{appointment.service.name}</p>
                            <p className="text-sm text-gray-600">
                              {appointment.appointment_date.toLocaleDateString()} at {formatTime(appointment.start_time)}
                            </p>
                            <p className="text-xs text-gray-500">
                              Duration: {appointment.service.duration_minutes} minutes • ${appointment.service.price}
                            </p>
                          </div>
                          <Badge variant="outline" className={`${getStatusColor(appointment.status)}`}>
                            {appointment.status}
                          </Badge>
                        </div>
                        {appointment.notes && (
                          <p className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                            {appointment.notes}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="history" className="space-y-4">
                  {customerHistory.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>No service history found</p>
                    </div>
                  ) : (
                    customerHistory.map((history: ServiceHistoryWithDetails) => (
                      <div key={history.id} className="p-4 bg-white/50 rounded-lg border border-pink-100">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{history.service.name}</p>
                            <p className="text-sm text-gray-600">
                              {history.service_date.toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-500">
                              Price Paid: ${history.price_paid}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                              Completed
                            </Badge>
                          </div>
                        </div>
                        {history.notes && (
                          <p className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                            {history.notes}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </TabsContent>
              </Tabs>

              {selectedCustomer.notes && (
                <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h4 className="font-medium text-yellow-800 mb-2">Customer Notes</h4>
                  <p className="text-sm text-yellow-700">{selectedCustomer.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white/70 backdrop-blur-sm border-pink-200 shadow-lg">
            <CardContent className="text-center py-16">
              <User className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">Select a Customer</h3>
              <p className="text-gray-500">Choose a customer from the list to view their details, appointments, and service history.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
