
import { db } from '../db';
import { customersTable, appointmentsTable, serviceHistoryTable, servicesTable } from '../db/schema';
import { type DashboardStats } from '../schema';
import { eq, gte, and, desc, lte } from 'drizzle-orm';

export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get first day of current month
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Count today's appointments
    const todayAppointments = await db.select()
      .from(appointmentsTable)
      .where(eq(appointmentsTable.appointment_date, today.toISOString().split('T')[0]))
      .execute();

    // Count new customers this month
    const newCustomers = await db.select()
      .from(customersTable)
      .where(gte(customersTable.created_at, firstDayOfMonth))
      .execute();

    // Calculate total revenue this month
    const monthlyRevenue = await db.select()
      .from(serviceHistoryTable)
      .where(gte(serviceHistoryTable.service_date, firstDayOfMonth.toISOString().split('T')[0]))
      .execute();

    const totalRevenue = monthlyRevenue.reduce((sum, record) => {
      return sum + parseFloat(record.price_paid);
    }, 0);

    // Get upcoming appointments (next 7 days) with customer and service details
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const upcomingAppointmentsQuery = await db.select()
      .from(appointmentsTable)
      .innerJoin(customersTable, eq(appointmentsTable.customer_id, customersTable.id))
      .innerJoin(servicesTable, eq(appointmentsTable.service_id, servicesTable.id))
      .where(
        and(
          gte(appointmentsTable.appointment_date, today.toISOString().split('T')[0]),
          lte(appointmentsTable.appointment_date, sevenDaysFromNow.toISOString().split('T')[0])
        )
      )
      .orderBy(appointmentsTable.appointment_date, appointmentsTable.start_time)
      .limit(10)
      .execute();

    const upcomingAppointments = upcomingAppointmentsQuery.map(result => ({
      id: result.appointments.id,
      customer_id: result.appointments.customer_id,
      service_id: result.appointments.service_id,
      appointment_date: new Date(result.appointments.appointment_date),
      start_time: result.appointments.start_time,
      end_time: result.appointments.end_time,
      status: result.appointments.status,
      notes: result.appointments.notes,
      created_at: result.appointments.created_at,
      updated_at: result.appointments.updated_at
    }));

    // Get recent customers (last 5)
    const recentCustomersQuery = await db.select()
      .from(customersTable)
      .orderBy(desc(customersTable.created_at))
      .limit(5)
      .execute();

    const recentCustomers = recentCustomersQuery.map(customer => ({
      id: customer.id,
      first_name: customer.first_name,
      last_name: customer.last_name,
      email: customer.email,
      phone: customer.phone,
      date_of_birth: customer.date_of_birth ? new Date(customer.date_of_birth) : null,
      notes: customer.notes,
      created_at: customer.created_at,
      updated_at: customer.updated_at
    }));

    return {
      today_appointments: todayAppointments.length,
      new_customers_this_month: newCustomers.length,
      total_revenue_this_month: totalRevenue,
      upcoming_appointments: upcomingAppointments,
      recent_customers: recentCustomers
    };
  } catch (error) {
    console.error('Dashboard stats retrieval failed:', error);
    throw error;
  }
};
