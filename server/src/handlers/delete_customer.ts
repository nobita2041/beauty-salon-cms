
import { db } from '../db';
import { customersTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteCustomer = async (id: number): Promise<void> => {
  try {
    await db.delete(customersTable)
      .where(eq(customersTable.id, id))
      .execute();
  } catch (error) {
    console.error('Customer deletion failed:', error);
    throw error;
  }
};
