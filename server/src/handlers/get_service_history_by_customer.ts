
import { db } from '../db';
import { serviceHistoryTable, customersTable, servicesTable } from '../db/schema';
import { type ServiceHistoryWithDetails } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getServiceHistoryByCustomer = async (customerId: number): Promise<ServiceHistoryWithDetails[]> => {
  try {
    const results = await db.select()
      .from(serviceHistoryTable)
      .innerJoin(customersTable, eq(serviceHistoryTable.customer_id, customersTable.id))
      .innerJoin(servicesTable, eq(serviceHistoryTable.service_id, servicesTable.id))
      .where(eq(serviceHistoryTable.customer_id, customerId))
      .orderBy(desc(serviceHistoryTable.service_date))
      .execute();

    return results.map(result => ({
      id: result.service_history.id,
      customer_id: result.service_history.customer_id,
      service_id: result.service_history.service_id,
      appointment_id: result.service_history.appointment_id,
      service_date: new Date(result.service_history.service_date),
      price_paid: parseFloat(result.service_history.price_paid),
      notes: result.service_history.notes,
      created_at: result.service_history.created_at,
      customer: {
        id: result.customers.id,
        first_name: result.customers.first_name,
        last_name: result.customers.last_name,
        email: result.customers.email,
        phone: result.customers.phone,
        date_of_birth: result.customers.date_of_birth ? new Date(result.customers.date_of_birth) : null,
        notes: result.customers.notes,
        created_at: result.customers.created_at,
        updated_at: result.customers.updated_at
      },
      service: {
        id: result.services.id,
        name: result.services.name,
        description: result.services.description,
        duration_minutes: result.services.duration_minutes,
        price: parseFloat(result.services.price),
        created_at: result.services.created_at
      }
    }));
  } catch (error) {
    console.error('Failed to get service history by customer:', error);
    throw error;
  }
};
