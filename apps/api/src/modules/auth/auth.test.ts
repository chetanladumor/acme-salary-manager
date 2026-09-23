import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../app';

describe('Auth Module API', () => {
  const validEmail = 'hr@acme.com';
  const validPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin#Pass2026!';

  describe('POST /api/auth/login', () => {
    it('should return 400 when body is invalid', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'not-an-email' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 401 when password is wrong', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: validEmail, password: 'WrongPassword123' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return 200 and token on valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: validEmail, password: validPassword });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.email).toBe(validEmail);
      expect(response.body.data.user.role).toBe('HR_ADMIN');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return 401 if no Authorization header provided', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 if token is invalid', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token-string');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });

    it('should return user profile when valid token provided', async () => {
      // Login first to get token
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: validEmail, password: validPassword });

      const token = loginRes.body.data.token;

      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(meRes.status).toBe(200);
      expect(meRes.body.success).toBe(true);
      expect(meRes.body.data.email).toBe(validEmail);
      expect(meRes.body.data.role).toBe('HR_ADMIN');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should return 200 on logout', async () => {
      const response = await request(app).post('/api/auth/logout');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
