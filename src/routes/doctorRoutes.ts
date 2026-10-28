import { Router } from 'express';
import {
  createDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
  getDoctorPatients,
  addPatientToDoctor,
  deletePatientFromDoctor,
  getDoctorFilterOptions,
} from '../controllers/doctorController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { createDoctorSchema, updateDoctorSchema } from '../validators/doctorValidator.js';
import { createPatientSchema } from '../validators/patientValidator.js';

const router = Router();

// Protect all doctor routes with authentication
router.use(authenticate);

router.get('/filter-options', getDoctorFilterOptions);
router.post('/', validate(createDoctorSchema), createDoctor);
router.get('/', getDoctors);
router.get('/:id', getDoctorById);
router.put('/:id', validate(updateDoctorSchema), updateDoctor);
router.delete('/:id', deleteDoctor);

// Sub-resource routes for doctor's patients
router.get('/:id/patients', getDoctorPatients);
router.post(
  '/:id/patients',
  validate(createPatientSchema.omit({ doctorId: true })),
  addPatientToDoctor
);
router.delete('/:id/patients/:patientId', deletePatientFromDoctor);

export default router;

