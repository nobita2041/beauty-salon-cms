
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable, servicesTable, serviceHistoryTable } from '../db/schema';
import { getServiceHistoryByCustomer } from '../handlers/get_service_history_by_customer';

describe('getServiceHistoryByCustomer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return service history for specific customer ordered by date desc', async () => {
    // Create test customer
    const customerResult = await db.insert(customersTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone: '555-1234',
        date_of_birth: '1990-01-01',
        notes: 'Test customer'
      })
      .returning()
      .execute();
    const customer = customerResult[0];

    // Create test service
    const serviceResult = await db.insert(servicesTable)
      .values({
        name: 'Haircut',
        description: 'Basic haircut service',
        duration_minutes: 30,
        price: '25.00'
      })
      .returning()
      .execute();
    const service = serviceResult[0];

    // Create service history records
    const historyResult = await db.insert(serviceHistoryTable)
      .values([
        {
          customer_id: customer.id,
          service_id: service.id,
          appointment_id: null,
          service_date: '2024-01-15',
          price_paid: '25.00',
          notes: 'First visit'
        },
        {
          customer_id: customer.id,
          service_id: service.id,
          appointment_id: null,
          service_date: '2024-02-15',
          price_paid: '30.00',
          notes: 'Second visit'
        }
      ])
      .returning()
      .execute();

    const result = await getServiceHistoryByCustomer(customer.id);

    expect(result).toHaveLength(2);
    
    // Should be ordered by service_date desc, so February (second visit) comes first
    expect(result[0].id).toBeDefined();
    expect(result[0].customer_id).toEqual(customer.id);
    expect(result[0].service_id).toEqual(service.id);
    expect(result[0].appointment_id).toBeNull();
    expect(result[0].service_date).toBeInstanceOf(Date);
    expect(result[0].service_date.toISOString().slice(0, 10)).toEqual('2024-02-15');
    expect(typeof result[0].price_paid).toBe('number');
    expect(result[0].price_paid).toEqual(30.00);
    expect(result[0].notes).toEqual('Second visit');
    expect(result[0].created_at).toBeInstanceOf(Date);

    // Check second record (January - first visit)
    expect(result[1].service_date.toISOString().slice(0, 10)).toEqual('2024-01-15');
    expect(result[1].price_paid).toEqual(25.00);
    expect(result[1].notes).toEqual('First visit');

    // Check customer details
    expect(result[0].customer.id).toEqual(customer.id);
    expect(result[0].customer.first_name).toEqual('John');
    expect(result[0].customer.last_name).toEqual('Doe');
    expect(result[0].customer.email).toEqual('john.doe@example.com');
    expect(result[0].customer.date_of_birth).toBeInstanceOf(Date);

    // Check service details
    expect(result[0].service.id).toEqual(service.id);
    expect(result[0].service.name).toEqual('Haircut');
    expect(result[0].service.description).toEqual('Basic haircut service');
    expect(typeof result[0].service.price).toBe('number');
    expect(result[0].service.price).toEqual(25.00);
  });

  it('should return empty array for customer with no service history', async () => {
    // Create test customer with no service history
    const customerResult = await db.insert(customersTable)
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
    const customer = customerResult[0];

    const result = await getServiceHistoryByCustomer(customer.id);

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should only return history for specified customer', async () => {
    // Create two customers
    const customer1Result = await db.insert(customersTable)
      .values({
        first_name: 'Customer',
        last_name: 'One',
        email: 'customer1@example.com',
        phone: '555-0001',
        date_of_birth: null,
        notes: null
      })
      .returning()
      .execute();

    const customer2Result = await db.insert(customersTable)
      .values({
        first_name: 'Customer',
        last_name: 'Two',
        email: 'customer2@example.com',
        phone: '555-0002',
        date_of_birth: null,
        notes: null
      })
      .returning()
      .execute();

    const customer1 = customer1Result[0];
    const customer2 = customer2Result[0];

    // Create test service
    const serviceResult = await db.insert(servicesTable)
      .values({
        name: 'Manicure',
        description: 'Nail service',
        duration_minutes: 45,
        price: '35.00'
      })
      .returning()
      .execute();
    const service = serviceResult[0];

    // Create service history for both customers
    await db.insert(serviceHistoryTable)
      .values([
        {
          customer_id: customer1.id,
          service_id: service.id,
          appointment_id: null,
          service_date: '2024-01-10',
          price_paid: '35.00',
          notes: 'Customer 1 service'
        },
        {
          customer_id: customer2.id,
          service_id: service.id,
          appointment_id: null,
          service_date: '2024-01-11',
          price_paid: '40.00',
          notes: 'Customer 2 service'
        }
      ])
      .execute();

    const result = await getServiceHistoryByCustomer(customer1.id);

    expect(result).toHaveLength(1);
    expect(result[0].customer_id).toEqual(customer1.id);
    expect(result[0].customer.first_name).toEqual('Customer');
    expect(result[0].customer.last_name).toEqual('One');
    expect(result[0].notes).toEqual('Customer 1 service');
  });

  it('should handle customer with null date_of_birth', async () => {
    // Create customer with null date_of_birth
    const customerResult = await db.insert(customersTable)
      .values({
        first_name: 'Test',
        last_name: 'User',
        email: 'test.user@example.com',
        phone: '555-9999',
        date_of_birth: null,
        notes: null
      })
      .returning()
      .execute();
    const customer = customerResult[0];

    // Create test service
    const serviceResult = await db.insert(servicesTable)
      .values({
        name: 'Consultation',
        description: null,
        duration_minutes: 15,
        price: '0.00'
      })
      .returning()
      .execute();
    const service = serviceResult[0];

    // Create service history record
    await db.insert(serviceHistoryTable)
      .values({
        customer_id: customer.id,
        service_id: service.id,
        appointment_id: null,
        service_date: '2024-03-01',
        price_paid: '0.00',
        notes: null
      })
      .execute();

    const result = await getServiceHistoryByCustomer(customer.id);

    expect(result).toHaveLength(1);
    expect(result[0].customer.date_of_birth).toBeNull();
    expect(result[0].service.description).toBeNull();
    expect(result[0].notes).toBeNull();
    expect(result[0].price_paid).toEqual(0.00);
  });
});
