
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable } from '../db/schema';
import { getCustomerById } from '../handlers/get_customer_by_id';

describe('getCustomerById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return customer when found', async () => {
    // Create a customer first - convert Date to string for database
    const insertResult = await db.insert(customersTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone: '555-1234',
        date_of_birth: '1990-01-15', // Use string format for database
        notes: 'Test customer'
      })
      .returning()
      .execute();

    const createdCustomer = insertResult[0];

    // Get the customer by ID
    const result = await getCustomerById(createdCustomer.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdCustomer.id);
    expect(result!.first_name).toEqual('John');
    expect(result!.last_name).toEqual('Doe');
    expect(result!.email).toEqual('john.doe@example.com');
    expect(result!.phone).toEqual('555-1234');
    expect(result!.date_of_birth).toBeInstanceOf(Date);
    expect(result!.date_of_birth!.getFullYear()).toEqual(1990);
    expect(result!.date_of_birth!.getMonth()).toEqual(0); // January is 0
    expect(result!.date_of_birth!.getDate()).toEqual(15);
    expect(result!.notes).toEqual('Test customer');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when customer not found', async () => {
    const result = await getCustomerById(999);

    expect(result).toBeNull();
  });

  it('should handle customer with null date_of_birth', async () => {
    // Create customer without date_of_birth
    const insertResult = await db.insert(customersTable)
      .values({
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@example.com',
        phone: '555-5678',
        date_of_birth: null,
        notes: null
      })
      .returning()
      .execute();

    const createdCustomer = insertResult[0];

    // Get the customer by ID
    const result = await getCustomerById(createdCustomer.id);

    expect(result).not.toBeNull();
    expect(result!.date_of_birth).toBeNull();
    expect(result!.notes).toBeNull();
    expect(result!.first_name).toEqual('Jane');
    expect(result!.last_name).toEqual('Smith');
  });

  it('should handle multiple customers and return correct one', async () => {
    // Create multiple customers
    const customer1 = await db.insert(customersTable)
      .values({
        first_name: 'Alice',
        last_name: 'Johnson',
        email: 'alice@example.com',
        phone: '555-1111',
        date_of_birth: '1985-03-20',
        notes: 'First customer'
      })
      .returning()
      .execute();

    const customer2 = await db.insert(customersTable)
      .values({
        first_name: 'Bob',
        last_name: 'Williams',
        email: 'bob@example.com',
        phone: '555-2222',
        date_of_birth: '1992-07-10',
        notes: 'Second customer'
      })
      .returning()
      .execute();

    // Get the second customer
    const result = await getCustomerById(customer2[0].id);

    expect(result).not.toBeNull();
    expect(result!.first_name).toEqual('Bob');
    expect(result!.last_name).toEqual('Williams');
    expect(result!.email).toEqual('bob@example.com');
    expect(result!.notes).toEqual('Second customer');
  });
});
