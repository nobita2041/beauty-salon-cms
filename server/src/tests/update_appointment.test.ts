
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable, servicesTable, appointmentsTable } from '../db/schema';
import { type UpdateAppointmentInput } from '../schema';
import { updateAppointment } from '../handlers/update_appointment';
import { eq } from 'drizzle-orm';

describe('updateAppointment', () => {
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
        date_of_birth: '1990-01-01',
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
        appointment_date: '2024-01-15',
        start_time: '10:00',
        end_time: '10:30',
        status: 'scheduled',
        notes: 'Initial appointment'
      })
      .returning()
      .execute();
    appointmentId = appointmentResult[0].id;
  });

  it('should update appointment status', async () => {
    const updateInput: UpdateAppointmentInput = {
      id: appointmentId,
      status: 'confirmed'
    };

    const result = await updateAppointment(updateInput);

    expect(result.id).toEqual(appointmentId);
    expect(result.status).toEqual('confirmed');
    expect(result.customer_id).toEqual(customerId);
    expect(result.service_id).toEqual(serviceId);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.appointment_date).toBeInstanceOf(Date);
  });

  it('should update appointment time', async () => {
    const updateInput: UpdateAppointmentInput = {
      id: appointmentId,
      start_time: '14:00',
      end_time: '14:30'
    };

    const result = await updateAppointment(updateInput);

    expect(result.id).toEqual(appointmentId);
    expect(result.start_time).toEqual('14:00');
    expect(result.end_time).toEqual('14:30');
    expect(result.status).toEqual('scheduled'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.appointment_date).toBeInstanceOf(Date);
  });

  it('should update appointment date', async () => {
    const newDate = new Date('2024-01-20');
    const updateInput: UpdateAppointmentInput = {
      id: appointmentId,
      appointment_date: newDate
    };

    const result = await updateAppointment(updateInput);

    expect(result.id).toEqual(appointmentId);
    expect(result.appointment_date).toBeInstanceOf(Date);
    expect(result.appointment_date.toISOString().split('T')[0]).toEqual('2024-01-20');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update appointment notes', async () => {
    const updateInput: UpdateAppointmentInput = {
      id: appointmentId,
      notes: 'Updated appointment notes'
    };

    const result = await updateAppointment(updateInput);

    expect(result.id).toEqual(appointmentId);
    expect(result.notes).toEqual('Updated appointment notes');
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.appointment_date).toBeInstanceOf(Date);
  });

  it('should update multiple fields at once', async () => {
    const updateInput: UpdateAppointmentInput = {
      id: appointmentId,
      status: 'completed',
      start_time: '09:00',
      end_time: '09:30',
      notes: 'Completed successfully'
    };

    const result = await updateAppointment(updateInput);

    expect(result.id).toEqual(appointmentId);
    expect(result.status).toEqual('completed');
    expect(result.start_time).toEqual('09:00');
    expect(result.end_time).toEqual('09:30');
    expect(result.notes).toEqual('Completed successfully');
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.appointment_date).toBeInstanceOf(Date);
  });

  it('should save changes to database', async () => {
    const updateInput: UpdateAppointmentInput = {
      id: appointmentId,
      status: 'in_progress',
      notes: 'Service in progress'
    };

    await updateAppointment(updateInput);

    // Query database to verify changes
    const appointments = await db.select()
      .from(appointmentsTable)
      .where(eq(appointmentsTable.id, appointmentId))
      .execute();

    expect(appointments).toHaveLength(1);
    expect(appointments[0].status).toEqual('in_progress');
    expect(appointments[0].notes).toEqual('Service in progress');
    expect(appointments[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent appointment', async () => {
    const updateInput: UpdateAppointmentInput = {
      id: 99999,
      status: 'confirmed'
    };

    expect(updateAppointment(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should update appointment with different service', async () => {
    // Create another service
    const serviceResult = await db.insert(servicesTable)
      .values({
        name: 'Shampoo',
        description: 'Hair wash service',
        duration_minutes: 15,
        price: '15.00'
      })
      .returning()
      .execute();

    const updateInput: UpdateAppointmentInput = {
      id: appointmentId,
      service_id: serviceResult[0].id
    };

    const result = await updateAppointment(updateInput);

    expect(result.id).toEqual(appointmentId);
    expect(result.service_id).toEqual(serviceResult[0].id);
    expect(result.customer_id).toEqual(customerId); // Should remain unchanged
    expect(result.appointment_date).toBeInstanceOf(Date);
  });

  it('should update appointment with different customer', async () => {
    // Create another customer
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

    const updateInput: UpdateAppointmentInput = {
      id: appointmentId,
      customer_id: customerResult[0].id
    };

    const result = await updateAppointment(updateInput);

    expect(result.id).toEqual(appointmentId);
    expect(result.customer_id).toEqual(customerResult[0].id);
    expect(result.service_id).toEqual(serviceId); // Should remain unchanged
    expect(result.appointment_date).toBeInstanceOf(Date);
  });
});
