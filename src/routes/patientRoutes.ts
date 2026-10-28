import { Router } from 'express';
import {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
} from '../controllers/patientController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { createPatientSchema, updatePatientSchema } from '../validators/patientValidator.js';

const router = Router();

// Protect all patient routes
router.use(authenticate);

router.post('/', validate(createPatientSchema), createPatient);
router.get('/', getPatients);
router.get('/:id', getPatientById);
router.put('/:id', validate(updatePatientSchema), updatePatient);
router.delete('/:id', deletePatient);

export default router;

