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

    it('rejects zero salary payload', async () => {
      const response = await request(app)
        .post('/api/employees/ACM-00001/salary')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          annualSalary: 0,
          currency: 'INR',
          effectiveFrom: '2099-01-01',
          reason: 'ANNUAL_REVIEW',
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects negative salary payload', async () => {
      const response = await request(app)
        .post('/api/employees/ACM-00001/salary')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          annualSalary: -50000,
          currency: 'INR',
          effectiveFrom: '2099-01-01',
          reason: 'ANNUAL_REVIEW',
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects backdated effectiveFrom — must be after current active salary date', async () => {
      // Fetch ACM-00003 current active salary effective date first
      const profileRes = await request(app)
        .get('/api/employees/ACM-00003')
        .set('Authorization', `Bearer ${authToken}`);

      expect(profileRes.status).toBe(200);
      const currentEffectiveFrom = profileRes.body.data.currentSalary.effectiveFrom;
      const currency = profileRes.body.data.currentSalary.currency;

      // Submit the exact same effectiveFrom as the current active salary — must be rejected
      const backdatedDate = new Date(currentEffectiveFrom).toISOString().split('T')[0];

      const response = await request(app)
        .post('/api/employees/ACM-00003/salary')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          annualSalary: 999999,
          currency,
          effectiveFrom: backdatedDate,
          reason: 'MARKET_ADJUSTMENT',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_EFFECTIVE_DATE');
    });

    it('rejects salary adjustment for INACTIVE employee', async () => {
      // ACM-00068 is seeded as INACTIVE
      const response = await request(app)
        .post('/api/employees/ACM-00068/salary')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          annualSalary: 80000,
          currency: 'USD',
          effectiveFrom: '2099-01-01',
          reason: 'ANNUAL_REVIEW',
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('EMPLOYEE_INACTIVE');
    });

    it('rejects salary adjustment for non-existent employee', async () => {
      const response = await request(app)
        .post('/api/employees/ACM-99999/salary')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          annualSalary: 80000,
          currency: 'USD',
          effectiveFrom: '2099-01-01',
          reason: 'ANNUAL_REVIEW',
        });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('EMPLOYEE_NOT_FOUND');
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
    it('returns salary records in reverse-chronological order (newest first)', async () => {
      const response = await request(app)
        .get('/api/employees/ACM-00002/salary')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      const records = response.body.data;
      expect(records).toBeInstanceOf(Array);
      expect(records.length).toBeGreaterThanOrEqual(2);

      // Active record (effectiveTo === null) must be first
      expect(records[0].effectiveTo).toBeNull();

      // Verify descending effectiveFrom order across all records
      for (let i = 0; i < records.length - 1; i++) {
        const current = new Date(records[i].effectiveFrom).getTime();
        const next = new Date(records[i + 1].effectiveFrom).getTime();
        expect(current).toBeGreaterThanOrEqual(next);
      }
    });

    it('returns 404 for salary history of non-existent employee', async () => {
      const response = await request(app)
        .get('/api/employees/ACM-99999/salary')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('EMPLOYEE_NOT_FOUND');
    });
  });
});
