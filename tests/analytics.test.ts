import request from 'supertest';
import { createApp } from '../src/app';
import { setupTestDB } from './setup';

setupTestDB();

const app = createApp();

describe('Analytics & Dashboard Module', () => {
  let authToken: string;

  beforeEach(async () => {
    const userRes = await request(app).post('/api/auth/register').send({
      name: 'Analytics Tester',
      email: 'analytics@doctortracker.com',
      password: 'AdminPassword123!',
    });
    authToken = userRes.body.data.token;
  });

  it('should return aggregated dashboard analytics correctly', async () => {
    // 1. Create 2 doctors
    const doc1 = await request(app)
      .post('/api/doctors')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Dr. Alpha',
        specialization: 'Cardiology',
        hospital: 'Alpha Hospital',
        phone: '+1 555-1111',
        email: 'alpha@hospital.org',
      });

    const doc2 = await request(app)
      .post('/api/doctors')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Dr. Beta',
        specialization: 'Neurology',
        hospital: 'Beta Hospital',
        phone: '+1 555-2222',
        email: 'beta@hospital.org',
      });

    // 2. Create 3 patients: 2 under doc1, 1 under doc2
    await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Patient 1',
        age: 30,
        gender: 'Male',
        phone: '+1 555-3333',
        condition: 'Critical',
        diagnosis: 'Heart Condition',
        doctorId: doc1.body.data._id,
      });

    await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Patient 2',
        age: 40,
        gender: 'Female',
        phone: '+1 555-4444',
        condition: 'Stable',
        diagnosis: 'Hypertension',
        doctorId: doc1.body.data._id,
      });

    await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Patient 3',
        age: 50,
        gender: 'Female',
        phone: '+1 555-5555',
        condition: 'Under Observation',
        diagnosis: 'Stroke Recovery',
        doctorId: doc2.body.data._id,
      });

    // 3. Fetch dashboard analytics
    const res = await request(app)
      .get('/api/analytics/dashboard')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const data = res.body.data;
    expect(data.summary.totalDoctors).toBe(2);
    expect(data.summary.totalPatients).toBe(3);
    expect(data.summary.averagePatientsPerDoctor).toBe(1.5);

    // Verify condition breakdown
    expect(data.conditionStats).toBeDefined();
    const criticalStat = data.conditionStats.find((c: any) => c.condition === 'Critical');
    expect(criticalStat.count).toBe(1);

    // Verify specialization breakdown
    expect(data.specializationStats).toBeDefined();
    expect(data.specializationStats.length).toBeGreaterThanOrEqual(2);

    // Verify date statistics
    expect(Array.isArray(data.dateStats)).toBe(true);
  });
});

