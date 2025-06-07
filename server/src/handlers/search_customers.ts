
import { db } from '../db';
import { customersTable } from '../db/schema';
import { type SearchCustomersInput, type Customer } from '../schema';
import { or, ilike } from 'drizzle-orm';

export const searchCustomers = async (input: SearchCustomersInput): Promise<Customer[]> => {
  try {
    // Build search query - searching across name and email fields
    const searchTerm = `%${input.query}%`;
    
    const results = await db.select()
      .from(customersTable)
      .where(
        or(
          ilike(customersTable.first_name, searchTerm),
          ilike(customersTable.last_name, searchTerm),
          ilike(customersTable.email, searchTerm)
        )
      )
      .limit(input.limit)
      .execute();

    // Convert date_of_birth from string to Date for compatibility with Customer type
    return results.map(customer => ({
      ...customer,
      date_of_birth: customer.date_of_birth ? new Date(customer.date_of_birth) : null
    }));
  } catch (error) {
    console.error('Customer search failed:', error);
    throw error;
  }
};
