import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Doctor } from '../models/Doctor.js';
import { Patient } from '../models/Patient.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { escapeRegex } from '../utils/security.js';

// Create a new doctor
export const createDoctor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, specialization, hospital, phone, email } = req.body;

    const existingDoctor = await Doctor.findOne({ email });
    if (existingDoctor) {
      sendError(res, 'A doctor with this email already exists', 409);
      return;
    }

    const doctor = await Doctor.create({
      name,
      specialization,
      hospital,
      phone,
      email,
      patientCount: 0,
    });

    sendSuccess(res, doctor, 'Doctor created successfully', 201);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to create doctor', 500);
  }
};

// View list of all doctors with search, date-wise filter, specialization/hospital filters, sorting, and pagination
export const getDoctors = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 10));
    const skip = (page - 1) * limit;

    const { search, specialization, hospital, startDate, endDate, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const query: Record<string, any> = {};

    // Search functionality across name, specialization, hospital, email, phone (sanitized against ReDoS)
    if (search && typeof search === 'string' && search.trim() !== '') {
      const sanitized = escapeRegex(search.trim());
      const searchRegex = new RegExp(sanitized, 'i');
      query.$or = [
        { name: searchRegex },
        { specialization: searchRegex },
        { hospital: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
      ];
    }

    // Specialization filter
    if (specialization && typeof specialization === 'string' && specialization !== 'ALL') {
      query.specialization = specialization;
    }

    // Hospital filter
    if (hospital && typeof hospital === 'string' && hospital !== 'ALL') {
      query.hospital = hospital;
    }

    // Date-wise filtering (created date range)
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate as string);
      }
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // Sorting
    const sortOptions: Record<string, 1 | -1> = {};
    const order = sortOrder === 'asc' ? 1 : -1;
    if (sortBy === 'patientCount' || sortBy === 'name' || sortBy === 'createdAt' || sortBy === 'specialization') {
      sortOptions[sortBy as string] = order;
    } else {
      sortOptions.createdAt = -1;
    }

    // Optimized execution with countDocuments and lean query
    const [doctors, total] = await Promise.all([
      Doctor.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      Doctor.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    sendSuccess(res, doctors, 'Doctors retrieved successfully', 200, {
      page,
      limit,
      total,
      totalPages,
    });
  } catch (error: any) {
    sendError(res, error.message || 'Failed to retrieve doctors', 500);
  }
};

// View single doctor by ID with corresponding patients
export const getDoctorById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      sendError(res, 'Invalid Doctor ID', 400);
      return;
    }

    const doctor = await Doctor.findById(id).lean();
    if (!doctor) {
      sendError(res, 'Doctor not found', 404);
      return;
    }

    // Fetch corresponding patients for this doctor
    const patients = await Patient.find({ doctorId: id })
      .sort({ createdAt: -1 })
      .lean();

    sendSuccess(
      res,
      {
        ...doctor,
        patients,
      },
      'Doctor details retrieved successfully'
    );
  } catch (error: any) {
    sendError(res, error.message || 'Failed to retrieve doctor', 500);
  }
};

// Update doctor
export const updateDoctor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      sendError(res, 'Invalid Doctor ID', 400);
      return;
    }

    const { name, specialization, hospital, phone, email } = req.body;

    // Check email uniqueness if email is changed
    if (email) {
      const existing = await Doctor.findOne({ email, _id: { $ne: id } });
      if (existing) {
        sendError(res, 'A doctor with this email already exists', 409);
        return;
      }
    }

    const doctor = await Doctor.findByIdAndUpdate(
      id,
      { name, specialization, hospital, phone, email },
      { new: true, runValidators: true }
    );

    if (!doctor) {
      sendError(res, 'Doctor not found', 404);
      return;
    }

    sendSuccess(res, doctor, 'Doctor updated successfully');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to update doctor', 500);
  }
};

// Delete doctor (and handle associated patients)
export const deleteDoctor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      sendError(res, 'Invalid Doctor ID', 400);
      return;
    }

    const doctor = await Doctor.findByIdAndDelete(id);
    if (!doctor) {
      sendError(res, 'Doctor not found', 404);
      return;
    }

    // Delete associated patients to maintain referential integrity
    const deletedPatients = await Patient.deleteMany({ doctorId: id });

    sendSuccess(
      res,
      {
        doctor,
        deletedPatientsCount: deletedPatients.deletedCount,
      },
      'Doctor and associated patients deleted successfully'
    );
  } catch (error: any) {
    sendError(res, error.message || 'Failed to delete doctor', 500);
  }
};

// Get patients corresponding to a specific doctor
export const getDoctorPatients = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      sendError(res, 'Invalid Doctor ID', 400);
      return;
    }

    const doctor = await Doctor.findById(id).lean();
    if (!doctor) {
      sendError(res, 'Doctor not found', 404);
      return;
    }

    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 10));
    const skip = (page - 1) * limit;

    const { search, condition } = req.query;
    const query: Record<string, any> = { doctorId: id };

    if (search && typeof search === 'string' && search.trim() !== '') {
      const sanitized = escapeRegex(search.trim());
      const regex = new RegExp(sanitized, 'i');
      query.$or = [{ name: regex }, { phone: regex }, { diagnosis: regex }];
    }

    if (condition && typeof condition === 'string' && condition !== 'ALL') {
      query.condition = condition;
    }

    const [patients, total] = await Promise.all([
      Patient.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Patient.countDocuments(query),
    ]);

    sendSuccess(res, patients, 'Doctor patients retrieved successfully', 200, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (error: any) {
    sendError(res, error.message || 'Failed to retrieve doctor patients', 500);
  }
};

// Add a new patient under a specific doctor
export const addPatientToDoctor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      sendError(res, 'Invalid Doctor ID', 400);
      return;
    }

    const doctor = await Doctor.findById(id);
    if (!doctor) {
      sendError(res, 'Doctor not found', 404);
      return;
    }

    const { name, age, gender, phone, email, condition, diagnosis, admissionDate, notes } = req.body;

    const patient = await Patient.create({
      name,
      age,
      gender,
      phone,
      email: email || '',
      condition: condition || 'Stable',
      diagnosis,
      admissionDate: admissionDate || new Date(),
      doctorId: id,
      notes: notes || '',
    });

    const newCount = await Patient.countDocuments({ doctorId: id });
    await Doctor.findByIdAndUpdate(id, { patientCount: newCount });

    sendSuccess(res, patient, 'Patient added under doctor successfully', 201);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to add patient to doctor', 500);
  }
};

// Delete a patient from the doctor's patient list
export const deletePatientFromDoctor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, patientId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(patientId)) {
      sendError(res, 'Invalid Doctor ID or Patient ID', 400);
      return;
    }

    const patient = await Patient.findOneAndDelete({ _id: patientId, doctorId: id });
    if (!patient) {
      sendError(res, 'Patient not found under this doctor', 404);
      return;
    }

    const newCount = await Patient.countDocuments({ doctorId: id });
    await Doctor.findByIdAndUpdate(id, { patientCount: newCount });

    sendSuccess(res, patient, 'Patient deleted from doctor patient list successfully');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to delete patient from doctor', 500);
  }
};

// Get distinct filter options (all unique specializations and hospitals)
export const getDoctorFilterOptions = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [specializations, hospitals] = await Promise.all([
      Doctor.distinct('specialization'),
      Doctor.distinct('hospital'),
    ]);

    sendSuccess(res, { specializations, hospitals }, 'Filter options retrieved');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to get filter options', 500);
  }
};

