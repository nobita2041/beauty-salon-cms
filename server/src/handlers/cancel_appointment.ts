
import { db } from '../db';
import { appointmentsTable } from '../db/schema';
import { type Appointment } from '../schema';
import { eq } from 'drizzle-orm';

export const cancelAppointment = async (id: number): Promise<Appointment> => {
  try {
    // Update appointment status to cancelled
    const result = await db.update(appointmentsTable)
      .set({ 
        status: 'cancelled',
        updated_at: new Date()
      })
      .where(eq(appointmentsTable.id, id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Appointment with id ${id} not found`);
    }

    // Convert date string to Date object before returning
    const appointment = result[0];
    return {
      ...appointment,
      appointment_date: new Date(appointment.appointment_date)
    };
  } catch (error) {
    console.error('Appointment cancellation failed:', error);
    throw error;
  }
};
