
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable, servicesTable, appointmentsTable, serviceHistoryTable } from '../db/schema';
import { getDashboardStats } from '../handlers/get_dashboard_stats';

describe('getDashboardStats', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return dashboard stats with zero values when no data exists', async () => {
    const stats = await getDashboardStats();

    expect(stats.today_appointments).toEqual(0);
    expect(stats.new_customers_this_month).toEqual(0);
    expect(stats.total_revenue_this_month).toEqual(0);
    expect(stats.upcoming_appointments).toEqual([]);
    expect(stats.recent_customers).toEqual([]);
  });

  it('should count today appointments correctly', async () => {
    // Create test customer and service
    const customer = await db.insert(customersTable)
      .values({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '123-456-7890'
      })
      .returning()
      .execute();

    const service = await db.insert(servicesTable)
      .values({
        name: 'Test Service',
        duration_minutes: 60,
        price: '50.00'
      })
      .returning()
      .execute();

    // Create appointment for today
    const today = new Date().toISOString().split('T')[0];
    await db.insert(appointmentsTable)
      .values({
        customer_id: customer[0].id,
        service_id: service[0].id,
        appointment_date: today,
        start_time: '10:00',
        end_time: '11:00'
      })
      .execute();

    const stats = await getDashboardStats();

    expect(stats.today_appointments).toEqual(1);
  });

  it('should count new customers this month correctly', async () => {
    // Create customer from this month
    await db.insert(customersTable)
      .values({
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@example.com',
        phone: '987-654-3210'
      })
      .execute();

    const stats = await getDashboardStats();

    expect(stats.new_customers_this_month).toEqual(1);
  });

  it('should calculate monthly revenue correctly', async () => {
    // Create test customer and service
    const customer = await db.insert(customersTable)
      .values({
        first_name: 'Bob',
        last_name: 'Johnson',
        email: 'bob@example.com',
        phone: '555-123-4567'
      })
      .returning()
      .execute();

    const service = await db.insert(servicesTable)
      .values({
        name: 'Revenue Service',
        duration_minutes: 30,
        price: '75.00'
      })
      .returning()
      .execute();

    // Create service history for this month
    const today = new Date().toISOString().split('T')[0];
    await db.insert(serviceHistoryTable)
      .values({
        customer_id: customer[0].id,
        service_id: service[0].id,
        service_date: today,
        price_paid: '100.50'
      })
      .execute();

    await db.insert(serviceHistoryTable)
      .values({
        customer_id: customer[0].id,
        service_id: service[0].id,
        service_date: today,
        price_paid: '49.50'
      })
      .execute();

    const stats = await getDashboardStats();

    expect(stats.total_revenue_this_month).toEqual(150.00);
  });

  it('should return upcoming appointments within 7 days', async () => {
    // Create test customer and service
    const customer = await db.insert(customersTable)
      .values({
        first_name: 'Alice',
        last_name: 'Wilson',
        email: 'alice@example.com',
        phone: '111-222-3333'
      })
      .returning()
      .execute();

    const service = await db.insert(servicesTable)
      .values({
        name: 'Upcoming Service',
        duration_minutes: 45,
        price: '60.00'
      })
      .returning()
      .execute();

    // Create appointment for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const appointment = await db.insert(appointmentsTable)
      .values({
        customer_id: customer[0].id,
        service_id: service[0].id,
        appointment_date: tomorrowStr,
        start_time: '14:00',
        end_time: '14:45',
        status: 'confirmed'
      })
      .returning()
      .execute();

    const stats = await getDashboardStats();

    expect(stats.upcoming_appointments).toHaveLength(1);
    expect(stats.upcoming_appointments[0].id).toEqual(appointment[0].id);
    expect(stats.upcoming_appointments[0].customer_id).toEqual(customer[0].id);
    expect(stats.upcoming_appointments[0].service_id).toEqual(service[0].id);
    expect(stats.upcoming_appointments[0].status).toEqual('confirmed');
    expect(stats.upcoming_appointments[0].start_time).toEqual('14:00');
  });

  it('should return recent customers ordered by creation date', async () => {
    // Create multiple customers
    const customer1 = await db.insert(customersTable)
      .values({
        first_name: 'First',
        last_name: 'Customer',
        email: 'first@example.com',
        phone: '111-111-1111'
      })
      .returning()
      .execute();

    // Wait a small amount to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const customer2 = await db.insert(customersTable)
      .values({
        first_name: 'Second',
        last_name: 'Customer',
        email: 'second@example.com',
        phone: '222-222-2222'
      })
      .returning()
      .execute();

    const stats = await getDashboardStats();

    expect(stats.recent_customers).toHaveLength(2);
    // Most recent customer should be first
    expect(stats.recent_customers[0].id).toEqual(customer2[0].id);
    expect(stats.recent_customers[0].first_name).toEqual('Second');
    expect(stats.recent_customers[1].id).toEqual(customer1[0].id);
    expect(stats.recent_customers[1].first_name).toEqual('First');
  });

  it('should limit recent customers to 5', async () => {
    // Create 7 customers
    for (let i = 1; i <= 7; i++) {
      await db.insert(customersTable)
        .values({
          first_name: `Customer${i}`,
          last_name: 'Test',
          email: `customer${i}@example.com`,
          phone: `${i}${i}${i}-${i}${i}${i}-${i}${i}${i}${i}`
        })
        .execute();
      
      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 5));
    }

    const stats = await getDashboardStats();

    expect(stats.recent_customers).toHaveLength(5);
    // Should be ordered by most recent first
    expect(stats.recent_customers[0].first_name).toEqual('Customer7');
    expect(stats.recent_customers[4].first_name).toEqual('Customer3');
  });

  it('should handle date_of_birth conversion correctly', async () => {
    // Create customer with date_of_birth
    await db.insert(customersTable)
      .values({
        first_name: 'Date',
        last_name: 'Customer',
        email: 'date@example.com',
        phone: '333-333-3333',
        date_of_birth: '1990-05-15'
      })
      .execute();

    const stats = await getDashboardStats();

    expect(stats.recent_customers).toHaveLength(1);
    expect(stats.recent_customers[0].date_of_birth).toBeInstanceOf(Date);
    expect(stats.recent_customers[0].date_of_birth?.getFullYear()).toEqual(1990);
  });
});
