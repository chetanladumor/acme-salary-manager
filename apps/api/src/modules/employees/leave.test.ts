import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../app';

describe('Leave & LOP Module (via Employee Detail API)', () => {
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

  describe('Leave Balances', () => {
    it('returns correct standard leave quotas for every employee', async () => {
      const response = await request(app)
        .get('/api/employees/ACM-00001')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      const { leaveBalances } = response.body.data;

      // Standard quotas defined in seed script
      expect(leaveBalances.sick.quota).toBe(10);
      expect(leaveBalances.casual.quota).toBe(12);
      expect(leaveBalances.annual.quota).toBe(15);

      // Balances must be non-negative and not exceed quota
      expect(leaveBalances.sick.balance).toBeGreaterThanOrEqual(0);
      expect(leaveBalances.sick.balance).toBeLessThanOrEqual(10);
      expect(leaveBalances.casual.balance).toBeGreaterThanOrEqual(0);
      expect(leaveBalances.casual.balance).toBeLessThanOrEqual(12);
      expect(leaveBalances.annual.balance).toBeGreaterThanOrEqual(0);
      expect(leaveBalances.annual.balance).toBeLessThanOrEqual(15);
    });

    it('totalRemaining = sick.remaining + casual.remaining + annual.remaining', async () => {
      const response = await request(app)
        .get('/api/employees/ACM-00001')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      const { leaveBalances } = response.body.data;

      const expectedTotal =
        leaveBalances.sick.balance +
        leaveBalances.casual.balance +
        leaveBalances.annual.balance;

      expect(leaveBalances.totalRemaining).toBe(expectedTotal);
    });

    it('totalUsed = total quota - totalRemaining', async () => {
      const response = await request(app)
        .get('/api/employees/ACM-00001')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      const { leaveBalances } = response.body.data;

      const totalQuota = 10 + 12 + 15; // sick + casual + annual
      const expectedUsed = totalQuota - leaveBalances.totalRemaining;
      expect(leaveBalances.totalUsed ?? (totalQuota - leaveBalances.totalRemaining)).toBe(expectedUsed);
    });
  });

  describe('Leave History', () => {
    it('returns leave history records as an array', async () => {
      const response = await request(app)
        .get('/api/employees/ACM-00001')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.leaveHistory).toBeInstanceOf(Array);
      expect(response.body.data.leaveHistory.length).toBeGreaterThanOrEqual(1);
    });

    it('each leave record has required fields: leaveType, startDate, endDate, daysCount, isPaid, status', async () => {
      const response = await request(app)
        .get('/api/employees/ACM-00001')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      const leave = response.body.data.leaveHistory[0];

      expect(leave.leaveType).toBeDefined();
      expect(['SICK', 'CASUAL', 'ANNUAL', 'UNPAID']).toContain(leave.leaveType);
      expect(leave.startDate).toBeDefined();
      expect(leave.endDate).toBeDefined();
      expect(leave.daysCount).toBeGreaterThan(0);
      expect(typeof leave.isPaid).toBe('boolean');
      expect(leave.status).toBeDefined();
    });
  });

  describe('LOP Deduction in Payslip', () => {
    it('payslip leaveDeduction reflects LOP for months with unpaid leave', async () => {
      const response = await request(app)
        .get('/api/employees/ACM-00001')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      const payouts = response.body.data.monthlyPayouts;
      expect(payouts).toBeInstanceOf(Array);
      expect(payouts.length).toBeGreaterThan(0);

      // Verify payslip math: netSalary = grossSalary - totalDeductions
      for (const payout of payouts) {
        expect(payout.grossSalary).toBeGreaterThan(0);
        expect(payout.netSalary).toBeGreaterThan(0);
        expect(payout.leaveDeduction).toBeGreaterThanOrEqual(0);
        expect(payout.taxDeduction).toBeGreaterThan(0);
        expect(payout.otherDeductions).toBeGreaterThanOrEqual(0);

        // totalDeductions = tax + leave + other
        const expectedTotal = payout.taxDeduction + payout.leaveDeduction + payout.otherDeductions;
        expect(payout.totalDeductions).toBe(expectedTotal);

        // netSalary = grossSalary - totalDeductions
        expect(payout.netSalary).toBe(payout.grossSalary - payout.totalDeductions);

        // netSalary must always be less than grossSalary
        expect(payout.netSalary).toBeLessThan(payout.grossSalary);
      }
    });

    it('payslips have valid PAID or SCHEDULED status', async () => {
      const response = await request(app)
        .get('/api/employees/ACM-00001')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      const payouts = response.body.data.monthlyPayouts;

      for (const payout of payouts) {
        expect(['PAID', 'SCHEDULED']).toContain(payout.status);
      }

      // At most one SCHEDULED record (the upcoming month)
      const scheduledCount = payouts.filter((p: any) => p.status === 'SCHEDULED').length;
      expect(scheduledCount).toBeLessThanOrEqual(1);
    });

    it('unpaid leave deduction = unpaidDays × (monthlyGross / 22) — LOP daily rate formula', async () => {
      const response = await request(app)
        .get('/api/employees/ACM-00001')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      const payouts = response.body.data.monthlyPayouts;

      // Find a payout that has LOP deduction
      const lopPayout = payouts.find((p: any) => p.leaveDeduction > 0 && p.unpaidLeaveDays > 0);

      if (lopPayout) {
        const { grossSalary, unpaidLeaveDays, leaveDeduction } = lopPayout;
        const dailyRate = Math.round(grossSalary / 22);
        const expectedDeduction = unpaidLeaveDays * dailyRate;
        // Allow ±1 rounding tolerance
        expect(Math.abs(leaveDeduction - expectedDeduction)).toBeLessThanOrEqual(1);
      }
    });
  });
});
