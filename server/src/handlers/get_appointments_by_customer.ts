
import { type AppointmentWithDetails } from '../schema';

export declare function getAppointmentsByCustomer(customerId: number): Promise<AppointmentWithDetails[]>;
