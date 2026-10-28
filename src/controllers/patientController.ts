import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Patient } from '../models/Patient.js';
import { Doctor } from '../models/Doctor.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { escapeRegex } from '../utils/security.js';

// Get list of all patients with search, condition filter, date-wise filter, doctor filter, and pagination
export const getPatients = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 10));
    const skip = (page - 1) * limit;

    const {
      search,
      condition,
      doctorId,
      gender,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query: Record<string, any> = {};

    // Search functionality (name, phone, email, diagnosis) - sanitized against ReDoS
    if (search && typeof search === 'string' && search.trim() !== '') {
      const sanitized = escapeRegex(search.trim());
      const searchRegex = new RegExp(sanitized, 'i');
      query.$or = [
        { name: searchRegex },
        { phone: searchRegex },
        { email: searchRegex },
        { diagnosis: searchRegex },
      ];
    }

    // Condition filter (Critical, Stable, Under Observation, Recovered)
    if (condition && typeof condition === 'string' && condition !== 'ALL') {
      query.condition = condition;
    }

    // Doctor filter
    if (doctorId && typeof doctorId === 'string' && doctorId !== 'ALL') {
      if (mongoose.Types.ObjectId.isValid(doctorId)) {
        query.doctorId = new mongoose.Types.ObjectId(doctorId);
      }
    }

    // Gender filter
    if (gender && typeof gender === 'string' && gender !== 'ALL') {
      query.gender = gender;
    }

    // Date-wise filtering (admissionDate or createdAt range)
    if (startDate || endDate) {
      query.admissionDate = {};
      if (startDate) {
        query.admissionDate.$gte = new Date(startDate as string);
      }
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        query.admissionDate.$lte = end;
      }
    }

    // Sorting
    const sortOptions: Record<string, 1 | -1> = {};
    const order = sortOrder === 'asc' ? 1 : -1;
    if (['name', 'age', 'admissionDate', 'createdAt', 'condition'].includes(sortBy as string)) {
      sortOptions[sortBy as string] = order;
    } else {
      sortOptions.createdAt = -1;
    }

    // Execute optimized query with populated doctor information
    const [patients, total] = await Promise.all([
      Patient.find(query)
        .populate('doctorId', 'name specialization hospital email phone')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      Patient.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    sendSuccess(res, patients, 'Patients retrieved successfully', 200, {
      page,
      limit,
      total,
      totalPages,
    });
  } catch (error: any) {
    sendError(res, error.message || 'Failed to retrieve patients', 500);
  }
};

// Get single patient by ID
export const getPatientById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      sendError(res, 'Invalid Patient ID', 400);
      return;
    }

    const patient = await Patient.findById(id)
      .populate('doctorId', 'name specialization hospital email phone')
      .lean();

    if (!patient) {
      sendError(res, 'Patient not found', 404);
      return;
    }

    sendSuccess(res, patient, 'Patient retrieved successfully');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to retrieve patient', 500);
  }
};

// Create a new patient
export const createPatient = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, age, gender, phone, email, condition, diagnosis, admissionDate, doctorId, notes } =
      req.body;

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      sendError(res, 'Invalid Doctor ID provided', 400);
      return;
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      sendError(res, 'Assigned doctor does not exist', 404);
      return;
    }

    const patient = await Patient.create({
      name,
      age,
      gender,
      phone,
      email: email || '',
      condition: condition || 'Stable',
      diagnosis,
      admissionDate: admissionDate || new Date(),
      doctorId,
      notes: notes || '',
    });

    // Update doctor's patient count
    const count = await Patient.countDocuments({ doctorId });
    await Doctor.findByIdAndUpdate(doctorId, { patientCount: count });

    const populatedPatient = await Patient.findById(patient._id)
      .populate('doctorId', 'name specialization hospital email')
      .lean();

    sendSuccess(res, populatedPatient, 'Patient created successfully', 201);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to create patient', 500);
  }
};

// Edit / Update patient information
export const updatePatient = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      sendError(res, 'Invalid Patient ID', 400);
      return;
    }

    const existingPatient = await Patient.findById(id);
    if (!existingPatient) {
      sendError(res, 'Patient not found', 404);
      return;
    }

    const oldDoctorId = existingPatient.doctorId.toString();
    const newDoctorId = req.body.doctorId;

    // Validate new doctor if changing doctor assignment
    if (newDoctorId && newDoctorId !== oldDoctorId) {
      if (!mongoose.Types.ObjectId.isValid(newDoctorId)) {
        sendError(res, 'Invalid new Doctor ID', 400);
        return;
      }
      const docExists = await Doctor.findById(newDoctorId);
      if (!docExists) {
        sendError(res, 'Target doctor not found', 404);
        return;
      }
    }

    const updatedPatient = await Patient.findByIdAndUpdate(
      id,
      { ...req.body },
      { new: true, runValidators: true }
    ).populate('doctorId', 'name specialization hospital email phone');

    // If doctor changed, recompute patient count for both doctors
    if (newDoctorId && newDoctorId !== oldDoctorId) {
      const [countOld, countNew] = await Promise.all([
        Patient.countDocuments({ doctorId: oldDoctorId }),
        Patient.countDocuments({ doctorId: newDoctorId }),
      ]);
      await Promise.all([
        Doctor.findByIdAndUpdate(oldDoctorId, { patientCount: countOld }),
        Doctor.findByIdAndUpdate(newDoctorId, { patientCount: countNew }),
      ]);
    }

    sendSuccess(res, updatedPatient, 'Patient updated successfully');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to update patient', 500);
  }
};

// Delete patient
export const deletePatient = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      sendError(res, 'Invalid Patient ID', 400);
      return;
    }

    const patient = await Patient.findByIdAndDelete(id);
    if (!patient) {
      sendError(res, 'Patient not found', 404);
      return;
    }

    // Update doctor's patientCount
    const newCount = await Patient.countDocuments({ doctorId: patient.doctorId });
    await Doctor.findByIdAndUpdate(patient.doctorId, { patientCount: newCount });

    sendSuccess(res, patient, 'Patient deleted successfully');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to delete patient', 500);
  }
};

