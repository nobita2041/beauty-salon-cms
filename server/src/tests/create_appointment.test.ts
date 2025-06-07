
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { appointmentsTable, customersTable, servicesTable } from '../db/schema';
import { type CreateAppointmentInput } from '../schema';
import { createAppointment } from '../handlers/create_appointment';
import { eq } from 'drizzle-orm';

describe('createAppointment', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an appointment with valid customer and service', async () => {
    // Create prerequisite customer
    const customerResult = await db.insert(customersTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone: '555-0123',
        date_of_birth: null,
        notes: null
      })
      .returning()
      .execute();

    // Create prerequisite service
    const serviceResult = await db.insert(servicesTable)
      .values({
        name: 'Haircut',
        description: 'Basic haircut service',
        duration_minutes: 30,
        price: '25.00'
      })
      .returning()
      .execute();

    const testInput: CreateAppointmentInput = {
      customer_id: customerResult[0].id,
      service_id: serviceResult[0].id,
      appointment_date: new Date('2024-01-15'),
      start_time: '10:00',
      end_time: '10:30',
      notes: 'First appointment'
    };

    const result = await createAppointment(testInput);

    // Basic field validation
    expect(result.customer_id).toEqual(customerResult[0].id);
    expect(result.service_id).toEqual(serviceResult[0].id);
    expect(result.appointment_date).toEqual(new Date('2024-01-15'));
    expect(result.start_time).toEqual('10:00');
    expect(result.end_time).toEqual('10:30');
    expect(result.status).toEqual('scheduled'); // Default status
    expect(result.notes).toEqual('First appointment');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save appointment to database', async () => {
    // Create prerequisite customer
    const customerResult = await db.insert(customersTable)
      .values({
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@example.com',
        phone: '555-0456',
        date_of_birth: null,
        notes: null
      })
      .returning()
      .execute();

    // Create prerequisite service
    const serviceResult = await db.insert(servicesTable)
      .values({
        name: 'Manicure',
        description: 'Basic manicure service',
        duration_minutes: 45,
        price: '30.00'
      })
      .returning()
      .execute();

    const testInput: CreateAppointmentInput = {
      customer_id: customerResult[0].id,
      service_id: serviceResult[0].id,
      appointment_date: new Date('2024-02-20'),
      start_time: '14:00',
      end_time: '14:45',
      notes: null
    };

    const result = await createAppointment(testInput);

    // Query database to verify appointment was saved
    const appointments = await db.select()
      .from(appointmentsTable)
      .where(eq(appointmentsTable.id, result.id))
      .execute();

    expect(appointments).toHaveLength(1);
    expect(appointments[0].customer_id).toEqual(customerResult[0].id);
    expect(appointments[0].service_id).toEqual(serviceResult[0].id);
    expect(new Date(appointments[0].appointment_date)).toEqual(new Date('2024-02-20'));
    expect(appointments[0].start_time).toEqual('14:00');
    expect(appointments[0].end_time).toEqual('14:45');
    expect(appointments[0].status).toEqual('scheduled');
    expect(appointments[0].notes).toBeNull();
    expect(appointments[0].created_at).toBeInstanceOf(Date);
    expect(appointments[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent customer', async () => {
    // Create prerequisite service
    const serviceResult = await db.insert(servicesTable)
      .values({
        name: 'Facial',
        description: 'Basic facial service',
        duration_minutes: 60,
        price: '45.00'
      })
      .returning()
      .execute();

    const testInput: CreateAppointmentInput = {
      customer_id: 999, // Non-existent customer ID
      service_id: serviceResult[0].id,
      appointment_date: new Date('2024-03-10'),
      start_time: '09:00',
      end_time: '10:00',
      notes: null
    };

    expect(createAppointment(testInput)).rejects.toThrow(/customer with id 999 not found/i);
  });

  it('should throw error for non-existent service', async () => {
    // Create prerequisite customer
    const customerResult = await db.insert(customersTable)
      .values({
        first_name: 'Bob',
        last_name: 'Johnson',
        email: 'bob.johnson@example.com',
        phone: '555-0789',
        date_of_birth: null,
        notes: null
      })
      .returning()
      .execute();

    const testInput: CreateAppointmentInput = {
      customer_id: customerResult[0].id,
      service_id: 999, // Non-existent service ID
      appointment_date: new Date('2024-04-05'),
      start_time: '11:00',
      end_time: '12:00',
      notes: null
    };

    expect(createAppointment(testInput)).rejects.toThrow(/service with id 999 not found/i);
  });
});
