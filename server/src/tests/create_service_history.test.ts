
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { serviceHistoryTable, customersTable, servicesTable, appointmentsTable } from '../db/schema';
import { type CreateServiceHistoryInput } from '../schema';
import { createServiceHistory } from '../handlers/create_service_history';
import { eq } from 'drizzle-orm';

describe('createServiceHistory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let customerId: number;
  let serviceId: number;
  let appointmentId: number;

  beforeEach(async () => {
    // Create test customer
    const customerResult = await db.insert(customersTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone: '555-0123',
        date_of_birth: '1985-06-15', // Use string format for date column
        notes: null
      })
      .returning()
      .execute();
    customerId = customerResult[0].id;

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
    serviceId = serviceResult[0].id;

    // Create test appointment
    const appointmentResult = await db.insert(appointmentsTable)
      .values({
        customer_id: customerId,
        service_id: serviceId,
        appointment_date: '2024-01-15', // Use string format for date column
        start_time: '10:00',
        end_time: '10:30',
        status: 'completed',
        notes: null
      })
      .returning()
      .execute();
    appointmentId = appointmentResult[0].id;
  });

  const testInput: CreateServiceHistoryInput = {
    customer_id: 0, // Will be set in test
    service_id: 0, // Will be set in test
    appointment_id: 0, // Will be set in test
    service_date: new Date('2024-01-15'),
    price_paid: 25.00,
    notes: 'Service completed successfully'
  };

  it('should create a service history record', async () => {
    const input = {
      ...testInput,
      customer_id: customerId,
      service_id: serviceId,
      appointment_id: appointmentId
    };
    
    const result = await createServiceHistory(input);

    // Basic field validation
    expect(result.customer_id).toEqual(customerId);
    expect(result.service_id).toEqual(serviceId);
    expect(result.appointment_id).toEqual(appointmentId);
    expect(result.service_date).toEqual(new Date('2024-01-15'));
    expect(result.price_paid).toEqual(25.00);
    expect(typeof result.price_paid).toBe('number');
    expect(result.notes).toEqual('Service completed successfully');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save service history to database', async () => {
    const input = {
      ...testInput,
      customer_id: customerId,
      service_id: serviceId,
      appointment_id: appointmentId
    };
    
    const result = await createServiceHistory(input);

    // Query using proper drizzle syntax
    const serviceHistories = await db.select()
      .from(serviceHistoryTable)
      .where(eq(serviceHistoryTable.id, result.id))
      .execute();

    expect(serviceHistories).toHaveLength(1);
    expect(serviceHistories[0].customer_id).toEqual(customerId);
    expect(serviceHistories[0].service_id).toEqual(serviceId);
    expect(serviceHistories[0].appointment_id).toEqual(appointmentId);
    expect(serviceHistories[0].service_date).toEqual('2024-01-15');
    expect(parseFloat(serviceHistories[0].price_paid)).toEqual(25.00);
    expect(serviceHistories[0].notes).toEqual('Service completed successfully');
    expect(serviceHistories[0].created_at).toBeInstanceOf(Date);
  });

  it('should create service history without appointment_id', async () => {
    const input = {
      ...testInput,
      customer_id: customerId,
      service_id: serviceId,
      appointment_id: null
    };
    
    const result = await createServiceHistory(input);

    expect(result.customer_id).toEqual(customerId);
    expect(result.service_id).toEqual(serviceId);
    expect(result.appointment_id).toBeNull();
    expect(result.service_date).toEqual(new Date('2024-01-15'));
    expect(result.price_paid).toEqual(25.00);
    expect(result.id).toBeDefined();
  });

  it('should throw error for non-existent customer', async () => {
    const input = {
      ...testInput,
      customer_id: 99999,
      service_id: serviceId,
      appointment_id: appointmentId
    };

    await expect(createServiceHistory(input)).rejects.toThrow(/customer with id 99999 not found/i);
  });

  it('should throw error for non-existent service', async () => {
    const input = {
      ...testInput,
      customer_id: customerId,
      service_id: 99999,
      appointment_id: appointmentId
    };

    await expect(createServiceHistory(input)).rejects.toThrow(/service with id 99999 not found/i);
  });

  it('should throw error for non-existent appointment', async () => {
    const input = {
      ...testInput,
      customer_id: customerId,
      service_id: serviceId,
      appointment_id: 99999
    };

    await expect(createServiceHistory(input)).rejects.toThrow(/appointment with id 99999 not found/i);
  });
});
