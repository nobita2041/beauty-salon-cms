
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { servicesTable } from '../db/schema';
import { type CreateServiceInput } from '../schema';
import { createService } from '../handlers/create_service';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateServiceInput = {
  name: 'Test Service',
  description: 'A service for testing',
  duration_minutes: 60,
  price: 99.99
};

describe('createService', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a service', async () => {
    const result = await createService(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Service');
    expect(result.description).toEqual(testInput.description);
    expect(result.duration_minutes).toEqual(60);
    expect(result.price).toEqual(99.99);
    expect(typeof result.price).toEqual('number');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save service to database', async () => {
    const result = await createService(testInput);

    // Query using proper drizzle syntax
    const services = await db.select()
      .from(servicesTable)
      .where(eq(servicesTable.id, result.id))
      .execute();

    expect(services).toHaveLength(1);
    expect(services[0].name).toEqual('Test Service');
    expect(services[0].description).toEqual(testInput.description);
    expect(services[0].duration_minutes).toEqual(60);
    expect(parseFloat(services[0].price)).toEqual(99.99);
    expect(services[0].created_at).toBeInstanceOf(Date);
  });

  it('should create service with null description', async () => {
    const inputWithNullDescription: CreateServiceInput = {
      name: 'Service No Description',
      description: null,
      duration_minutes: 30,
      price: 49.99
    };

    const result = await createService(inputWithNullDescription);

    expect(result.name).toEqual('Service No Description');
    expect(result.description).toBeNull();
    expect(result.duration_minutes).toEqual(30);
    expect(result.price).toEqual(49.99);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should handle decimal prices correctly', async () => {
    const inputWithDecimalPrice: CreateServiceInput = {
      name: 'Decimal Price Service',
      description: 'Testing decimal handling',
      duration_minutes: 45,
      price: 123.45
    };

    const result = await createService(inputWithDecimalPrice);

    // Verify numeric conversion works correctly
    expect(result.price).toEqual(123.45);
    expect(typeof result.price).toEqual('number');

    // Verify it's stored correctly in database
    const services = await db.select()
      .from(servicesTable)
      .where(eq(servicesTable.id, result.id))
      .execute();

    expect(parseFloat(services[0].price)).toEqual(123.45);
  });
});
