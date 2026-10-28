import request from 'supertest';
import { createApp } from '../src/app';
import { setupTestDB } from './setup';

setupTestDB();

const app = createApp();

describe('Doctor Management Module', () => {
  let authToken: string;

  beforeEach(async () => {
    // Create and login an admin user
    const res = await request(app).post('/api/auth/register').send({
      name: 'Admin Doctor Tester',
      email: 'doctoradmin@doctortracker.com',
      password: 'AdminPassword123!',
    });
    authToken = res.body.data.token;
  });

  const sampleDoctor = {
    name: 'Dr. Gregory House',
    specialization: 'Diagnostic Medicine',
    hospital: 'Princeton-Plainsboro Teaching Hospital',
    phone: '+1 (555) 019-2831',
    email: 'house@ppth.org',
  };

  it('should create a new doctor with valid fields', async () => {
    const res = await request(app)
      .post('/api/doctors')
      .set('Authorization', `Bearer ${authToken}`)
      .send(sampleDoctor);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe(sampleDoctor.name);
    expect(res.body.data.specialization).toBe(sampleDoctor.specialization);
    expect(res.body.data.patientCount).toBe(0);
  });

  it('should reject doctor creation with missing required fields', async () => {
    const res = await request(app)
      .post('/api/doctors')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Dr. Incomplete',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should list doctors and support pagination', async () => {
    // Create 3 doctors
    await request(app)
      .post('/api/doctors')
      .set('Authorization', `Bearer ${authToken}`)
      .send(sampleDoctor);

    await request(app)
      .post('/api/doctors')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        ...sampleDoctor,
        name: 'Dr. James Wilson',
        specialization: 'Oncology',
        email: 'wilson@ppth.org',
      });

    await request(app)
      .post('/api/doctors')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        ...sampleDoctor,
        name: 'Dr. Lisa Cuddy',
        specialization: 'Endocrinology',
        email: 'cuddy@ppth.org',
      });

    const res = await request(app)
      .get('/api/doctors?page=1&limit=2')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(2);
    expect(res.body.pagination.total).toBe(3);
    expect(res.body.pagination.totalPages).toBe(2);
  });

  it('should search doctors by keyword across name and specialization', async () => {
    await request(app)
      .post('/api/doctors')
      .set('Authorization', `Bearer ${authToken}`)
      .send(sampleDoctor);

    await request(app)
      .post('/api/doctors')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        ...sampleDoctor,
        name: 'Dr. Allison Cameron',
        specialization: 'Immunology',
        email: 'cameron@ppth.org',
      });

    const searchRes = await request(app)
      .get('/api/doctors?search=Immunology')
      .set('Authorization', `Bearer ${authToken}`);

    expect(searchRes.status).toBe(200);
    expect(searchRes.body.data.length).toBe(1);
    expect(searchRes.body.data[0].name).toBe('Dr. Allison Cameron');
  });

  it('should filter doctors by specialization and hospital', async () => {
    await request(app)
      .post('/api/doctors')
      .set('Authorization', `Bearer ${authToken}`)
      .send(sampleDoctor);

    const filterRes = await request(app)
      .get('/api/doctors?specialization=Diagnostic Medicine')
      .set('Authorization', `Bearer ${authToken}`);

    expect(filterRes.status).toBe(200);
    expect(filterRes.body.data.length).toBe(1);
    expect(filterRes.body.data[0].specialization).toBe('Diagnostic Medicine');
  });

  it('should add patient under specific doctor and update doctor patient count', async () => {
    const docRes = await request(app)
      .post('/api/doctors')
      .set('Authorization', `Bearer ${authToken}`)
      .send(sampleDoctor);

    const doctorId = docRes.body.data._id;

    // Add patient under doctor
    const patientRes = await request(app)
      .post(`/api/doctors/${doctorId}/patients`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'John Patient',
        age: 45,
        gender: 'Male',
        phone: '+1 (555) 999-1234',
        condition: 'Critical',
        diagnosis: 'Suspected Vasculitis',
      });

    expect(patientRes.status).toBe(201);
    expect(patientRes.body.success).toBe(true);
    expect(patientRes.body.data.name).toBe('John Patient');
    expect(patientRes.body.data.doctorId).toBe(doctorId);

    // Verify doctor view details returns the patient
    const doctorDetailRes = await request(app)
      .get(`/api/doctors/${doctorId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(doctorDetailRes.status).toBe(200);
    expect(doctorDetailRes.body.data.patientCount).toBe(1);
    expect(doctorDetailRes.body.data.patients.length).toBe(1);
    expect(doctorDetailRes.body.data.patients[0].name).toBe('John Patient');

    // Delete patient from doctor list
    const patientId = patientRes.body.data._id;
    const delRes = await request(app)
      .delete(`/api/doctors/${doctorId}/patients/${patientId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(delRes.status).toBe(200);
    expect(delRes.body.success).toBe(true);

    // Verify patient count updated
    const afterDelRes = await request(app)
      .get(`/api/doctors/${doctorId}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(afterDelRes.body.data.patientCount).toBe(0);
    expect(afterDelRes.body.data.patients.length).toBe(0);
  });
});

