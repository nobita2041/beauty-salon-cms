
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable } from '../db/schema';
import { type SearchCustomersInput } from '../schema';
import { searchCustomers } from '../handlers/search_customers';

const testCustomers = [
  {
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    phone: '555-0123',
    date_of_birth: null,
    notes: null
  },
  {
    first_name: 'Jane',
    last_name: 'Smith',
    email: 'jane.smith@example.com',
    phone: '555-0124',
    date_of_birth: null,
    notes: null
  },
  {
    first_name: 'Bob',
    last_name: 'Johnson',
    email: 'bob.johnson@test.com',
    phone: '555-0125',
    date_of_birth: null,
    notes: null
  }
];

describe('searchCustomers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should search customers by first name', async () => {
    // Create test customers
    await db.insert(customersTable).values(testCustomers).execute();

    const input: SearchCustomersInput = {
      query: 'Jane',
      limit: 20
    };

    const results = await searchCustomers(input);

    expect(results).toHaveLength(1);
    expect(results[0].first_name).toEqual('Jane');
    expect(results[0].last_name).toEqual('Smith');
    expect(results[0].email).toEqual('jane.smith@example.com');
    expect(results[0].id).toBeDefined();
    expect(results[0].created_at).toBeInstanceOf(Date);
    expect(results[0].updated_at).toBeInstanceOf(Date);
  });

  it('should search customers by last name', async () => {
    await db.insert(customersTable).values(testCustomers).execute();

    const input: SearchCustomersInput = {
      query: 'Smith',
      limit: 20
    };

    const results = await searchCustomers(input);

    expect(results).toHaveLength(1);
    expect(results[0].first_name).toEqual('Jane');
    expect(results[0].last_name).toEqual('Smith');
  });

  it('should search customers by email', async () => {
    await db.insert(customersTable).values(testCustomers).execute();

    const input: SearchCustomersInput = {
      query: 'test.com',
      limit: 20
    };

    const results = await searchCustomers(input);

    expect(results).toHaveLength(1);
    expect(results[0].first_name).toEqual('Bob');
    expect(results[0].email).toEqual('bob.johnson@test.com');
  });

  it('should perform case-insensitive search', async () => {
    await db.insert(customersTable).values(testCustomers).execute();

    const input: SearchCustomersInput = {
      query: 'JANE',
      limit: 20
    };

    const results = await searchCustomers(input);

    expect(results).toHaveLength(1);
    expect(results[0].first_name).toEqual('Jane');
  });

  it('should return multiple matching customers', async () => {
    await db.insert(customersTable).values(testCustomers).execute();

    const input: SearchCustomersInput = {
      query: 'example.com',
      limit: 20
    };

    const results = await searchCustomers(input);

    expect(results).toHaveLength(2);
    expect(results.some(c => c.first_name === 'John')).toBe(true);
    expect(results.some(c => c.first_name === 'Jane')).toBe(true);
  });

  it('should respect the limit parameter', async () => {
    await db.insert(customersTable).values(testCustomers).execute();

    const input: SearchCustomersInput = {
      query: 'example.com',
      limit: 1
    };

    const results = await searchCustomers(input);

    expect(results).toHaveLength(1);
  });

  it('should return empty array when no matches found', async () => {
    await db.insert(customersTable).values(testCustomers).execute();

    const input: SearchCustomersInput = {
      query: 'nonexistent',
      limit: 20
    };

    const results = await searchCustomers(input);

    expect(results).toHaveLength(0);
  });

  it('should handle partial matches including cross-field matches', async () => {
    await db.insert(customersTable).values(testCustomers).execute();

    const input: SearchCustomersInput = {
      query: 'Jo',
      limit: 20
    };

    const results = await searchCustomers(input);

    expect(results).toHaveLength(2);
    expect(results.some(c => c.first_name === 'John')).toBe(true);
    expect(results.some(c => c.last_name === 'Johnson')).toBe(true);
  });
});
