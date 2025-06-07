
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable, servicesTable, appointmentsTable } from '../db/schema';
import { type CreateCustomerInput, type CreateServiceInput, type CreateAppointmentInput } from '../schema';
import { getAppointments } from '../handlers/get_appointments';

// Test data
const testCustomer: CreateCustomerInput = {
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  phone: '555-0123',
  date_of_birth: new Date('1990-01-01'),
  notes: 'Test customer'
};

const testService: CreateServiceInput = {
  name: 'Haircut',
  description: 'Basic haircut service',
  duration_minutes: 30,
  price: 25.00
};

describe('getAppointments', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no appointments exist', async () => {
    const result = await getAppointments();
    expect(result).toEqual([]);
  });

  it('should return appointments with customer and service details', async () => {
    // Create prerequisite data
    const customerResult = await db.insert(customersTable)
      .values({
        ...testCustomer,
        date_of_birth: testCustomer.date_of_birth ? testCustomer.date_of_birth.toISOString().split('T')[0] : null // Convert Date to string
      })
      .returning()
      .execute();
    const customer = customerResult[0];

    const serviceResult = await db.insert(servicesTable)
      .values({
        ...testService,
        price: testService.price.toString()
      })
      .returning()
      .execute();
    const service = serviceResult[0];

    // Create appointment
    const appointmentInput: CreateAppointmentInput = {
      customer_id: customer.id,
      service_id: service.id,
      appointment_date: new Date('2024-01-15'),
      start_time: '10:00',
      end_time: '10:30',
      notes: 'Test appointment'
    };

    await db.insert(appointmentsTable)
      .values({
        ...appointmentInput,
        appointment_date: appointmentInput.appointment_date.toISOString().split('T')[0] // Convert Date to string
      })
      .execute();

    // Test the handler
    const result = await getAppointments();

    expect(result).toHaveLength(1);
    
    const appointment = result[0];
    
    // Verify appointment data
    expect(appointment.customer_id).toEqual(customer.id);
    expect(appointment.service_id).toEqual(service.id);
    expect(appointment.appointment_date).toEqual(new Date('2024-01-15'));
    expect(appointment.start_time).toEqual('10:00');
    expect(appointment.end_time).toEqual('10:30');
    expect(appointment.status).toEqual('scheduled');
    expect(appointment.notes).toEqual('Test appointment');
    expect(appointment.id).toBeDefined();
    expect(appointment.created_at).toBeInstanceOf(Date);
    expect(appointment.updated_at).toBeInstanceOf(Date);

    // Verify customer data
    expect(appointment.customer.id).toEqual(customer.id);
    expect(appointment.customer.first_name).toEqual('John');
    expect(appointment.customer.last_name).toEqual('Doe');
    expect(appointment.customer.email).toEqual('john.doe@example.com');
    expect(appointment.customer.phone).toEqual('555-0123');
    expect(appointment.customer.date_of_birth).toEqual(new Date('1990-01-01'));
    expect(appointment.customer.notes).toEqual('Test customer');

    // Verify service data
    expect(appointment.service.id).toEqual(service.id);
    expect(appointment.service.name).toEqual('Haircut');
    expect(appointment.service.description).toEqual('Basic haircut service');
    expect(appointment.service.duration_minutes).toEqual(30);
    expect(appointment.service.price).toEqual(25.00);
    expect(typeof appointment.service.price).toEqual('number');
    expect(appointment.service.created_at).toBeInstanceOf(Date);
  });

  it('should return multiple appointments correctly', async () => {
    // Create two customers
    const customer1Result = await db.insert(customersTable)
      .values({
        ...testCustomer,
        email: 'customer1@example.com',
        date_of_birth: testCustomer.date_of_birth ? testCustomer.date_of_birth.toISOString().split('T')[0] : null
      })
      .returning()
      .execute();
    const customer1 = customer1Result[0];

    const customer2Result = await db.insert(customersTable)
      .values({
        ...testCustomer,
        first_name: 'Jane',
        email: 'customer2@example.com',
        date_of_birth: testCustomer.date_of_birth ? testCustomer.date_of_birth.toISOString().split('T')[0] : null
      })
      .returning()
      .execute();
    const customer2 = customer2Result[0];

    // Create service
    const serviceResult = await db.insert(servicesTable)
      .values({
        ...testService,
        price: testService.price.toString()
      })
      .returning()
      .execute();
    const service = serviceResult[0];

    // Create two appointments
    await db.insert(appointmentsTable)
      .values([
        {
          customer_id: customer1.id,
          service_id: service.id,
          appointment_date: '2024-01-15', // Use string format for date column
          start_time: '10:00',
          end_time: '10:30',
          notes: 'First appointment'
        },
        {
          customer_id: customer2.id,
          service_id: service.id,
          appointment_date: '2024-01-16', // Use string format for date column
          start_time: '11:00',
          end_time: '11:30',
          notes: 'Second appointment'
        }
      ])
      .execute();

    const result = await getAppointments();

    expect(result).toHaveLength(2);
    
    // Verify both appointments have correct structure
    result.forEach(appointment => {
      expect(appointment.id).toBeDefined();
      expect(appointment.customer).toBeDefined();
      expect(appointment.service).toBeDefined();
      expect(appointment.customer.first_name).toBeDefined();
      expect(appointment.service.name).toEqual('Haircut');
      expect(typeof appointment.service.price).toEqual('number');
      expect(appointment.appointment_date).toBeInstanceOf(Date);
    });
  });
});
