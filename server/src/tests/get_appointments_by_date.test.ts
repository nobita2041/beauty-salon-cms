
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable, servicesTable, appointmentsTable } from '../db/schema';
import { getAppointmentsByDate } from '../handlers/get_appointments_by_date';

describe('getAppointmentsByDate', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return appointments for a specific date', async () => {
    // Create prerequisite data
    const customer = await db.insert(customersTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
        date_of_birth: '1990-01-01', // Use string format for date
        notes: null
      })
      .returning()
      .execute();

    const service = await db.insert(servicesTable)
      .values({
        name: 'Haircut',
        description: 'Professional haircut',
        duration_minutes: 30,
        price: '25.00'
      })
      .returning()
      .execute();

    const appointmentDate = new Date('2024-01-15');
    
    // Create appointment
    await db.insert(appointmentsTable)
      .values({
        customer_id: customer[0].id,
        service_id: service[0].id,
        appointment_date: appointmentDate.toISOString().split('T')[0], // Convert Date to string
        start_time: '10:00',
        end_time: '10:30',
        status: 'scheduled',
        notes: 'Regular appointment'
      })
      .execute();

    const results = await getAppointmentsByDate(appointmentDate);

    expect(results).toHaveLength(1);
    
    const appointment = results[0];
    expect(appointment.id).toBeDefined();
    expect(appointment.customer_id).toEqual(customer[0].id);
    expect(appointment.service_id).toEqual(service[0].id);
    expect(appointment.appointment_date).toEqual(appointmentDate);
    expect(appointment.start_time).toEqual('10:00');
    expect(appointment.end_time).toEqual('10:30');
    expect(appointment.status).toEqual('scheduled');
    expect(appointment.notes).toEqual('Regular appointment');

    // Verify customer details
    expect(appointment.customer.id).toEqual(customer[0].id);
    expect(appointment.customer.first_name).toEqual('John');
    expect(appointment.customer.last_name).toEqual('Doe');
    expect(appointment.customer.email).toEqual('john@example.com');
    expect(appointment.customer.date_of_birth).toEqual(new Date('1990-01-01'));

    // Verify service details
    expect(appointment.service.id).toEqual(service[0].id);
    expect(appointment.service.name).toEqual('Haircut');
    expect(appointment.service.description).toEqual('Professional haircut');
    expect(appointment.service.duration_minutes).toEqual(30);
    expect(appointment.service.price).toEqual(25.00);
    expect(typeof appointment.service.price).toBe('number');
  });

  it('should return empty array when no appointments exist for date', async () => {
    const nonExistentDate = new Date('2024-12-31');
    
    const results = await getAppointmentsByDate(nonExistentDate);

    expect(results).toHaveLength(0);
  });

  it('should return multiple appointments for the same date', async () => {
    // Create customers
    const customer1 = await db.insert(customersTable)
      .values({
        first_name: 'Alice',
        last_name: 'Smith',
        email: 'alice@example.com',
        phone: '111-222-3333',
        date_of_birth: null,
        notes: null
      })
      .returning()
      .execute();

    const customer2 = await db.insert(customersTable)
      .values({
        first_name: 'Bob',
        last_name: 'Johnson',
        email: 'bob@example.com',
        phone: '444-555-6666',
        date_of_birth: null,
        notes: null
      })
      .returning()
      .execute();

    // Create services
    const service = await db.insert(servicesTable)
      .values({
        name: 'Manicure',
        description: 'Professional manicure',
        duration_minutes: 45,
        price: '35.50'
      })
      .returning()
      .execute();

    const appointmentDate = new Date('2024-02-20');
    const appointmentDateString = appointmentDate.toISOString().split('T')[0];

    // Create multiple appointments for same date
    await db.insert(appointmentsTable)
      .values([
        {
          customer_id: customer1[0].id,
          service_id: service[0].id,
          appointment_date: appointmentDateString,
          start_time: '09:00',
          end_time: '09:45',
          status: 'confirmed',
          notes: null
        },
        {
          customer_id: customer2[0].id,
          service_id: service[0].id,
          appointment_date: appointmentDateString,
          start_time: '14:00',
          end_time: '14:45',
          status: 'scheduled',
          notes: 'First time customer'
        }
      ])
      .execute();

    const results = await getAppointmentsByDate(appointmentDate);

    expect(results).toHaveLength(2);
    
    // Verify both appointments have correct structure
    results.forEach(appointment => {
      expect(appointment.appointment_date).toEqual(appointmentDate);
      expect(appointment.customer).toBeDefined();
      expect(appointment.service).toBeDefined();
      expect(appointment.service.price).toEqual(35.50);
      expect(typeof appointment.service.price).toBe('number');
    });

    // Verify different customers
    const customerNames = results.map(a => a.customer.first_name).sort();
    expect(customerNames).toEqual(['Alice', 'Bob']);
  });

  it('should handle null date_of_birth correctly', async () => {
    // Create customer with null date_of_birth
    const customer = await db.insert(customersTable)
      .values({
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane@example.com',
        phone: '987-654-3210',
        date_of_birth: null,
        notes: null
      })
      .returning()
      .execute();

    const service = await db.insert(servicesTable)
      .values({
        name: 'Consultation',
        description: null,
        duration_minutes: 15,
        price: '50.00'
      })
      .returning()
      .execute();

    const appointmentDate = new Date('2024-03-10');
    
    await db.insert(appointmentsTable)
      .values({
        customer_id: customer[0].id,
        service_id: service[0].id,
        appointment_date: appointmentDate.toISOString().split('T')[0],
        start_time: '11:00',
        end_time: '11:15',
        status: 'scheduled',
        notes: null
      })
      .execute();

    const results = await getAppointmentsByDate(appointmentDate);

    expect(results).toHaveLength(1);
    expect(results[0].customer.date_of_birth).toBeNull();
    expect(results[0].service.description).toBeNull();
  });
});
