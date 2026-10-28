import mongoose, { Document, Schema, Types } from 'mongoose';
import { Doctor } from './Doctor.js';

export type PatientCondition = 'Critical' | 'Stable' | 'Under Observation' | 'Recovered';

export interface IPatient extends Document {
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  email?: string;
  condition: PatientCondition;
  diagnosis: string;
  admissionDate: Date;
  doctorId: Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PatientSchema = new Schema<IPatient>(
  {
    name: {
      type: String,
      required: [true, 'Patient name is required'],
      trim: true,
      maxlength: [120, 'Name cannot exceed 120 characters'],
    },
    age: {
      type: Number,
      required: [true, 'Age is required'],
      min: [0, 'Age cannot be negative'],
      max: [130, 'Age cannot exceed 130'],
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      required: [true, 'Gender is required'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      maxlength: [25, 'Phone cannot exceed 25 characters'],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    condition: {
      type: String,
      enum: ['Critical', 'Stable', 'Under Observation', 'Recovered'],
      default: 'Stable',
      required: [true, 'Condition is required'],
    },
    diagnosis: {
      type: String,
      required: [true, 'Diagnosis is required'],
      trim: true,
      maxlength: [250, 'Diagnosis cannot exceed 250 characters'],
    },
    admissionDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor',
      required: [true, 'Doctor assignment is required'],
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// High-performance indexes
PatientSchema.index({ name: 'text', phone: 'text', email: 'text', diagnosis: 'text' });
PatientSchema.index({ doctorId: 1, createdAt: -1 });
PatientSchema.index({ condition: 1, createdAt: -1 });
PatientSchema.index({ admissionDate: -1 });
PatientSchema.index({ createdAt: -1 });

// Automatically update doctor's patientCount when a patient is created
PatientSchema.post('save', async function (doc) {
  try {
    const count = await mongoose.model('Patient').countDocuments({ doctorId: doc.doctorId });
    await Doctor.findByIdAndUpdate(doc.doctorId, { patientCount: count });
  } catch (err) {
    console.error('Error updating doctor patientCount on save:', err);
  }
});

export const Patient = mongoose.model<IPatient>('Patient', PatientSchema);

