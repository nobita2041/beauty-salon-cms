
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Calendar, Plus, Edit2, X, Clock, Scissors } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { AppointmentWithDetails, Customer, Service, CreateAppointmentInput, UpdateAppointmentInput, AppointmentStatus } from '../../../server/src/schema';

interface AppointmentManagementProps {
  onRefreshDashboard: () => void;
}

export function AppointmentManagement({ onRefreshDashboard }: AppointmentManagementProps) {
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<AppointmentWithDetails | null>(null);

  const [formData, setFormData] = useState<CreateAppointmentInput>({
    customer_id: 0,
    service_id: 0,
    appointment_date: new Date(),
    start_time: '',
    end_time: '',
    notes: null
  });

  const loadAppointments = useCallback(async () => {
    try {
      const result = await trpc.getAppointments.query();
      setAppointments(result);
    } catch (error) {
      console.error('Failed to load appointments:', error);
    }
  }, []);

  const loadCustomersAndServices = useCallback(async () => {
    try {
      const [customersResult, servicesResult] = await Promise.all([
        trpc.getCustomers.query(),
        trpc.getServices.query()
      ]);
      setCustomers(customersResult);
      setServices(servicesResult);
    } catch (error) {
      console.error('Failed to load customers and services:', error);
    }
  }, []);

  useEffect(() => {
    loadAppointments();
    loadCustomersAndServices();
  }, [loadAppointments, loadCustomersAndServices]);

  const filteredAppointments = appointments.filter((appointment: AppointmentWithDetails) => {
    const appointmentDate = appointment.appointment_date.toISOString().split('T')[0];
    return appointmentDate === selectedDate;
  });

  const resetForm = () => {
    setFormData({
      customer_id: 0,
      service_id: 0,
      appointment_date: new Date(selectedDate),
      start_time: '',
      end_time: '',
      notes: null
    });
    setEditingAppointment(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (appointment: AppointmentWithDetails) => {
    setEditingAppointment(appointment);
    setFormData({
      customer_id: appointment.customer_id,
      service_id: appointment.service_id,
      appointment_date: appointment.appointment_date,
      start_time: appointment.start_time,
      end_time: appointment.end_time,
      notes: appointment.notes
    });
    setIsDialogOpen(true);
  };

  const calculateEndTime = (startTime: string, durationMinutes: number) => {
    if (!startTime) return '';
    
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
    return endDate.toTimeString().slice(0, 5);
  };

  const handleServiceChange = (serviceId: string) => {
    const selectedService = services.find((service: Service) => service.id === parseInt(serviceId));
    if (selectedService && formData.start_time) {
      const endTime = calculateEndTime(formData.start_time, selectedService.duration_minutes);
      setFormData((prev: CreateAppointmentInput) => ({
        ...prev,
        service_id: parseInt(serviceId),
        end_time: endTime
      }));
    } else {
      setFormData((prev: CreateAppointmentInput) => ({
        ...prev,
        service_id: parseInt(serviceId)
      }));
    }
  };

  const handleStartTimeChange = (startTime: string) => {
    const selectedService = services.find((service: Service) => service.id === formData.service_id);
    if (selectedService) {
      const endTime = calculateEndTime(startTime, selectedService.duration_minutes);
      setFormData((prev: CreateAppointmentInput) => ({
        ...prev,
        start_time: startTime,
        end_time: endTime
      }));
    } else {
      setFormData((prev: CreateAppointmentInput) => ({
        ...prev,
        start_time: startTime
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (editingAppointment) {
        const updateData: UpdateAppointmentInput = {
          id: editingAppointment.id,
          ...formData
        };
        await trpc.updateAppointment.mutate(updateData);
      } else {
        await trpc.createAppointment.mutate(formData);
      }
      
      await loadAppointments();
      setIsDialogOpen(false);
      resetForm();
      onRefreshDashboard();
    } catch (error) {
      console.error('Failed to save appointment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (appointmentId: number, status: AppointmentStatus) => {
    try {
      await trpc.updateAppointment.mutate({
        id: appointmentId,
        status: status
      });
      await loadAppointments();
      onRefreshDashboard();
    } catch (error) {
      console.error('Failed to update appointment status:', error);
    }
  };

  const handleCancel = async (appointmentId: number) => {
    try {
      await trpc.cancelAppointment.mutate(appointmentId);
      await loadAppointments();
      onRefreshDashboard();
    } catch (error) {
      console.error('Failed to cancel appointment:', error);
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
    <div className="space-y-6">
      {/* Header with Date Selector */}
      <Card className="bg-white/70 backdrop-blur-sm border-pink-200 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-pink-600" />
                <span>Appointment Management</span>
              </CardTitle>
              <CardDescription>Schedule and manage customer appointments</CardDescription>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Label htmlFor="date-select">Date:</Label>
                <Input
                  id="date-select"
                  type="date"
                  value={selectedDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedDate(e.target.value)}
                  className="border-pink-200 focus:border-pink-400 rounded-lg"
                />
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={openCreateDialog} className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-xl">
                    <Plus className="w-4 h-4 mr-2" />
                    New Appointment
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg bg-white/95 backdrop-blur-sm border-pink-200">
                  <DialogHeader>
                    <DialogTitle className="flex items-center space-x-2">
                      <Calendar className="w-5 h-5 text-pink-600" />
                      <span>{editingAppointment ? 'Edit Appointment' : 'Schedule New Appointment'}</span>
                    </DialogTitle>
                    <DialogDescription>
                      {editingAppointment ? 'Update appointment details' : 'Create a new appointment for a customer'}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="customer">Customer</Label>
                      <Select
                        value={formData.customer_id ? formData.customer_id.toString() : ''}
                        onValueChange={(value) => setFormData((prev: CreateAppointmentInput) => ({ ...prev, customer_id: parseInt(value) }))}
                        required
                      >
                        <SelectTrigger className="border-pink-200 focus:border-pink-400 rounded-lg">
                          <SelectValue placeholder="Select a customer" />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.map((customer: Customer) => (
                            <SelectItem key={customer.id} value={customer.id.toString()}>
                              {customer.first_name} {customer.last_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="service">Service</Label>
                      <Select
                        value={formData.service_id ? formData.service_id.toString() : ''}
                        onValueChange={handleServiceChange}
                        required
                      >
                        <SelectTrigger className="border-pink-200 focus:border-pink-400 rounded-lg">
                          <SelectValue placeholder="Select a service" />
                        </SelectTrigger>
                        <SelectContent>
                          {services.map((service: Service) => (
                            <SelectItem key={service.id} value={service.id.toString()}>
                              {service.name} ({service.duration_minutes} min - ${service.price})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="appointment_date">Date</Label>
                      <Input
                        id="appointment_date"
                        type="date"
                        value={formData.appointment_date.toISOString().split('T')[0]}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateAppointmentInput) => ({
                            ...prev,
                            appointment_date: new Date(e.target.value)
                          }))
                        }
                        className="border-pink-200 focus:border-pink-400 rounded-lg"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="start_time">Start Time</Label>
                        <Input
                          id="start_time"
                          type="time"
                
                          value={formData.start_time}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleStartTimeChange(e.target.value)}
                          className="border-pink-200 focus:border-pink-400 rounded-lg"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="end_time">End Time</Label>
                        <Input
                          id="end_time"
                          type="time"
                          value={formData.end_time}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setFormData((prev: CreateAppointmentInput) => ({ ...prev, end_time: e.target.value }))
                          }
                          className="border-pink-200 focus:border-pink-400 rounded-lg"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setFormData((prev: CreateAppointmentInput) => ({
                            ...prev,
                            notes: e.target.value || null
                          }))
                        }
                        className="border-pink-200 focus:border-pink-400 rounded-lg"
                        rows={3}
                        placeholder="Any special notes for this appointment..."
                      />
                    </div>

                    <DialogFooter>
                      <Button type="submit" disabled={isLoading} className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-lg">
                        {isLoading ? 'Saving...' : editingAppointment ? 'Update Appointment' : 'Schedule Appointment'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Appointments List */}
      <Card className="bg-white/70 backdrop-blur-sm border-pink-200 shadow-lg">
        <CardHeader>
          <CardTitle>
            Appointments for {new Date(selectedDate).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </CardTitle>
          <CardDescription>
            {filteredAppointments.length} appointment{filteredAppointments.length !== 1 ? 's' : ''} scheduled
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredAppointments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium mb-2">No appointments scheduled</p>
              <p>Schedule your first appointment for this date!</p>
            </div>
          ) : (
            filteredAppointments
              .sort((a, b) => a.start_time.localeCompare(b.start_time))
              .map((appointment: AppointmentWithDetails) => (
                <div key={appointment.id} className="p-6 bg-white/50 rounded-xl border border-pink-100 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-gradient-to-br from-pink-400 to-purple-500 text-white">
                          {appointment.customer.first_name[0]}{appointment.customer.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-lg">
                            {appointment.customer.first_name} {appointment.customer.last_name}
                          </h3>
                          <Badge variant="outline" className={`${getStatusColor(appointment.status)}`}>
                            {appointment.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <Scissors className="w-4 h-4 text-pink-500" />
                            <span>{appointment.service.name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-purple-500" />
                            <span>{formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-green-600 font-medium">${appointment.service.price}</span>
                          </div>
                        </div>
                        {appointment.notes && (
                          <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                            <p className="text-sm text-yellow-800">{appointment.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {appointment.status === 'scheduled' && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate(appointment.id, 'confirmed')}
                          className="bg-green-500 hover:bg-green-600 text-white"
                        >
                          Confirm
                        </Button>
                      )}
                      {appointment.status === 'confirmed' && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate(appointment.id, 'in_progress')}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white"
                        >
                          Start
                        </Button>
                      )}
                      {appointment.status === 'in_progress' && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate(appointment.id, 'completed')}
                          className="bg-purple-500 hover:bg-purple-600 text-white"
                        >
                          Complete
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditDialog(appointment)}
                        className="hover:bg-pink-100"
                      >
                        <Edit2 className="w-4 h-4 text-pink-600" />
                      </Button>
                      {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="hover:bg-red-100"
                            >
                              <X className="w-4 h-4 text-red-600" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-white/95 backdrop-blur-sm border-pink-200">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Cancel Appointment</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to cancel this appointment with {appointment.customer.first_name} {appointment.customer.last_name}?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Keep Appointment</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleCancel(appointment.id)}
                                className="bg-red-500 hover:bg-red-600"
                              >
                                Cancel Appointment
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                </div>
              ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
