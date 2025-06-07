
import { db } from '../db';
import { customersTable } from '../db/schema';
import { type Customer } from '../schema';

export const getCustomers = async (): Promise<Customer[]> => {
  try {
    const results = await db.select()
      .from(customersTable)
      .execute();

    // Convert date_of_birth from string to Date object
    return results.map(customer => ({
      ...customer,
      date_of_birth: customer.date_of_birth ? new Date(customer.date_of_birth) : null
    }));
  } catch (error) {
    console.error('Get customers failed:', error);
    throw error;
  }
};
