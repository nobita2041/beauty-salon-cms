
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable, servicesTable, appointmentsTable } from '../db/schema';
import { getAppointmentsByCustomer } from '../handlers/get_appointments_by_customer';

describe('getAppointmentsByCustomer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return appointments for a specific customer with details', async () => {
    // Create test customer
    const customer = await db.insert(customersTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
        date_of_birth: '1990-01-01', // Use string format for date column
        notes: 'Test customer'
      })
      .returning()
      .execute();

    // Create test service
    const service = await db.insert(servicesTable)
      .values({
        name: 'Haircut',
        description: 'Professional haircut',
        duration_minutes: 30,
        price: '25.00'
      })
      .returning()
      .execute();

    // Create test appointment
    const appointment = await db.insert(appointmentsTable)
      .values({
        customer_id: customer[0].id,
        service_id: service[0].id,
        appointment_date: '2024-01-15', // Use string format for date column
        start_time: '10:00',
        end_time: '10:30',
        status: 'scheduled',
        notes: 'First appointment'
      })
      .returning()
      .execute();

    const result = await getAppointmentsByCustomer(customer[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(appointment[0].id);
    expect(result[0].customer_id).toEqual(customer[0].id);
    expect(result[0].service_id).toEqual(service[0].id);
    expect(result[0].appointment_date).toBeInstanceOf(Date);
    expect(result[0].appointment_date.toISOString().split('T')[0]).toEqual('2024-01-15');
    expect(result[0].start_time).toEqual('10:00');
    expect(result[0].end_time).toEqual('10:30');
    expect(result[0].status).toEqual('scheduled');
    expect(result[0].notes).toEqual('First appointment');

    // Verify customer details
    expect(result[0].customer.id).toEqual(customer[0].id);
    expect(result[0].customer.first_name).toEqual('John');
    expect(result[0].customer.last_name).toEqual('Doe');
    expect(result[0].customer.email).toEqual('john@example.com');
    expect(result[0].customer.date_of_birth).toBeInstanceOf(Date);
    expect(result[0].customer.date_of_birth?.toISOString().split('T')[0]).toEqual('1990-01-01');

    // Verify service details with numeric conversion
    expect(result[0].service.id).toEqual(service[0].id);
    expect(result[0].service.name).toEqual('Haircut');
    expect(result[0].service.duration_minutes).toEqual(30);
    expect(result[0].service.price).toEqual(25.00);
    expect(typeof result[0].service.price).toEqual('number');
  });

  it('should return multiple appointments for a customer', async () => {
    // Create test customer
    const customer = await db.insert(customersTable)
      .values({
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@example.com',
        phone: '987-654-3210',
        date_of_birth: null,
        notes: null
      })
      .returning()
      .execute();

    // Create test services
    const service1 = await db.insert(servicesTable)
      .values({
        name: 'Haircut',
        description: 'Basic haircut',
        duration_minutes: 30,
        price: '25.00'
      })
      .returning()
      .execute();

    const service2 = await db.insert(servicesTable)
      .values({
        name: 'Hair Styling',
        description: 'Professional styling',
        duration_minutes: 45,
        price: '40.00'
      })
      .returning()
      .execute();

    // Create multiple appointments
    await db.insert(appointmentsTable)
      .values([
        {
          customer_id: customer[0].id,
          service_id: service1[0].id,
          appointment_date: '2024-01-15', // Use string format
          start_time: '10:00',
          end_time: '10:30',
          status: 'completed',
          notes: null
        },
        {
          customer_id: customer[0].id,
          service_id: service2[0].id,
          appointment_date: '2024-01-20', // Use string format
          start_time: '14:00',
          end_time: '14:45',
          status: 'scheduled',
          notes: 'Special styling'
        }
      ])
      .execute();

    const result = await getAppointmentsByCustomer(customer[0].id);

    expect(result).toHaveLength(2);
    
    // Verify both appointments have correct structure
    result.forEach(appointment => {
      expect(appointment.customer.id).toEqual(customer[0].id);
      expect(appointment.customer.first_name).toEqual('Jane');
      expect(appointment.customer.date_of_birth).toBeNull();
      expect(appointment.service.price).toBeTypeOf('number');
      expect(appointment.appointment_date).toBeInstanceOf(Date);
      expect(appointment.id).toBeDefined();
      expect(appointment.created_at).toBeInstanceOf(Date);
    });

    // Verify specific appointment details
    const haircut = result.find(a => a.service.name === 'Haircut');
    const styling = result.find(a => a.service.name === 'Hair Styling');
    
    expect(haircut?.status).toEqual('completed');
    expect(haircut?.service.price).toEqual(25.00);
    expect(styling?.status).toEqual('scheduled');
    expect(styling?.service.price).toEqual(40.00);
    expect(styling?.notes).toEqual('Special styling');
  });

  it('should return empty array for customer with no appointments', async () => {
    // Create test customer
    const customer = await db.insert(customersTable)
      .values({
        first_name: 'Empty',
        last_name: 'Customer',
        email: 'empty@example.com',
        phone: '000-000-0000',
        date_of_birth: null,
        notes: null
      })
      .returning()
      .execute();

    const result = await getAppointmentsByCustomer(customer[0].id);

    expect(result).toEqual([]);
  });

  it('should return empty array for non-existent customer', async () => {
    const result = await getAppointmentsByCustomer(999);

    expect(result).toEqual([]);
  });
});
