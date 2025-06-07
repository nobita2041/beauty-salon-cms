
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable } from '../db/schema';
import { deleteCustomer } from '../handlers/delete_customer';
import { eq } from 'drizzle-orm';

// Test customer data for database insertion
const testCustomerData = {
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  phone: '555-1234',
  date_of_birth: '1990-01-01', // String format for date column
  notes: 'Test customer'
};

describe('deleteCustomer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a customer', async () => {
    // Create a customer first
    const createdCustomers = await db.insert(customersTable)
      .values(testCustomerData)
      .returning()
      .execute();
    
    const customerId = createdCustomers[0].id;

    // Verify customer exists
    const beforeDelete = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, customerId))
      .execute();
    
    expect(beforeDelete).toHaveLength(1);

    // Delete the customer
    await deleteCustomer(customerId);

    // Verify customer is deleted
    const afterDelete = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, customerId))
      .execute();
    
    expect(afterDelete).toHaveLength(0);
  });

  it('should not throw error when deleting non-existent customer', async () => {
    const nonExistentId = 999;

    // Should not throw an error
    await expect(deleteCustomer(nonExistentId)).resolves.toBeUndefined();
  });

  it('should handle multiple customer deletions', async () => {
    // Create multiple customers
    const customer1 = await db.insert(customersTable)
      .values({
        ...testCustomerData,
        email: 'customer1@example.com'
      })
      .returning()
      .execute();

    const customer2 = await db.insert(customersTable)
      .values({
        ...testCustomerData,
        email: 'customer2@example.com'
      })
      .returning()
      .execute();

    const customerId1 = customer1[0].id;
    const customerId2 = customer2[0].id;

    // Delete first customer
    await deleteCustomer(customerId1);

    // Verify only first customer is deleted
    const remainingCustomers = await db.select()
      .from(customersTable)
      .execute();

    expect(remainingCustomers).toHaveLength(1);
    expect(remainingCustomers[0].id).toEqual(customerId2);

    // Delete second customer
    await deleteCustomer(customerId2);

    // Verify all customers are deleted
    const allCustomers = await db.select()
      .from(customersTable)
      .execute();

    expect(allCustomers).toHaveLength(0);
  });
});
