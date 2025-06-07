
import { type AppointmentWithDetails } from '../schema';

export declare function getAppointmentsByDate(date: Date): Promise<AppointmentWithDetails[]>;
