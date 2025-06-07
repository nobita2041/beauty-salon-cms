
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable } from '../db/schema';
import { type CreateCustomerInput } from '../schema';
import { createCustomer } from '../handlers/create_customer';
import { eq } from 'drizzle-orm';

const testInput: CreateCustomerInput = {
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  phone: '+1234567890',
  date_of_birth: new Date('1990-01-01'),
  notes: 'Test customer notes'
};

describe('createCustomer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a customer with all fields', async () => {
    const result = await createCustomer(testInput);

    expect(result.first_name).toEqual('John');
    expect(result.last_name).toEqual('Doe');
    expect(result.email).toEqual('john.doe@example.com');
    expect(result.phone).toEqual('+1234567890');
    expect(result.date_of_birth).toEqual(new Date('1990-01-01'));
    expect(result.notes).toEqual('Test customer notes');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a customer with nullable fields as null', async () => {
    const inputWithNulls: CreateCustomerInput = {
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane.smith@example.com',
      phone: '+0987654321',
      date_of_birth: null,
      notes: null
    };

    const result = await createCustomer(inputWithNulls);

    expect(result.first_name).toEqual('Jane');
    expect(result.last_name).toEqual('Smith');
    expect(result.email).toEqual('jane.smith@example.com');
    expect(result.phone).toEqual('+0987654321');
    expect(result.date_of_birth).toBeNull();
    expect(result.notes).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save customer to database', async () => {
    const result = await createCustomer(testInput);

    const customers = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, result.id))
      .execute();

    expect(customers).toHaveLength(1);
    expect(customers[0].first_name).toEqual('John');
    expect(customers[0].last_name).toEqual('Doe');
    expect(customers[0].email).toEqual('john.doe@example.com');
    expect(customers[0].phone).toEqual('+1234567890');
    expect(customers[0].date_of_birth).toEqual('1990-01-01');
    expect(customers[0].notes).toEqual('Test customer notes');
    expect(customers[0].created_at).toBeInstanceOf(Date);
    expect(customers[0].updated_at).toBeInstanceOf(Date);
  });

  it('should enforce unique email constraint', async () => {
    await createCustomer(testInput);

    const duplicateInput: CreateCustomerInput = {
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'john.doe@example.com', // Same email
      phone: '+0987654321',
      date_of_birth: null,
      notes: null
    };

    await expect(createCustomer(duplicateInput)).rejects.toThrow(/unique constraint/i);
  });
});
