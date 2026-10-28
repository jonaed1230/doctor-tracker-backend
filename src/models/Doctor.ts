import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IDoctor extends Document {
  name: string;
  specialization: string;
  hospital: string;
  phone: string;
  email: string;
  patientCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const DoctorSchema = new Schema<IDoctor>(
  {
    name: {
      type: String,
      required: [true, 'Doctor name is required'],
      trim: true,
      maxlength: [120, 'Name cannot exceed 120 characters'],
    },
    specialization: {
      type: String,
      required: [true, 'Specialization is required'],
      trim: true,
      maxlength: [100, 'Specialization cannot exceed 100 characters'],
    },
    hospital: {
      type: String,
      required: [true, 'Hospital name is required'],
      trim: true,
      maxlength: [150, 'Hospital cannot exceed 150 characters'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      maxlength: [25, 'Phone cannot exceed 25 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    patientCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for high-performance searching, filtering, and sorting
DoctorSchema.index({ name: 'text', specialization: 'text', hospital: 'text', email: 'text' });
DoctorSchema.index({ specialization: 1, createdAt: -1 });
DoctorSchema.index({ hospital: 1 });
DoctorSchema.index({ createdAt: -1 });
DoctorSchema.index({ patientCount: -1 });

export const Doctor = mongoose.model<IDoctor>('Doctor', DoctorSchema);

