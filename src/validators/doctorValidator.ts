import { z } from 'zod';

export const createDoctorSchema = z.object({
  name: z.string().min(2, 'Doctor name must be at least 2 characters').max(120),
  specialization: z.string().min(2, 'Specialization is required').max(100),
  hospital: z.string().min(2, 'Hospital is required').max(150),
  phone: z.string().min(6, 'Phone must be at least 6 characters').max(25),
  email: z.string().email('Please enter a valid email address'),
});

export const updateDoctorSchema = createDoctorSchema.partial();

