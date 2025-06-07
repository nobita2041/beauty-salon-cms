
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable } from '../db/schema';
import { type CreateCustomerInput, type UpdateCustomerInput } from '../schema';
import { updateCustomer } from '../handlers/update_customer';
import { eq } from 'drizzle-orm';

// Test customer data
const testCustomer: CreateCustomerInput = {
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  phone: '+1234567890',
  date_of_birth: new Date('1990-01-01'),
  notes: 'Test customer'
};

const createTestCustomer = async () => {
  const result = await db.insert(customersTable)
    .values({
      first_name: testCustomer.first_name,
      last_name: testCustomer.last_name,
      email: testCustomer.email,
      phone: testCustomer.phone,
      date_of_birth: testCustomer.date_of_birth ? testCustomer.date_of_birth.toISOString().split('T')[0] : null,
      notes: testCustomer.notes
    })
    .returning()
    .execute();
  
  // Convert date string back to Date object
  const customer = result[0];
  return {
    ...customer,
    date_of_birth: customer.date_of_birth ? new Date(customer.date_of_birth) : null
  };
};

describe('updateCustomer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update customer fields', async () => {
    const customer = await createTestCustomer();
    
    const updateInput: UpdateCustomerInput = {
      id: customer.id,
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane.smith@example.com'
    };

    const result = await updateCustomer(updateInput);

    expect(result.id).toEqual(customer.id);
    expect(result.first_name).toEqual('Jane');
    expect(result.last_name).toEqual('Smith');
    expect(result.email).toEqual('jane.smith@example.com');
    expect(result.phone).toEqual(testCustomer.phone); // Unchanged
    expect(result.date_of_birth).toEqual(testCustomer.date_of_birth); // Unchanged
    expect(result.notes).toEqual(testCustomer.notes); // Unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(customer.updated_at.getTime());
  });

  it('should update only provided fields', async () => {
    const customer = await createTestCustomer();
    
    const updateInput: UpdateCustomerInput = {
      id: customer.id,
      phone: '+0987654321'
    };

    const result = await updateCustomer(updateInput);

    expect(result.id).toEqual(customer.id);
    expect(result.first_name).toEqual(testCustomer.first_name); // Unchanged
    expect(result.last_name).toEqual(testCustomer.last_name); // Unchanged
    expect(result.email).toEqual(testCustomer.email); // Unchanged
    expect(result.phone).toEqual('+0987654321'); // Updated
    expect(result.date_of_birth).toEqual(testCustomer.date_of_birth); // Unchanged
    expect(result.notes).toEqual(testCustomer.notes); // Unchanged
  });

  it('should handle null values correctly', async () => {
    const customer = await createTestCustomer();
    
    const updateInput: UpdateCustomerInput = {
      id: customer.id,
      date_of_birth: null,
      notes: null
    };

    const result = await updateCustomer(updateInput);

    expect(result.id).toEqual(customer.id);
    expect(result.date_of_birth).toBeNull();
    expect(result.notes).toBeNull();
    expect(result.first_name).toEqual(testCustomer.first_name); // Unchanged
    expect(result.email).toEqual(testCustomer.email); // Unchanged
  });

  it('should save updated data to database', async () => {
    const customer = await createTestCustomer();
    
    const updateInput: UpdateCustomerInput = {
      id: customer.id,
      first_name: 'Updated Name',
      email: 'updated@example.com'
    };

    await updateCustomer(updateInput);

    // Verify changes were persisted
    const customers = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, customer.id))
      .execute();

    expect(customers).toHaveLength(1);
    expect(customers[0].first_name).toEqual('Updated Name');
    expect(customers[0].email).toEqual('updated@example.com');
    expect(customers[0].last_name).toEqual(testCustomer.last_name); // Unchanged
    expect(customers[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent customer', async () => {
    const updateInput: UpdateCustomerInput = {
      id: 999999,
      first_name: 'Test'
    };

    await expect(updateCustomer(updateInput)).rejects.toThrow(/Customer with id 999999 not found/i);
  });

  it('should update customer with all fields', async () => {
    const customer = await createTestCustomer();
    
    const updateInput: UpdateCustomerInput = {
      id: customer.id,
      first_name: 'Updated First',
      last_name: 'Updated Last',
      email: 'updated@test.com',
      phone: '+9999999999',
      date_of_birth: new Date('1985-12-25'),
      notes: 'Updated notes'
    };

    const result = await updateCustomer(updateInput);

    expect(result.first_name).toEqual('Updated First');
    expect(result.last_name).toEqual('Updated Last');
    expect(result.email).toEqual('updated@test.com');
    expect(result.phone).toEqual('+9999999999');
    expect(result.date_of_birth).toEqual(new Date('1985-12-25'));
    expect(result.notes).toEqual('Updated notes');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should handle date conversion correctly', async () => {
    const customer = await createTestCustomer();
    const newDate = new Date('1995-06-15');
    
    const updateInput: UpdateCustomerInput = {
      id: customer.id,
      date_of_birth: newDate
    };

    const result = await updateCustomer(updateInput);

    expect(result.date_of_birth).toEqual(newDate);
    expect(result.date_of_birth).toBeInstanceOf(Date);
    
    // Verify the date was stored correctly in the database
    const customers = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, customer.id))
      .execute();

    expect(customers[0].date_of_birth).toEqual('1995-06-15');
  });
});
