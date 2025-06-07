
import { db } from '../db';
import { serviceHistoryTable, customersTable, servicesTable, appointmentsTable } from '../db/schema';
import { type CreateServiceHistoryInput, type ServiceHistory } from '../schema';
import { eq } from 'drizzle-orm';

export const createServiceHistory = async (input: CreateServiceHistoryInput): Promise<ServiceHistory> => {
  try {
    // Verify customer exists
    const customer = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, input.customer_id))
      .execute();
    
    if (customer.length === 0) {
      throw new Error(`Customer with id ${input.customer_id} not found`);
    }

    // Verify service exists
    const service = await db.select()
      .from(servicesTable)
      .where(eq(servicesTable.id, input.service_id))
      .execute();
    
    if (service.length === 0) {
      throw new Error(`Service with id ${input.service_id} not found`);
    }

    // Verify appointment exists if provided
    if (input.appointment_id) {
      const appointment = await db.select()
        .from(appointmentsTable)
        .where(eq(appointmentsTable.id, input.appointment_id))
        .execute();
      
      if (appointment.length === 0) {
        throw new Error(`Appointment with id ${input.appointment_id} not found`);
      }
    }

    // Insert service history record
    const result = await db.insert(serviceHistoryTable)
      .values({
        customer_id: input.customer_id,
        service_id: input.service_id,
        appointment_id: input.appointment_id,
        service_date: input.service_date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
        price_paid: input.price_paid.toString(), // Convert number to string for numeric column
        notes: input.notes
      })
      .returning()
      .execute();

    // Convert date and numeric fields back to proper types before returning
    const serviceHistory = result[0];
    return {
      ...serviceHistory,
      service_date: new Date(serviceHistory.service_date), // Convert string back to Date
      price_paid: parseFloat(serviceHistory.price_paid) // Convert string back to number
    };
  } catch (error) {
    console.error('Service history creation failed:', error);
    throw error;
  }
};
