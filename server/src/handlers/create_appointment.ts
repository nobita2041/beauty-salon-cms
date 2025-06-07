
import { db } from '../db';
import { appointmentsTable, customersTable, servicesTable } from '../db/schema';
import { type CreateAppointmentInput, type Appointment } from '../schema';
import { eq } from 'drizzle-orm';

export const createAppointment = async (input: CreateAppointmentInput): Promise<Appointment> => {
  try {
    // Verify customer exists
    const customer = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, input.customer_id))
      .execute();

    if (customer.length === 0) {
      throw new Error(`Customer with ID ${input.customer_id} not found`);
    }

    // Verify service exists
    const service = await db.select()
      .from(servicesTable)
      .where(eq(servicesTable.id, input.service_id))
      .execute();

    if (service.length === 0) {
      throw new Error(`Service with ID ${input.service_id} not found`);
    }

    // Convert Date to string for date column
    const appointmentDateString = input.appointment_date.toISOString().split('T')[0];

    // Insert appointment record
    const result = await db.insert(appointmentsTable)
      .values({
        customer_id: input.customer_id,
        service_id: input.service_id,
        appointment_date: appointmentDateString,
        start_time: input.start_time,
        end_time: input.end_time,
        notes: input.notes,
      })
      .returning()
      .execute();

    // Convert date string back to Date object
    const appointment = result[0];
    return {
      ...appointment,
      appointment_date: new Date(appointment.appointment_date)
    };
  } catch (error) {
    console.error('Appointment creation failed:', error);
    throw error;
  }
};
