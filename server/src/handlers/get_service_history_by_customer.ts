
import { type ServiceHistoryWithDetails } from '../schema';

export declare function getServiceHistoryByCustomer(customerId: number): Promise<ServiceHistoryWithDetails[]>;
