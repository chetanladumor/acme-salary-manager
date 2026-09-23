import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../app';

describe('Analytics Module API', () => {
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

  describe('GET /api/analytics/overview', () => {
    it('rejects unauthenticated requests with 401', async () => {
      const response = await request(app).get('/api/analytics/overview');
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('returns executive workforce KPIs and aggregations', async () => {
      const response = await request(app)
        .get('/api/analytics/overview')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const data = response.body.data;

      // KPIs
      expect(data.kpis).toBeDefined();
      expect(data.kpis.totalHeadcount).toBe(10000);
      expect(data.kpis.activeHeadcount).toBeGreaterThan(9000);
      expect(data.kpis.totalHistoricalRevisions).toBeGreaterThan(17000);
      expect(data.kpis.departmentsCount).toBe(8);
      expect(data.kpis.countriesCount).toBe(7);

      // Department distributions
      expect(data.departments).toBeInstanceOf(Array);
      expect(data.departments.length).toBe(8);
      expect(data.departments[0].headcount).toBeGreaterThan(0);
      expect(data.departments[0].avgSalary).toBeGreaterThan(0);

      // Country distributions
      expect(data.countries).toBeInstanceOf(Array);
      expect(data.countries.length).toBe(7);
      expect(data.countries[0].currency).toBeDefined();
      expect(data.countries[0].monthlyPayroll).toBeGreaterThan(0);

      // Next month payroll forecast
      expect(data.kpis.nextMonthPayrollByCurrency).toBeInstanceOf(Array);
      expect(data.kpis.nextMonthPayrollByCurrency.length).toBe(7);
      expect(data.kpis.nextMonthPayrollByCurrency[0].monthlyPayroll).toBeGreaterThan(0);
      expect(data.kpis.nextMonthPayrollByCurrency[0].netMonthlyPayroll).toBeGreaterThan(0);
      expect(data.kpis.nextMonthPayrollByCurrency[0].deductionsMonthlyPayroll).toBeGreaterThan(0);

      // Change reasons
      expect(data.reasons).toBeInstanceOf(Array);
      expect(data.reasons.length).toBeGreaterThanOrEqual(3);
    });
  });
});
