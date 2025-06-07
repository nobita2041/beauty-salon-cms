
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createCustomerInputSchema,
  updateCustomerInputSchema,
  searchCustomersInputSchema,
  createServiceInputSchema,
  createAppointmentInputSchema,
  updateAppointmentInputSchema,
  createServiceHistoryInputSchema,
  dateRangeInputSchema
} from './schema';

// Import handlers
import { createCustomer } from './handlers/create_customer';
import { getCustomers } from './handlers/get_customers';
import { getCustomerById } from './handlers/get_customer_by_id';
import { updateCustomer } from './handlers/update_customer';
import { deleteCustomer } from './handlers/delete_customer';
import { searchCustomers } from './handlers/search_customers';
import { createService } from './handlers/create_service';
import { getServices } from './handlers/get_services';
import { createAppointment } from './handlers/create_appointment';
import { getAppointments } from './handlers/get_appointments';
import { getAppointmentsByDate } from './handlers/get_appointments_by_date';
import { getAppointmentsByCustomer } from './handlers/get_appointments_by_customer';
import { updateAppointment } from './handlers/update_appointment';
import { cancelAppointment } from './handlers/cancel_appointment';
import { createServiceHistory } from './handlers/create_service_history';
import { getServiceHistoryByCustomer } from './handlers/get_service_history_by_customer';
import { getDashboardStats } from './handlers/get_dashboard_stats';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Customer management
  createCustomer: publicProcedure
    .input(createCustomerInputSchema)
    .mutation(({ input }) => createCustomer(input)),
  
  getCustomers: publicProcedure
    .query(() => getCustomers()),
  
  getCustomerById: publicProcedure
    .input(z.number())
    .query(({ input }) => getCustomerById(input)),
  
  updateCustomer: publicProcedure
    .input(updateCustomerInputSchema)
    .mutation(({ input }) => updateCustomer(input)),
  
  deleteCustomer: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deleteCustomer(input)),
  
  searchCustomers: publicProcedure
    .input(searchCustomersInputSchema)
    .query(({ input }) => searchCustomers(input)),

  // Service management
  createService: publicProcedure
    .input(createServiceInputSchema)
    .mutation(({ input }) => createService(input)),
  
  getServices: publicProcedure
    .query(() => getServices()),

  // Appointment management
  createAppointment: publicProcedure
    .input(createAppointmentInputSchema)
    .mutation(({ input }) => createAppointment(input)),
  
  getAppointments: publicProcedure
    .query(() => getAppointments()),
  
  getAppointmentsByDate: publicProcedure
    .input(z.coerce.date())
    .query(({ input }) => getAppointmentsByDate(input)),
  
  getAppointmentsByCustomer: publicProcedure
    .input(z.number())
    .query(({ input }) => getAppointmentsByCustomer(input)),
  
  updateAppointment: publicProcedure
    .input(updateAppointmentInputSchema)
    .mutation(({ input }) => updateAppointment(input)),
  
  cancelAppointment: publicProcedure
    .input(z.number())
    .mutation(({ input }) => cancelAppointment(input)),

  // Service history
  createServiceHistory: publicProcedure
    .input(createServiceHistoryInputSchema)
    .mutation(({ input }) => createServiceHistory(input)),
  
  getServiceHistoryByCustomer: publicProcedure
    .input(z.number())
    .query(({ input }) => getServiceHistoryByCustomer(input)),

  // Dashboard
  getDashboardStats: publicProcedure
    .query(() => getDashboardStats()),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
