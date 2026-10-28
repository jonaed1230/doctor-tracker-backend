import { z } from 'zod';

export const createPatientSchema = z.object({
  name: z.string().min(2, 'Patient name must be at least 2 characters').max(120),
  age: z.coerce.number().min(0, 'Age must be positive').max(130, 'Age is invalid'),
  gender: z.enum(['Male', 'Female', 'Other']),
  phone: z.string().min(6, 'Phone must be at least 6 characters').max(25),
  email: z.string().email('Valid email is required').optional().or(z.literal('')),
  condition: z.enum(['Critical', 'Stable', 'Under Observation', 'Recovered']),
  diagnosis: z.string().min(2, 'Diagnosis must be at least 2 characters').max(250),
  admissionDate: z.string().or(z.date()).optional(),
  doctorId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Doctor ID'),
  notes: z.string().max(1000).optional(),
});

export const updatePatientSchema = createPatientSchema.partial();

