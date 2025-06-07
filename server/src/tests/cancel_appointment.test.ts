
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable, servicesTable, appointmentsTable } from '../db/schema';
import { cancelAppointment } from '../handlers/cancel_appointment';
import { eq } from 'drizzle-orm';

describe('cancelAppointment', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should cancel an appointment', async () => {
    // Create prerequisite data
    const [customer] = await db.insert(customersTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone: '555-0123'
      })
      .returning()
      .execute();

    const [service] = await db.insert(servicesTable)
      .values({
        name: 'Test Service',
        description: 'A test service',
        duration_minutes: 60,
        price: '99.99'
      })
      .returning()
      .execute();

    const [appointment] = await db.insert(appointmentsTable)
      .values({
        customer_id: customer.id,
        service_id: service.id,
        appointment_date: '2024-01-15',
        start_time: '10:00',
        end_time: '11:00',
        status: 'scheduled',
        notes: 'Initial appointment'
      })
      .returning()
      .execute();

    const result = await cancelAppointment(appointment.id);

    // Basic field validation
    expect(result.id).toEqual(appointment.id);
    expect(result.customer_id).toEqual(customer.id);
    expect(result.service_id).toEqual(service.id);
    expect(result.status).toEqual('cancelled');
    expect(result.appointment_date).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update appointment status in database', async () => {
    // Create prerequisite data
    const [customer] = await db.insert(customersTable)
      .values({
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@example.com',
        phone: '555-0456'
      })
      .returning()
      .execute();

    const [service] = await db.insert(servicesTable)
      .values({
        name: 'Hair Cut',
        description: 'Professional hair cutting service',
        duration_minutes: 45,
        price: '75.00'
      })
      .returning()
      .execute();

    const [appointment] = await db.insert(appointmentsTable)
      .values({
        customer_id: customer.id,
        service_id: service.id,
        appointment_date: '2024-02-20',
        start_time: '14:30',
        end_time: '15:15',
        status: 'confirmed'
      })
      .returning()
      .execute();

    await cancelAppointment(appointment.id);

    // Query database to verify status change
    const appointments = await db.select()
      .from(appointmentsTable)
      .where(eq(appointmentsTable.id, appointment.id))
      .execute();

    expect(appointments).toHaveLength(1);
    expect(appointments[0].status).toEqual('cancelled');
    expect(appointments[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent appointment', async () => {
    await expect(cancelAppointment(999)).rejects.toThrow(/not found/i);
  });

  it('should preserve other appointment fields when cancelling', async () => {
    // Create prerequisite data
    const [customer] = await db.insert(customersTable)
      .values({
        first_name: 'Bob',
        last_name: 'Wilson',
        email: 'bob.wilson@example.com',
        phone: '555-0789'
      })
      .returning()
      .execute();

    const [service] = await db.insert(servicesTable)
      .values({
        name: 'Massage',
        description: 'Relaxing massage therapy',
        duration_minutes: 90,
        price: '120.00'
      })
      .returning()
      .execute();

    const originalNotes = 'Special instructions for massage';
    const [appointment] = await db.insert(appointmentsTable)
      .values({
        customer_id: customer.id,
        service_id: service.id,
        appointment_date: '2024-03-10',
        start_time: '16:00',
        end_time: '17:30',
        status: 'scheduled',
        notes: originalNotes
      })
      .returning()
      .execute();

    const result = await cancelAppointment(appointment.id);

    // Verify all original fields are preserved
    expect(result.customer_id).toEqual(customer.id);
    expect(result.service_id).toEqual(service.id);
    expect(result.appointment_date).toEqual(new Date('2024-03-10'));
    expect(result.start_time).toEqual('16:00');
    expect(result.end_time).toEqual('17:30');
    expect(result.notes).toEqual(originalNotes);
    expect(result.status).toEqual('cancelled');
  });
});
