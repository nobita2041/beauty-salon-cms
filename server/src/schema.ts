
import { z } from 'zod';

// Customer schema
export const customerSchema = z.object({
  id: z.number(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  date_of_birth: z.coerce.date().nullable(),
  notes: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Customer = z.infer<typeof customerSchema>;

// Service schema
export const serviceSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  duration_minutes: z.number().int(),
  price: z.number(),
  created_at: z.coerce.date()
});

export type Service = z.infer<typeof serviceSchema>;

// Appointment status enum
export const appointmentStatusSchema = z.enum(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled']);
export type AppointmentStatus = z.infer<typeof appointmentStatusSchema>;

// Appointment schema
export const appointmentSchema = z.object({
  id: z.number(),
  customer_id: z.number(),
  service_id: z.number(),
  appointment_date: z.coerce.date(),
  start_time: z.string(),
  end_time: z.string(),
  status: appointmentStatusSchema,
  notes: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Appointment = z.infer<typeof appointmentSchema>;

// Service history schema
export const serviceHistorySchema = z.object({
  id: z.number(),
  customer_id: z.number(),
  service_id: z.number(),
  appointment_id: z.number().nullable(),
  service_date: z.coerce.date(),
  price_paid: z.number(),
  notes: z.string().nullable(),
  created_at: z.coerce.date()
});

export type ServiceHistory = z.infer<typeof serviceHistorySchema>;

// Input schemas for creating customers
export const createCustomerInputSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  date_of_birth: z.coerce.date().nullable(),
  notes: z.string().nullable()
});

export type CreateCustomerInput = z.infer<typeof createCustomerInputSchema>;

// Input schema for updating customers
export const updateCustomerInputSchema = z.object({
  id: z.number(),
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(1).optional(),
  date_of_birth: z.coerce.date().nullable().optional(),
  notes: z.string().nullable().optional()
});

export type UpdateCustomerInput = z.infer<typeof updateCustomerInputSchema>;

// Input schema for creating services
export const createServiceInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable(),
  duration_minutes: z.number().int().positive(),
  price: z.number().positive()
});

export type CreateServiceInput = z.infer<typeof createServiceInputSchema>;

// Input schema for creating appointments
export const createAppointmentInputSchema = z.object({
  customer_id: z.number(),
  service_id: z.number(),
  appointment_date: z.coerce.date(),
  start_time: z.string(),
  end_time: z.string(),
  notes: z.string().nullable()
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentInputSchema>;

// Input schema for updating appointments
export const updateAppointmentInputSchema = z.object({
  id: z.number(),
  customer_id: z.number().optional(),
  service_id: z.number().optional(),
  appointment_date: z.coerce.date().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  status: appointmentStatusSchema.optional(),
  notes: z.string().nullable().optional()
});

export type UpdateAppointmentInput = z.infer<typeof updateAppointmentInputSchema>;

// Input schema for creating service history
export const createServiceHistoryInputSchema = z.object({
  customer_id: z.number(),
  service_id: z.number(),
  appointment_id: z.number().nullable(),
  service_date: z.coerce.date(),
  price_paid: z.number().positive(),
  notes: z.string().nullable()
});

export type CreateServiceHistoryInput = z.infer<typeof createServiceHistoryInputSchema>;

// Search input schema
export const searchCustomersInputSchema = z.object({
  query: z.string().min(1),
  limit: z.number().int().positive().optional().default(20)
});

export type SearchCustomersInput = z.infer<typeof searchCustomersInputSchema>;

// Date range input schema
export const dateRangeInputSchema = z.object({
  start_date: z.coerce.date(),
  end_date: z.coerce.date()
});

export type DateRangeInput = z.infer<typeof dateRangeInputSchema>;

// Dashboard stats schema
export const dashboardStatsSchema = z.object({
  today_appointments: z.number().int(),
  new_customers_this_month: z.number().int(),
  total_revenue_this_month: z.number(),
  upcoming_appointments: z.array(appointmentSchema),
  recent_customers: z.array(customerSchema)
});

export type DashboardStats = z.infer<typeof dashboardStatsSchema>;

// Detailed appointment with customer and service info
export const appointmentWithDetailsSchema = z.object({
  id: z.number(),
  customer_id: z.number(),
  service_id: z.number(),
  appointment_date: z.coerce.date(),
  start_time: z.string(),
  end_time: z.string(),
  status: appointmentStatusSchema,
  notes: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  customer: customerSchema,
  service: serviceSchema
});

export type AppointmentWithDetails = z.infer<typeof appointmentWithDetailsSchema>;

// Service history with details
export const serviceHistoryWithDetailsSchema = z.object({
  id: z.number(),
  customer_id: z.number(),
  service_id: z.number(),
  appointment_id: z.number().nullable(),
  service_date: z.coerce.date(),
  price_paid: z.number(),
  notes: z.string().nullable(),
  created_at: z.coerce.date(),
  customer: customerSchema,
  service: serviceSchema
});

export type ServiceHistoryWithDetails = z.infer<typeof serviceHistoryWithDetailsSchema>;
