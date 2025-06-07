
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Scissors, Plus, Clock, DollarSign, Edit2 } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Service, CreateServiceInput } from '../../../server/src/schema';

export function ServiceManagement() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState<CreateServiceInput>({
    name: '',
    description: null,
    duration_minutes: 0,
    price: 0
  });

  const loadServices = useCallback(async () => {
    try {
      const result = await trpc.getServices.query();
      setServices(result);
    } catch (error) {
      console.error('Failed to load services:', error);
    }
  }, []);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: null,
      duration_minutes: 0,
      price: 0
    });
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newService = await trpc.createService.mutate(formData);
      setServices((prev: Service[]) => [...prev, newService]);
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create service:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getServiceTypeColor = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('hair') || lowerName.includes('cut') || lowerName.includes('style')) {
      return 'bg-pink-100 text-pink-800 border-pink-200';
    } else if (lowerName.includes('nail') || lowerName.includes('mani') || lowerName.includes('pedi')) {
      return 'bg-purple-100 text-purple-800 border-purple-200';
    } else if (lowerName.includes('facial') || lowerName.includes('skin') || lowerName.includes('clean')) {
      return 'bg-green-100 text-green-800 border-green-200';
    } else if (lowerName.includes('massage') || lowerName.includes('relax') || lowerName.includes('spa')) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    } else if (lowerName.includes('brow') || lowerName.includes('lash') || lowerName.includes('wax')) {
      return 'bg-amber-100 text-amber-800 border-amber-200';
    }
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-white/70 backdrop-blur-sm border-pink-200 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Scissors className="w-5 h-5 text-pink-600" />
                <span>Service Management</span>
              </CardTitle>
              <CardDescription>Manage your beauty salon services and pricing</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreateDialog} className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-xl">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Service
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-sm border-pink-200">
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2">
                    <Scissors className="w-5 h-5 text-pink-600" />
                    <span>Add New Service</span>
                  </DialogTitle>
                  <DialogDescription>
                    Create a new service offering for your salon
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Service Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateServiceInput) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="e.g., Hair Cut & Style"
                      className="border-pink-200 focus:border-pink-400 rounded-lg"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={formData.description || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setFormData((prev: CreateServiceInput) => ({
                          ...prev,
                          description: e.target.value || null
                        }))
                      }
                      placeholder="Describe what this service includes..."
                      className="border-pink-200 focus:border-pink-400 rounded-lg"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="duration">Duration (minutes)</Label>
                      <Input
                        id="duration"
                        type="number"
                        value={formData.duration_minutes}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateServiceInput) => ({
                            ...prev,
                            duration_minutes: parseInt(e.target.value) || 0
                          }))
                        }
                        min="1"
                        step="15"
                        placeholder="60"
                        className="border-pink-200 focus:border-pink-400 rounded-lg"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="price">Price ($)</Label>
                      <Input
                        id="price"
                        type="number"
                        value={formData.price}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateServiceInput) => ({
                            ...prev,
                            price: parseFloat(e.target.value) || 0
                          }))
                        }
                        min="0"
                        step="0.01"
                        placeholder="50.00"
                        className="border-pink-200 focus:border-pink-400 rounded-lg"
                        required
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="submit" disabled={isLoading} className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-lg">
                      {isLoading ? 'Creating...' : 'Create Service'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.length === 0 ? (
          <Card className="md:col-span-2 lg:col-span-3 bg-white/70 backdrop-blur-sm border-pink-200 shadow-lg">
            <CardContent className="text-center py-16">
              <Scissors className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">No Services Yet</h3>
              <p className="text-gray-500 mb-6">Create your first service to get started with appointment booking.</p>
              <Button onClick={openCreateDialog} className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Service
              </Button>
            </CardContent>
          </Card>
        ) : (
          services.map((service: Service) => (
            <Card key={service.id} className="bg-white/70 backdrop-blur-sm border-pink-200 shadow-lg hover:shadow-xl transition-shadow group">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2 group-hover:text-pink-600 transition-colors">
                      {service.name}
                    </CardTitle>
                    <Badge variant="outline" className={`${getServiceTypeColor(service.name)} mb-3`}>
                      Beauty Service
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-pink-100"
                  >
                    <Edit2 className="w-4 h-4 text-pink-600" />
                  </Button>
                </div>
                {service.description && (
                  <CardDescription className="text-sm leading-relaxed">
                    {service.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4 text-purple-500" />
                      <span>{formatDuration(service.duration_minutes)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-green-500" />
                      <span className="text-lg font-bold text-green-600">{service.price.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t border-pink-100">
                    <p className="text-xs text-gray-500">
                      Created {service.created_at.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Service Categories Summary */}
      {services.length > 0 && (
        <Card className="bg-white/70 backdrop-blur-sm border-pink-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Scissors className="w-5 h-5 text-pink-600" />
              <span>Service Overview</span>
            </CardTitle>
            <CardDescription>Quick summary of your service offerings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-pink-50 rounded-lg border border-pink-200">
                <div className="text-2xl font-bold text-pink-600">{services.length}</div>
                <div className="text-sm text-pink-700">Total Services</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(services.reduce((sum, service) => sum + service.duration_minutes, 0) / services.length)}
                </div>
                <div className="text-sm text-purple-700">Avg Duration (min)</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600">
                  ${(services.reduce((sum, service) => sum + service.price, 0) / services.length).toFixed(0)}
                </div>
                <div className="text-sm text-green-700">Avg Price</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">
                  ${Math.max(...services.map(s => s.price)).toFixed(0)}
                </div>
                <div className="text-sm text-blue-700">Highest Price</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
