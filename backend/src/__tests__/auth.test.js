const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const User = require('../models/User');

jest.setTimeout(30000);

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
  });
});

afterAll(async () => {
  await User.deleteMany({ email: /testauth/i });
  await mongoose.connection.close();
});

describe('Auth — Register', () => {
  it('should register a new user and return tokens', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Test User',
        email: 'testauth1@test.com',
        password: 'test123'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.user.password).toBeUndefined();
  });

  it('should return 400 for duplicate email', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Test User', email: 'testauth2@test.com', password: 'test123' });

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Test User', email: 'testauth2@test.com', password: 'test123' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 for missing fields', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'testauth3@test.com' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('Auth — Login', () => {
  it('should login and return tokens', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Test User', email: 'testauth4@test.com', password: 'test123' });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'testauth4@test.com', password: 'test123' });

    expect(res.statusCode).toBe(200);
    expect(res.body.accessToken).toBeDefined();
  });

  it('should return 401 for wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'testauth4@test.com', password: 'wrongpassword' });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('Invalid credentials');
  });
});

describe('Auth — Protected route', () => {
  it('should return user data with valid token', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'testauth4@test.com', password: 'test123' });

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${loginRes.body.accessToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.user.email).toBe('testauth4@test.com');
  });

  it('should return 401 with no token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.statusCode).toBe(401);
  });
});

describe('Privilege boundaries', () => {
  test('public registration cannot create an admin or driver', async () => {
    for (const role of ['ADMIN', 'DRIVER']) {
      const result = await request(app).post('/api/v1/auth/register')
        .send({ name: 'Blocked', email: 'testauthblocked@test.com', password: 'test123', role });
      expect(result.status).toBe(403);
    }
  });
});

describe('Refresh token rotation and revocation', () => {
  test('rejects replayed refresh token and revoked token after logout', async () => {
    const email = 'testauthrefreshreplay@test.com';
    await User.deleteOne({ email });
    const signup = await request(app).post('/api/v1/auth/register')
      .send({ name: 'Refresh User', email, password: 'test123' });
    expect(signup.status).toBe(201);
    const rotated = await request(app).post('/api/v1/auth/refresh-token')
      .send({ refreshToken: signup.body.refreshToken });
    expect(rotated.status).toBe(200);
    expect(rotated.body.refreshToken).not.toBe(signup.body.refreshToken);
    const replay = await request(app).post('/api/v1/auth/refresh-token')
      .send({ refreshToken: signup.body.refreshToken });
    expect(replay.status).toBe(401);
    const logout = await request(app).post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${rotated.body.accessToken}`);
    expect(logout.status).toBe(200);
    const revoked = await request(app).post('/api/v1/auth/refresh-token')
      .send({ refreshToken: rotated.body.refreshToken });
    expect(revoked.status).toBe(401);
    await User.deleteOne({ email });
  });
});
