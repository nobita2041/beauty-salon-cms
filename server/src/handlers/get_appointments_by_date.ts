
import { db } from '../db';
import { appointmentsTable, customersTable, servicesTable } from '../db/schema';
import { type AppointmentWithDetails } from '../schema';
import { eq } from 'drizzle-orm';

export const getAppointmentsByDate = async (date: Date): Promise<AppointmentWithDetails[]> => {
  try {
    // Convert Date to string for query (YYYY-MM-DD format)
    const dateString = date.toISOString().split('T')[0];

    // Query appointments with customer and service details
    const results = await db.select()
      .from(appointmentsTable)
      .innerJoin(customersTable, eq(appointmentsTable.customer_id, customersTable.id))
      .innerJoin(servicesTable, eq(appointmentsTable.service_id, servicesTable.id))
      .where(eq(appointmentsTable.appointment_date, dateString))
      .execute();

    // Transform joined results to expected format
    return results.map(result => ({
      id: result.appointments.id,
      customer_id: result.appointments.customer_id,
      service_id: result.appointments.service_id,
      appointment_date: new Date(result.appointments.appointment_date), // Convert string back to Date
      start_time: result.appointments.start_time,
      end_time: result.appointments.end_time,
      status: result.appointments.status,
      notes: result.appointments.notes,
      created_at: result.appointments.created_at,
      updated_at: result.appointments.updated_at,
      customer: {
        id: result.customers.id,
        first_name: result.customers.first_name,
        last_name: result.customers.last_name,
        email: result.customers.email,
        phone: result.customers.phone,
        date_of_birth: result.customers.date_of_birth ? new Date(result.customers.date_of_birth) : null, // Convert string to Date
        notes: result.customers.notes,
        created_at: result.customers.created_at,
        updated_at: result.customers.updated_at
      },
      service: {
        id: result.services.id,
        name: result.services.name,
        description: result.services.description,
        duration_minutes: result.services.duration_minutes,
        price: parseFloat(result.services.price), // Convert numeric to number
        created_at: result.services.created_at
      }
    }));
  } catch (error) {
    console.error('Get appointments by date failed:', error);
    throw error;
  }
};
