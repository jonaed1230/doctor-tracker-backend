import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Doctor } from '../models/Doctor.js';
import { Patient, PatientCondition } from '../models/Patient.js';
import { connectDB, disconnectDB } from '../config/db.js';

export const seedDatabase = async (): Promise<void> => {
  console.log('[Seed] Starting database seeding...');

  // 1. Seed Admin User
  let admin = await User.findOne({ email: 'admin@doctortracker.com' });
  if (!admin) {
    admin = await User.create({
      name: 'Dr. Gregory House (Admin)',
      email: 'admin@doctortracker.com',
      password: 'Admin@123456',
      role: 'admin',
    });
    console.log('[Seed] Admin user created: admin@doctortracker.com (Password: Admin@123456)');
  } else {
    console.log('[Seed] Admin user already exists.');
  }

  // Check if doctors already exist
  const doctorCount = await Doctor.countDocuments();
  if (doctorCount > 0) {
    console.log(`[Seed] Database already contains ${doctorCount} doctors. Skipping dummy data.`);
    return;
  }

  // 2. Seed Doctors
  const doctorData = [
    {
      name: 'Dr. Sarah Jenkins',
      specialization: 'Cardiology',
      hospital: 'St. Jude General Hospital',
      phone: '+1 (555) 234-5678',
      email: 's.jenkins@stjude.org',
    },
    {
      name: 'Dr. Marcus Vance',
      specialization: 'Neurology',
      hospital: 'Metro Health Medical Center',
      phone: '+1 (555) 345-6789',
      email: 'm.vance@metrohealth.org',
    },
    {
      name: 'Dr. Emily Chen',
      specialization: 'Pediatrics',
      hospital: "Children's Specialty Hospital",
      phone: '+1 (555) 456-7890',
      email: 'e.chen@childrensspec.org',
    },
    {
      name: 'Dr. James Wilson',
      specialization: 'Orthopedics',
      hospital: 'City Memorial Hospital',
      phone: '+1 (555) 567-8901',
      email: 'j.wilson@citymemorial.org',
    },
    {
      name: 'Dr. Priya Patel',
      specialization: 'Dermatology',
      hospital: 'Bayfront Health Pavilion',
      phone: '+1 (555) 678-9012',
      email: 'p.patel@bayfronthealth.org',
    },
    {
      name: 'Dr. Robert Martinez',
      specialization: 'Oncology',
      hospital: 'Hope Comprehensive Cancer Center',
      phone: '+1 (555) 789-0123',
      email: 'r.martinez@hopecancer.org',
    },
    {
      name: 'Dr. Olivia Taylor',
      specialization: 'General Medicine',
      hospital: 'Riverside Community Hospital',
      phone: '+1 (555) 890-1234',
      email: 'o.taylor@riversidehealth.org',
    },
    {
      name: 'Dr. Michael Chang',
      specialization: 'Cardiology',
      hospital: 'St. Jude General Hospital',
      phone: '+1 (555) 901-2345',
      email: 'm.chang@stjude.org',
    },
  ];

  const doctors = await Doctor.insertMany(doctorData);
  console.log(`[Seed] Successfully created ${doctors.length} doctors.`);

  // 3. Seed Patients with realistic medical data and staggered dates
  const patientTemplates = [
    {
      name: 'Eleanor Bennett',
      age: 64,
      gender: 'Female' as const,
      phone: '+1 (555) 111-2233',
      email: 'eleanor.b@example.com',
      condition: 'Critical' as PatientCondition,
      diagnosis: 'Acute Coronary Syndrome & Severe Ischemia',
      doctorIndex: 0,
      daysAgo: 2,
      notes: 'Immediate telemetry monitoring required. Scheduled for cardiac catheterization.',
    },
    {
      name: 'Arthur Pendelton',
      age: 58,
      gender: 'Male' as const,
      phone: '+1 (555) 222-3344',
      email: 'arthur.p@example.com',
      condition: 'Stable' as PatientCondition,
      diagnosis: 'Essential Hypertension & Hyperlipidemia',
      doctorIndex: 0,
      daysAgo: 12,
      notes: 'Blood pressure normalized at 128/82. Continuing ACE inhibitors.',
    },
    {
      name: 'Sophia Rodriguez',
      age: 42,
      gender: 'Female' as const,
      phone: '+1 (555) 333-4455',
      email: 'sophia.r@example.com',
      condition: 'Under Observation' as PatientCondition,
      diagnosis: 'Recurrent Migraines with Atypical Aura',
      doctorIndex: 1,
      daysAgo: 4,
      notes: 'Undergoing 48h EEG monitoring to rule out focal seizures.',
    },
    {
      name: 'Daniel Kim',
      age: 71,
      gender: 'Male' as const,
      phone: '+1 (555) 444-5566',
      email: 'daniel.k@example.com',
      condition: 'Stable' as PatientCondition,
      diagnosis: 'Early Stage Parkinsonian Tremors',
      doctorIndex: 1,
      daysAgo: 18,
      notes: 'Carbidopa/Levodopa titration well tolerated. Motor function improving.',
    },
    {
      name: 'Liam Noah Johnson',
      age: 8,
      gender: 'Male' as const,
      phone: '+1 (555) 555-6677',
      email: 'parent.johnson@example.com',
      condition: 'Recovered' as PatientCondition,
      diagnosis: 'Pediatric Viral Bronchitis',
      doctorIndex: 2,
      daysAgo: 15,
      notes: 'Lungs clear bilaterally. Discharged from acute pediatric ward.',
    },
    {
      name: 'Chloe Isabella Davis',
      age: 5,
      gender: 'Female' as const,
      phone: '+1 (555) 666-7788',
      email: 'davis.family@example.com',
      condition: 'Under Observation' as PatientCondition,
      diagnosis: 'Moderate Asthma Exacerbation',
      doctorIndex: 2,
      daysAgo: 1,
      notes: 'Oxygen saturation 97% on room air. Albuterol nebulizer tapered.',
    },
    {
      name: 'David Miller',
      age: 36,
      gender: 'Male' as const,
      phone: '+1 (555) 777-8899',
      email: 'david.m@example.com',
      condition: 'Stable' as PatientCondition,
      diagnosis: 'Right ACL Tear & Meniscal Repair Post-op',
      doctorIndex: 3,
      daysAgo: 8,
      notes: 'Surgical wounds clean and dry. Physical therapy commenced.',
    },
    {
      name: 'Margaret Scott',
      age: 68,
      gender: 'Female' as const,
      phone: '+1 (555) 888-9900',
      email: 'margaret.s@example.com',
      condition: 'Recovered' as PatientCondition,
      diagnosis: 'Left Total Hip Arthroplasty Recovery',
      doctorIndex: 3,
      daysAgo: 24,
      notes: 'Full weight-bearing tolerated without assistive devices.',
    },
    {
      name: 'Hannah Abbott',
      age: 29,
      gender: 'Female' as const,
      phone: '+1 (555) 999-0011',
      email: 'hannah.a@example.com',
      condition: 'Stable' as PatientCondition,
      diagnosis: 'Severe Plaque Psoriasis',
      doctorIndex: 4,
      daysAgo: 7,
      notes: 'Started on biologics. PASI score decreased by 60%.',
    },
    {
      name: 'George Clark',
      age: 62,
      gender: 'Male' as const,
      phone: '+1 (555) 123-4567',
      email: 'george.c@example.com',
      condition: 'Critical' as PatientCondition,
      diagnosis: 'Non-Small Cell Lung Carcinoma (Stage III)',
      doctorIndex: 5,
      daysAgo: 3,
      notes: 'Cycle 2 Chemo-immunotherapy scheduled. Monitoring CBC and renal panel.',
    },
    {
      name: 'Clara Oswald',
      age: 54,
      gender: 'Female' as const,
      phone: '+1 (555) 234-8901',
      email: 'clara.o@example.com',
      condition: 'Under Observation' as PatientCondition,
      diagnosis: 'Invasive Ductal Carcinoma Post Lumpectomy',
      doctorIndex: 5,
      daysAgo: 9,
      notes: 'Radiation oncology consult completed.',
    },
    {
      name: 'Walter White',
      age: 52,
      gender: 'Male' as const,
      phone: '+1 (555) 345-9012',
      email: 'walter.w@example.com',
      condition: 'Stable' as PatientCondition,
      diagnosis: 'Type 2 Diabetes Mellitus with Neuropathy',
      doctorIndex: 6,
      daysAgo: 20,
      notes: 'HbA1c lowered to 6.8%. Foot exam within normal limits.',
    },
    {
      name: 'Rebecca Ferguson',
      age: 38,
      gender: 'Female' as const,
      phone: '+1 (555) 456-0123',
      email: 'rebecca.f@example.com',
      condition: 'Recovered' as PatientCondition,
      diagnosis: 'Acute Streptococcal Pharyngitis',
      doctorIndex: 6,
      daysAgo: 28,
      notes: 'Completed 10-day amoxicillin course. Symptoms completely resolved.',
    },
    {
      name: 'Benjamin Franklin',
      age: 75,
      gender: 'Male' as const,
      phone: '+1 (555) 567-1234',
      email: 'ben.f@example.com',
      condition: 'Critical' as PatientCondition,
      diagnosis: 'Decompensated Congestive Heart Failure',
      doctorIndex: 7,
      daysAgo: 0,
      notes: 'IV furosemide infusion initiated. Fluid intake restricted.',
    },
    {
      name: 'Mia Thomas',
      age: 46,
      gender: 'Female' as const,
      phone: '+1 (555) 678-2345',
      email: 'mia.t@example.com',
      condition: 'Stable' as PatientCondition,
      diagnosis: 'Paroxysmal Atrial Fibrillation',
      doctorIndex: 7,
      daysAgo: 14,
      notes: 'Anticoagulation maintained. Normal sinus rhythm restored.',
    },
  ];

  const now = new Date();
  const patientsToInsert = patientTemplates.map((p) => {
    const admissionDate = new Date(now.getTime() - p.daysAgo * 24 * 60 * 60 * 1000);
    const assignedDoctor = doctors[p.doctorIndex % doctors.length];
    return {
      name: p.name,
      age: p.age,
      gender: p.gender,
      phone: p.phone,
      email: p.email,
      condition: p.condition,
      diagnosis: p.diagnosis,
      admissionDate,
      doctorId: assignedDoctor._id,
      notes: p.notes,
      createdAt: admissionDate,
    };
  });

  await Patient.insertMany(patientsToInsert);
  console.log(`[Seed] Successfully created ${patientsToInsert.length} patients.`);

  // Recalculate patientCount for all doctors
  for (const doc of doctors) {
    const count = await Patient.countDocuments({ doctorId: doc._id });
    await Doctor.findByIdAndUpdate(doc._id, { patientCount: count });
  }

  console.log('[Seed] Database seeding completed successfully!');
};

// If run directly via CLI
if (process.argv[1]?.endsWith('seedData.ts') || process.argv[1]?.endsWith('seedData.js')) {
  (async () => {
    try {
      await connectDB();
      await seedDatabase();
      await disconnectDB();
      process.exit(0);
    } catch (err) {
      console.error('[Seed Error]:', err);
      process.exit(1);
    }
  })();
}

