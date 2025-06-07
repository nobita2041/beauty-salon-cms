
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { servicesTable } from '../db/schema';
import { type CreateServiceInput } from '../schema';
import { getServices } from '../handlers/get_services';

// Test service data
const testService1: CreateServiceInput = {
  name: 'Basic Haircut',
  description: 'Standard haircut service',
  duration_minutes: 30,
  price: 25.00
};

const testService2: CreateServiceInput = {
  name: 'Hair Styling',
  description: null,
  duration_minutes: 45,
  price: 35.50
};

describe('getServices', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no services exist', async () => {
    const result = await getServices();
    expect(result).toEqual([]);
  });

  it('should return all services', async () => {
    // Create test services
    await db.insert(servicesTable).values([
      {
        name: testService1.name,
        description: testService1.description,
        duration_minutes: testService1.duration_minutes,
        price: testService1.price.toString()
      },
      {
        name: testService2.name,
        description: testService2.description,
        duration_minutes: testService2.duration_minutes,
        price: testService2.price.toString()
      }
    ]).execute();

    const result = await getServices();

    expect(result).toHaveLength(2);
    
    // Check first service
    const service1 = result.find(s => s.name === 'Basic Haircut');
    expect(service1).toBeTruthy();
    expect(service1!.description).toEqual('Standard haircut service');
    expect(service1!.duration_minutes).toEqual(30);
    expect(service1!.price).toEqual(25.00);
    expect(typeof service1!.price).toBe('number');
    expect(service1!.id).toBeDefined();
    expect(service1!.created_at).toBeInstanceOf(Date);
    
    // Check second service
    const service2 = result.find(s => s.name === 'Hair Styling');
    expect(service2).toBeTruthy();
    expect(service2!.description).toBeNull();
    expect(service2!.duration_minutes).toEqual(45);
    expect(service2!.price).toEqual(35.50);
    expect(typeof service2!.price).toBe('number');
    expect(service2!.id).toBeDefined();
    expect(service2!.created_at).toBeInstanceOf(Date);
  });

  it('should handle numeric price conversion correctly', async () => {
    // Create service with precise decimal
    await db.insert(servicesTable).values({
      name: 'Precision Test',
      description: 'Test service for price precision',
      duration_minutes: 60,
      price: '99.99'
    }).execute();

    const result = await getServices();

    expect(result).toHaveLength(1);
    expect(result[0].price).toEqual(99.99);
    expect(typeof result[0].price).toBe('number');
  });
});
