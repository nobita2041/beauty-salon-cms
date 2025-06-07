
import { type Customer } from '../schema';

export declare function getCustomerById(id: number): Promise<Customer | null>;
