import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../app';

describe('Employee Module API', () => {
  let authToken: string;

  beforeAll(async () => {
    // Authenticate as HR Admin to get bearer token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'hr@acme.com',
        password: process.env.SEED_ADMIN_PASSWORD || 'Admin#Pass2026!',
      });

    expect(loginRes.status).toBe(200);
    authToken = loginRes.body.data.token;
  });

  describe('Authentication Enforcement', () => {
    it('should return 401 when accessing employees without auth token', async () => {
      const response = await request(app).get('/api/employees');
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('GET /api/employees (Search, Filter, Pagination)', () => {
    it('should return paginated list with default limit (25)', async () => {
      const response = await request(app)
        .get('/api/employees')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(25);
      expect(response.body.pagination.total).toBe(10000);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(25);
      expect(response.body.pagination.totalPages).toBe(400);
    });

    it('should respect custom page and limit', async () => {
      const response = await request(app)
        .get('/api/employees?page=2&limit=10')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(10);
      expect(response.body.pagination.page).toBe(2);
      expect(response.body.pagination.limit).toBe(10);
    });

    it('should search by employee code', async () => {
      const response = await request(app)
        .get('/api/employees?search=ACM-00001')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].employeeCode).toBe('ACM-00001');
      expect(response.body.data[0].currentSalary).toBeDefined();
    });

    it('should filter by country and department', async () => {
      const response = await request(app)
        .get('/api/employees?country=Germany&department=Engineering&limit=10')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
      response.body.data.forEach((emp: any) => {
        expect(emp.country).toBe('Germany');
        expect(emp.department).toBe('Engineering');
      });
    });

    it('should filter by currency and minimum salary', async () => {
      const response = await request(app)
        .get('/api/employees?currency=USD&minSalary=150000&limit=10')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
      response.body.data.forEach((emp: any) => {
        expect(emp.currentSalary.currency).toBe('USD');
        expect(emp.currentSalary.annualSalary).toBeGreaterThanOrEqual(150000);
      });
    });
  });

  describe('GET /api/employees/facets', () => {
    it('should return distinct metadata facets for filters', async () => {
      const response = await request(app)
        .get('/api/employees/facets')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.countries.length).toBe(7);
      expect(response.body.data.departments.length).toBe(8);
      expect(response.body.data.currencies).toContain('USD');
      expect(response.body.data.currencies).toContain('EUR');
      expect(response.body.data.currencies).toContain('NOK');
      expect(response.body.data.statuses).toEqual(['ACTIVE', 'ON_LEAVE', 'INACTIVE']);
    });
  });

  describe('GET /api/employees/:id (Detailed Profile)', () => {
    it('should return employee detail with full salary progression history', async () => {
      const response = await request(app)
        .get('/api/employees/ACM-00001')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.employeeCode).toBe('ACM-00001');
      expect(response.body.data.tenure).toBeDefined();
      expect(response.body.data.tenure.years).toBeTypeOf('number');
      expect(response.body.data.salaryHistory).toBeInstanceOf(Array);
      expect(response.body.data.salaryHistory.length).toBeGreaterThanOrEqual(1);
      expect(response.body.data.currentSalary.monthlySalary).toBeGreaterThan(0);
      expect(response.body.data.monthlyPayouts).toBeInstanceOf(Array);
      expect(response.body.data.monthlyPayouts.length).toBeGreaterThan(0);
      expect(response.body.data.monthlyPayouts[0].amount).toBeGreaterThan(0);
      expect(response.body.data.monthlyPayouts[0].grossSalary).toBeGreaterThan(0);
      expect(response.body.data.monthlyPayouts[0].taxDeduction).toBeGreaterThan(0);
      expect(response.body.data.monthlyPayouts[0].netSalary).toBeGreaterThan(0);
      expect(response.body.data.monthlyPayouts[0].totalDeductions).toBe(
        response.body.data.monthlyPayouts[0].taxDeduction +
        response.body.data.monthlyPayouts[0].leaveDeduction +
        response.body.data.monthlyPayouts[0].otherDeductions
      );
      expect(response.body.data.monthlyPayouts[0].netSalary).toBe(
        response.body.data.monthlyPayouts[0].grossSalary - response.body.data.monthlyPayouts[0].totalDeductions
      );
      expect(['PAID', 'SCHEDULED']).toContain(response.body.data.monthlyPayouts[0].status);
      if (response.body.data.monthlyPayouts.length > 1) {
        expect(response.body.data.monthlyPayouts[1].status).toBe('PAID');
      }
    });

    it('should return 404 for non-existent employee', async () => {
      const response = await request(app)
        .get('/api/employees/ACM-99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('EMPLOYEE_NOT_FOUND');
    });
  });
});
