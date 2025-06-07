
import { serial, text, pgTable, timestamp, numeric, integer, date, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enum for appointment status
export const appointmentStatusEnum = pgEnum('appointment_status', ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled']);

// Customers table
export const customersTable = pgTable('customers', {
  id: serial('id').primaryKey(),
  first_name: text('first_name').notNull(),
  last_name: text('last_name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone').notNull(),
  date_of_birth: date('date_of_birth'),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Services table
export const servicesTable = pgTable('services', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  duration_minutes: integer('duration_minutes').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Appointments table
export const appointmentsTable = pgTable('appointments', {
  id: serial('id').primaryKey(),
  customer_id: integer('customer_id').notNull().references(() => customersTable.id),
  service_id: integer('service_id').notNull().references(() => servicesTable.id),
  appointment_date: date('appointment_date').notNull(),
  start_time: text('start_time').notNull(), // Format: "HH:MM"
  end_time: text('end_time').notNull(), // Format: "HH:MM"
  status: appointmentStatusEnum('status').default('scheduled').notNull(),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Service history table
export const serviceHistoryTable = pgTable('service_history', {
  id: serial('id').primaryKey(),
  customer_id: integer('customer_id').notNull().references(() => customersTable.id),
  service_id: integer('service_id').notNull().references(() => servicesTable.id),
  appointment_id: integer('appointment_id').references(() => appointmentsTable.id),
  service_date: date('service_date').notNull(),
  price_paid: numeric('price_paid', { precision: 10, scale: 2 }).notNull(),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const customersRelations = relations(customersTable, ({ many }) => ({
  appointments: many(appointmentsTable),
  serviceHistory: many(serviceHistoryTable),
}));

export const servicesRelations = relations(servicesTable, ({ many }) => ({
  appointments: many(appointmentsTable),
  serviceHistory: many(serviceHistoryTable),
}));

export const appointmentsRelations = relations(appointmentsTable, ({ one, many }) => ({
  customer: one(customersTable, {
    fields: [appointmentsTable.customer_id],
    references: [customersTable.id],
  }),
  service: one(servicesTable, {
    fields: [appointmentsTable.service_id],
    references: [servicesTable.id],
  }),
  serviceHistory: many(serviceHistoryTable),
}));

export const serviceHistoryRelations = relations(serviceHistoryTable, ({ one }) => ({
  customer: one(customersTable, {
    fields: [serviceHistoryTable.customer_id],
    references: [customersTable.id],
  }),
  service: one(servicesTable, {
    fields: [serviceHistoryTable.service_id],
    references: [servicesTable.id],
  }),
  appointment: one(appointmentsTable, {
    fields: [serviceHistoryTable.appointment_id],
    references: [appointmentsTable.id],
  }),
}));

// Export all tables for proper query building
export const tables = {
  customers: customersTable,
  services: servicesTable,
  appointments: appointmentsTable,
  serviceHistory: serviceHistoryTable,
};
