import request from 'supertest';
import { createApp } from '../src/app';
import { setupTestDB } from './setup';

setupTestDB();

const app = createApp();

describe('Patient Management Module', () => {
  let authToken: string;
  let doctorId: string;

  beforeEach(async () => {
    // Register user
    const userRes = await request(app).post('/api/auth/register').send({
      name: 'Admin Patient Tester',
      email: 'patientadmin@doctortracker.com',
      password: 'AdminPassword123!',
    });
    authToken = userRes.body.data.token;

    // Create a doctor to assign patients
    const docRes = await request(app)
      .post('/api/doctors')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Dr. Robert Chase',
        specialization: 'Critical Care Medicine',
        hospital: 'Mercy General',
        phone: '+1 (555) 789-0123',
        email: 'chase@mercy.org',
      });
    doctorId = docRes.body.data._id;
  });

  it('should create a new patient and associate with doctor', async () => {
    const res = await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Jane Doe',
        age: 34,
        gender: 'Female',
        phone: '+1 (555) 321-4321',
        condition: 'Stable',
        diagnosis: 'Bacterial Tonsillitis',
        doctorId,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Jane Doe');
    expect(res.body.data.condition).toBe('Stable');
    expect(res.body.data.doctorId._id).toBe(doctorId);
  });

  it('should filter patients by condition (Critical, Stable, etc.)', async () => {
    // Create one Stable and one Critical patient
    await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Patient Stable',
        age: 28,
        gender: 'Female',
        phone: '+1 (555) 111-0001',
        condition: 'Stable',
        diagnosis: 'Routine Checkup',
        doctorId,
      });

    await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Patient Critical',
        age: 65,
        gender: 'Male',
        phone: '+1 (555) 111-0002',
        condition: 'Critical',
        diagnosis: 'Severe Sepsis',
        doctorId,
      });

    const res = await request(app)
      .get('/api/patients?condition=Critical')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].condition).toBe('Critical');
    expect(res.body.data[0].name).toBe('Patient Critical');
  });

  it('should search patients by keyword in name or diagnosis', async () => {
    await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Alice Cooper',
        age: 50,
        gender: 'Female',
        phone: '+1 (555) 555-8888',
        condition: 'Stable',
        diagnosis: 'Type 1 Diabetes Mellitus',
        doctorId,
      });

    const res = await request(app)
      .get('/api/patients?search=Diabetes')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].name).toBe('Alice Cooper');
  });

  it('should edit patient information', async () => {
    const createRes = await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Bob Ross',
        age: 52,
        gender: 'Male',
        phone: '+1 (555) 444-3333',
        condition: 'Under Observation',
        diagnosis: 'Mild Concussion',
        doctorId,
      });

    const patientId = createRes.body.data._id;

    // Update patient condition to Recovered
    const updateRes = await request(app)
      .put(`/api/patients/${patientId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        condition: 'Recovered',
        notes: 'Patient shows zero residual symptoms.',
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.success).toBe(true);
    expect(updateRes.body.data.condition).toBe('Recovered');
    expect(updateRes.body.data.notes).toBe('Patient shows zero residual symptoms.');
  });

  it('should delete patient and decrement doctor count', async () => {
    const createRes = await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Patient To Delete',
        age: 40,
        gender: 'Other',
        phone: '+1 (555) 999-0000',
        condition: 'Stable',
        diagnosis: 'Observation',
        doctorId,
      });

    const patientId = createRes.body.data._id;

    const delRes = await request(app)
      .delete(`/api/patients/${patientId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(delRes.status).toBe(200);
    expect(delRes.body.success).toBe(true);

    // Verify it is gone
    const fetchRes = await request(app)
      .get(`/api/patients/${patientId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(fetchRes.status).toBe(404);
  });
});

