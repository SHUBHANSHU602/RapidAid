require('dotenv').config();
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const EmergencySession = require('../models/EmergencySession');
const User = require('../models/User');

let adminToken;
let sessionId;

beforeAll(async () => {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'admin@rapidaid.com', password: 'admin123' });
  adminToken = res.body.accessToken;
});

afterAll(async () => {
  // Clean up test session
  if (sessionId) await EmergencySession.findByIdAndDelete(sessionId);
  await mongoose.connection.close();
});

describe('Emergency Session — Full Lifecycle', () => {

  test('1. Trigger emergency — session created', async () => {
    const res = await request(app)
      .post('/api/v1/emergency/trigger')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        lat: 25.3176,
        lng: 82.9739,
        emergencyType: 'CARDIAC',
        severityLevel: 4,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.sessionId).toBeDefined();
    sessionId = res.body.data.sessionId;
  });

  test('2. Get session — returns correct data', async () => {
    const res = await request(app)
      .get(`/api/v1/emergency/${sessionId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(sessionId);
  });

  test('3. Invalid transition — INITIATED to EN_ROUTE should fail', async () => {
    const res = await request(app)
      .post(`/api/v1/emergency/${sessionId}/transition`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'EN_ROUTE' });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Cannot transition');
  });

  test('4. Valid transition — INITIATED to ASSIGNED', async () => {
    const res = await request(app)
      .post(`/api/v1/emergency/${sessionId}/transition`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'ASSIGNED', metadata: { note: 'integration test' } });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ASSIGNED');
  });

  test('5. Valid transition — ASSIGNED to EN_ROUTE', async () => {
    const res = await request(app)
      .post(`/api/v1/emergency/${sessionId}/transition`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'EN_ROUTE' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('EN_ROUTE');
  });

  test('6. Invalid transition — EN_ROUTE to ASSIGNED should fail', async () => {
    const res = await request(app)
      .post(`/api/v1/emergency/${sessionId}/transition`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'ASSIGNED' });

    expect(res.status).toBe(400);
  });

  test('7. Valid transition — EN_ROUTE to RESOLVED', async () => {
    const res = await request(app)
      .post(`/api/v1/emergency/${sessionId}/transition`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'RESOLVED' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('RESOLVED');
    expect(res.body.data.resolvedAt).toBeDefined();
  });

  test('8. EventLog has all transitions recorded', async () => {
    const session = await EmergencySession.findById(sessionId);
    const events = session.eventLog.map(e => e.status);
    expect(events).toContain('ASSIGNED');
    expect(events).toContain('EN_ROUTE');
    expect(events).toContain('RESOLVED');
  });

  test('9. Unauthorized user cannot access session', async () => {
    // Create a stranger user
    await User.deleteOne({ email: 'stranger@test.com' });
    const stranger = await User.create({
      name: 'Stranger',
      email: 'stranger@test.com',
      password: 'Test@1234',
      role: 'USER',
    });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'stranger@test.com', password: 'Test@1234' });

    const strangerToken = loginRes.body.accessToken;

    const res = await request(app)
      .get(`/api/v1/emergency/${sessionId}`)
      .set('Authorization', `Bearer ${strangerToken}`);

    expect(res.status).toBe(403);

    await User.deleteOne({ email: 'stranger@test.com' });
  });

});