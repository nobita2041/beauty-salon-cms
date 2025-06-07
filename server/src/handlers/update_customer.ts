
import { db } from '../db';
import { customersTable } from '../db/schema';
import { type UpdateCustomerInput, type Customer } from '../schema';
import { eq, sql } from 'drizzle-orm';

export const updateCustomer = async (input: UpdateCustomerInput): Promise<Customer> => {
  try {
    // Build update object with only provided fields
    const updateData: any = {};
    
    if (input.first_name !== undefined) {
      updateData.first_name = input.first_name;
    }
    if (input.last_name !== undefined) {
      updateData.last_name = input.last_name;
    }
    if (input.email !== undefined) {
      updateData.email = input.email;
    }
    if (input.phone !== undefined) {
      updateData.phone = input.phone;
    }
    if (input.date_of_birth !== undefined) {
      // Convert Date to string format for date column, or keep null
      updateData.date_of_birth = input.date_of_birth 
        ? input.date_of_birth.toISOString().split('T')[0] 
        : null;
    }
    if (input.notes !== undefined) {
      updateData.notes = input.notes;
    }
    
    // Always update the updated_at timestamp
    updateData.updated_at = sql`now()`;

    // Update customer record
    const result = await db.update(customersTable)
      .set(updateData)
      .where(eq(customersTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Customer with id ${input.id} not found`);
    }

    // Convert date string back to Date object for return
    const customer = result[0];
    return {
      ...customer,
      date_of_birth: customer.date_of_birth ? new Date(customer.date_of_birth) : null
    };
  } catch (error) {
    console.error('Customer update failed:', error);
    throw error;
  }
};
