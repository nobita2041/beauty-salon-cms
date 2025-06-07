
import { db } from '../db';
import { customersTable } from '../db/schema';
import { type Customer } from '../schema';
import { eq } from 'drizzle-orm';

export const getCustomerById = async (id: number): Promise<Customer | null> => {
  try {
    const results = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const customer = results[0];
    
    // Convert date string to Date object if it exists
    return {
      ...customer,
      date_of_birth: customer.date_of_birth ? new Date(customer.date_of_birth) : null
    };
  } catch (error) {
    console.error('Get customer by ID failed:', error);
    throw error;
  }
};
