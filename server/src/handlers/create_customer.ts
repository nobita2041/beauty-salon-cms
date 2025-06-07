
import { db } from '../db';
import { customersTable } from '../db/schema';
import { type CreateCustomerInput, type Customer } from '../schema';

export const createCustomer = async (input: CreateCustomerInput): Promise<Customer> => {
  try {
    const result = await db.insert(customersTable)
      .values({
        first_name: input.first_name,
        last_name: input.last_name,
        email: input.email,
        phone: input.phone,
        date_of_birth: input.date_of_birth ? input.date_of_birth.toISOString().split('T')[0] : null,
        notes: input.notes
      })
      .returning()
      .execute();

    // Convert date string back to Date object
    const customer = result[0];
    return {
      ...customer,
      date_of_birth: customer.date_of_birth ? new Date(customer.date_of_birth) : null
    };
  } catch (error) {
    console.error('Customer creation failed:', error);
    throw error;
  }
};
