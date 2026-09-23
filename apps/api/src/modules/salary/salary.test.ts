import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../app';

describe('Salary Module API', () => {
  let authToken: string;

  beforeAll(async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'hr@acme.com',
        password: process.env.SEED_ADMIN_PASSWORD || 'Admin#Pass2026!',
      });

    expect(loginRes.status).toBe(200);
    authToken = loginRes.body.data.token;
  });

  describe('POST /api/employees/:id/salary (Atomic Compensation Adjustment)', () => {
    it('rejects unauthenticated requests', async () => {
      const response = await request(app)
        .post('/api/employees/ACM-00001/salary')
        .send({
          annualSalary: 1650000,
          currency: 'INR',
          effectiveFrom: '2026-10-01',
          reason: 'ANNUAL_REVIEW',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('rejects negative salary payload', async () => {
      const response = await request(app)
        .post('/api/employees/ACM-00001/salary')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          annualSalary: -50000,
          currency: 'INR',
          effectiveFrom: '2026-10-01',
          reason: 'ANNUAL_REVIEW',
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('successfully processes compensation raise with audit trail', async () => {
      const testEmployeeCode = 'ACM-00002';

      // 1. Fetch current compensation first
      const beforeRes = await request(app)
        .get(`/api/employees/${testEmployeeCode}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(beforeRes.status).toBe(200);
      const previousSalary = beforeRes.body.data.currentSalary.annualSalary;
      const currency = beforeRes.body.data.currentSalary.currency;
      const currentEffectiveFrom = beforeRes.body.data.currentSalary.effectiveFrom;
      const futureDate = new Date(new Date(currentEffectiveFrom).getTime() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
      const newSalary = previousSalary + 15000;

      // 2. Submit salary adjustment
      const adjustRes = await request(app)
        .post(`/api/employees/${testEmployeeCode}/salary`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          annualSalary: newSalary,
          currency,
          effectiveFrom: futureDate,
          reason: 'PROMOTION',
        });

      expect(adjustRes.status).toBe(201);
      expect(adjustRes.body.success).toBe(true);
      expect(adjustRes.body.data.salaryRecord.annualSalary).toBe(newSalary);
      expect(adjustRes.body.data.salaryRecord.reason).toBe('PROMOTION');
      expect(adjustRes.body.data.salaryRecord.effectiveTo).toBeNull();
      expect(adjustRes.body.data.auditLogId).toBeDefined();

      // 3. Verify updated employee profile reflects new active salary
      const afterRes = await request(app)
        .get(`/api/employees/${testEmployeeCode}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(afterRes.status).toBe(200);
      expect(afterRes.body.data.currentSalary.annualSalary).toBe(newSalary);
      expect(afterRes.body.data.salaryHistory.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('GET /api/employees/:id/salary (History Timeline)', () => {
    it('returns ordered salary progression records', async () => {
      const response = await request(app)
        .get('/api/employees/ACM-00002/salary')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
      expect(response.body.data[0].effectiveTo).toBeNull(); // newest active
    });
  });
});
