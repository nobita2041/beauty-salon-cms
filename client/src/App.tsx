
import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, Users, Scissors, TrendingUp, Search, Clock, DollarSign } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { CustomerManagement } from '@/components/CustomerManagement';
import { AppointmentManagement } from '@/components/AppointmentManagement';
import { ServiceManagement } from '@/components/ServiceManagement';
import type { DashboardStats, Customer, Appointment } from '../../server/src/schema';

function App() {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      const stats = await trpc.getDashboardStats.query();
      setDashboardStats(stats);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const results = await trpc.searchCustomers.query({ query, limit: 10 });
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, handleSearch]);

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
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-pink-100 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl">
                <Scissors className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  Beauty Salon Pro
                </h1>
                <p className="text-sm text-gray-500">Management System</p>
              </div>
            </div>
            
            {/* Global Search */}
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search customers... 💄"
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/50 border-pink-200 focus:border-pink-400 rounded-xl"
              />
              {searchQuery && (
                <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-lg border border-pink-100 max-h-60 overflow-y-auto z-10">
                  {isSearching ? (
                    <div className="p-4 text-center text-gray-500">Searching...</div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((customer: Customer) => (
                      <div key={customer.id} className="p-3 hover:bg-pink-50 border-b border-pink-50 last:border-b-0">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-gradient-to-br from-pink-400 to-purple-500 text-white text-xs">
                              {customer.first_name[0]}{customer.last_name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{customer.first_name} {customer.last_name}</p>
                            <p className="text-xs text-gray-500">{customer.email}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500">No customers found</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white/50 border border-pink-200 rounded-xl p-1">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg">
              <TrendingUp className="w-4 h-4" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg">
              <Users className="w-4 h-4" />
              <span>Customers</span>
            </TabsTrigger>
            <TabsTrigger value="appointments" className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg">
              <Calendar className="w-4 h-4" />
              <span>Appointments</span>
            </TabsTrigger>
            <TabsTrigger value="services" className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg">
              <Scissors className="w-4 h-4" />
              <span>Services</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg">
              <Clock className="w-4 h-4" />
              <span>History</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {dashboardStats && (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="bg-gradient-to-br from-pink-500 to-rose-600 text-white border-0 shadow-lg">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center justify-between">
                        <span>Today's Appointments</span>
                        <Calendar className="w-5 h-5 opacity-80" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{dashboardStats.today_appointments}</div>
                      <p className="text-pink-100 text-sm">Scheduled for today</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white border-0 shadow-lg">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center justify-between">
                        <span>New Customers</span>
                        <Users className="w-5 h-5 opacity-80" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{dashboardStats.new_customers_this_month}</div>
                      <p className="text-purple-100 text-sm">This month</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0 shadow-lg">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center justify-between">
                        <span>Monthly Revenue</span>
                        <DollarSign className="w-5 h-5 opacity-80" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">${dashboardStats.total_revenue_this_month.toFixed(0)}</div>
                      <p className="text-emerald-100 text-sm">This month</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Upcoming Appointments & Recent Customers */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-white/70 backdrop-blur-sm border-pink-200 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-gray-800">
                        <Calendar className="w-5 h-5 text-pink-600" />
                        <span>Upcoming Appointments</span>
                      </CardTitle>
                      <CardDescription>Next few scheduled appointments</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {dashboardStats.upcoming_appointments.length > 0 ? (
                        dashboardStats.upcoming_appointments.slice(0, 5).map((appointment: Appointment) => (
                          <div key={appointment.id} className="flex items-center justify-between p-3 bg-white/50 rounded-lg border border-pink-100">
                            <div className="flex items-center space-x-3">
                              <Avatar className="w-10 h-10">
                                <AvatarFallback className="bg-gradient-to-br from-pink-400 to-purple-500 text-white text-sm">
                                  A{appointment.id}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">
                                  Appointment #{appointment.id}
                                </p>
                                <p className="text-xs text-gray-500">Customer ID: {appointment.customer_id}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">{formatTime(appointment.start_time)}</p>
                              <Badge variant="outline" className={`text-xs ${getStatusColor(appointment.status)}`}>
                                {appointment.status}
                              </Badge>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                          <p>No upcoming appointments</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-white/70 backdrop-blur-sm border-pink-200 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-gray-800">
                        <Users className="w-5 h-5 text-purple-600" />
                        <span>Recent Customers</span>
                      </CardTitle>
                      <CardDescription>Recently registered customers</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {dashboardStats.recent_customers.length > 0 ? (
                        dashboardStats.recent_customers.slice(0, 5).map((customer: Customer) => (
                          <div key={customer.id} className="flex items-center justify-between p-3 bg-white/50 rounded-lg border border-pink-100">
                            <div className="flex items-center space-x-3">
                              <Avatar className="w-10 h-10">
                                <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-500 text-white text-sm">
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
                            <div className="text-right">
                              <p className="text-xs text-gray-500">
                                Joined {customer.created_at.toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                          <p>No recent customers</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          {/* Other Tabs */}
          <TabsContent value="customers">
            <CustomerManagement onRefreshDashboard={loadDashboard} />
          </TabsContent>

          <TabsContent value="appointments">
            <AppointmentManagement onRefreshDashboard={loadDashboard} />
          </TabsContent>

          <TabsContent value="services">
            <ServiceManagement />
          </TabsContent>

          <TabsContent value="history">
            <Card className="bg-white/70 backdrop-blur-sm border-pink-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-pink-600" />
                  <span>Service History</span>
                </CardTitle>
                <CardDescription>View detailed service history for all customers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <Clock className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium mb-2">Service History</p>
                  <p>Select a customer from the Customers tab to view their service history</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
