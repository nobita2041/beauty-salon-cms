
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable } from '../db/schema';
import { getCustomers } from '../handlers/get_customers';

describe('getCustomers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no customers exist', async () => {
    const result = await getCustomers();
    expect(result).toEqual([]);
  });

  it('should return all customers', async () => {
    // Create test customers
    await db.insert(customersTable)
      .values([
        {
          first_name: 'John',
          last_name: 'Doe',
          email: 'john.doe@example.com',
          phone: '555-1234',
          date_of_birth: '1990-01-01',
          notes: 'First customer'
        },
        {
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane.smith@example.com',
          phone: '555-5678',
          date_of_birth: null,
          notes: null
        }
      ])
      .execute();

    const result = await getCustomers();

    expect(result).toHaveLength(2);
    
    // Check first customer
    const johnCustomer = result.find(c => c.first_name === 'John');
    expect(johnCustomer).toBeDefined();
    expect(johnCustomer?.last_name).toEqual('Doe');
    expect(johnCustomer?.email).toEqual('john.doe@example.com');
    expect(johnCustomer?.phone).toEqual('555-1234');
    expect(johnCustomer?.date_of_birth).toEqual(new Date('1990-01-01'));
    expect(johnCustomer?.notes).toEqual('First customer');
    expect(johnCustomer?.id).toBeDefined();
    expect(johnCustomer?.created_at).toBeInstanceOf(Date);
    expect(johnCustomer?.updated_at).toBeInstanceOf(Date);

    // Check second customer
    const janeCustomer = result.find(c => c.first_name === 'Jane');
    expect(janeCustomer).toBeDefined();
    expect(janeCustomer?.last_name).toEqual('Smith');
    expect(janeCustomer?.email).toEqual('jane.smith@example.com');
    expect(janeCustomer?.phone).toEqual('555-5678');
    expect(janeCustomer?.date_of_birth).toBeNull();
    expect(janeCustomer?.notes).toBeNull();
    expect(janeCustomer?.id).toBeDefined();
    expect(janeCustomer?.created_at).toBeInstanceOf(Date);
    expect(janeCustomer?.updated_at).toBeInstanceOf(Date);
  });

  it('should return customers with proper field types', async () => {
    await db.insert(customersTable)
      .values({
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        phone: '555-0000',
        date_of_birth: '1985-05-15',
        notes: 'Test notes'
      })
      .execute();

    const result = await getCustomers();

    expect(result).toHaveLength(1);
    const customer = result[0];
    
    expect(typeof customer.id).toBe('number');
    expect(typeof customer.first_name).toBe('string');
    expect(typeof customer.last_name).toBe('string');
    expect(typeof customer.email).toBe('string');
    expect(typeof customer.phone).toBe('string');
    expect(customer.date_of_birth).toBeInstanceOf(Date);
    expect(typeof customer.notes).toBe('string');
    expect(customer.created_at).toBeInstanceOf(Date);
    expect(customer.updated_at).toBeInstanceOf(Date);
  });
});
