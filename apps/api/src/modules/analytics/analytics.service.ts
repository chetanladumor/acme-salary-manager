import { prisma } from '../../db/prisma';

export interface DepartmentMetric {
  department: string;
  headcount: number;
  avgSalary: number;
  minSalary: number;
  maxSalary: number;
}

export interface CountryMetric {
  country: string;
  countryCode: string;
  currency: string;
  headcount: number;
  avgSalary: number;
  minSalary: number;
  maxSalary: number;
  monthlyPayroll: number; // Cashflow obligation required (payableGross = grossMonthlyPayroll - leaveDeductionsMonthlyPayroll)
  grossMonthlyPayroll: number; // Total salary decided
  payableGrossMonthlyPayroll?: number; //  same as monthlyPayroll, Cashflow obligation required
  netMonthlyPayroll: number; // monthlyPayroll - deductions (taxes)  Cash outflow: Direct pay to employees
  deductionsMonthlyPayroll: number; // Cash outflow: Taxes & benefits to authorities
  leaveDeductionsMonthlyPayroll?: number; // Cash retained: Unpaid leave (LOP) savings
}

export interface ReasonMetric {
  reason: string;
  count: number;
  percentage: string;
}

export interface AnalyticsOverview {
  kpis: {
    totalHeadcount: number;
    activeHeadcount: number;
    onLeaveHeadcount: number;
    inactiveHeadcount: number;
    totalHistoricalRevisions: number;
    departmentsCount: number;
    countriesCount: number;
    nextMonthPayrollByCurrency: Array<{
      country: string;
      currency: string;
      headcount: number;
      monthlyPayroll: number;
      grossMonthlyPayroll: number;
      payableGrossMonthlyPayroll?: number;
      netMonthlyPayroll: number;
      deductionsMonthlyPayroll: number;
      leaveDeductionsMonthlyPayroll?: number;
    }>;
  };
  departments: DepartmentMetric[];
  countries: CountryMetric[];
  reasons: ReasonMetric[];
  calculatedAt: string;
}

export class AnalyticsService {
  private static cache: {
    data: AnalyticsOverview;
    expiresAt: number;
  } | null = null;

  static async getOverview(): Promise<AnalyticsOverview> {
    // 2-minute in-memory cache
    if (this.cache && this.cache.expiresAt > Date.now()) {
      return this.cache.data;
    }

    // 1. High-level KPIs
    const [
      totalHeadcount,
      activeHeadcount,
      onLeaveHeadcount,
      inactiveHeadcount,
      totalHistoricalRevisions,
    ] = await Promise.all([
      prisma.employee.count(),
      prisma.employee.count({ where: { status: 'ACTIVE' } }),
      prisma.employee.count({ where: { status: 'ON_LEAVE' } }),
      prisma.employee.count({ where: { status: 'INACTIVE' } }),
      prisma.salaryRecord.count(),
    ]);

    // 2. Department Breakdown
    const departmentEmployees = await prisma.employee.findMany({
      select: {
        department: true,
        salaryRecords: {
          where: { effectiveTo: null },
          select: { annualSalary: true },
        },
      },
    });

    const deptMap: Record<string, { count: number; salaries: number[] }> = {};
    for (const emp of departmentEmployees) {
      if (!deptMap[emp.department]) {
        deptMap[emp.department] = { count: 0, salaries: [] };
      }
      deptMap[emp.department].count++;
      if (emp.salaryRecords[0]) {
        deptMap[emp.department].salaries.push(Number(emp.salaryRecords[0].annualSalary));
      }
    }

    const departments: DepartmentMetric[] = Object.keys(deptMap)
      .map((dept) => {
        const item = deptMap[dept];
        const count = item.count;
        const salaries = item.salaries;
        const sum = salaries.reduce((a, b) => a + b, 0);
        const avg = salaries.length > 0 ? Math.round(sum / salaries.length) : 0;
        const min = salaries.length > 0 ? Math.min(...salaries) : 0;
        const max = salaries.length > 0 ? Math.max(...salaries) : 0;

        return {
          department: dept,
          headcount: count,
          avgSalary: avg,
          minSalary: min,
          maxSalary: max,
        };
      })
      .sort((a, b) => b.headcount - a.headcount);

    // 3. Country & Currency Breakdown + Scheduled Next-Month Disbursements
    const [countryEmployees, scheduledDisbursements] = await Promise.all([
      prisma.employee.findMany({
        select: {
          country: true,
          countryCode: true,
          salaryRecords: {
            where: { effectiveTo: null },
            select: { annualSalary: true, currency: true },
          },
        },
      }),
      prisma.payrollDisbursement.groupBy({
        by: ['currency'],
        where: { status: 'SCHEDULED' },
        _sum: {
          grossSalary: true,
          taxDeduction: true,
          leaveDeduction: true,
          otherDeductions: true,
          totalDeductions: true,
          netSalary: true,
        },
      }),
    ]);

    const scheduledMap: Record<
      string,
      {
        gross: number;
        net: number;
        tax: number;
        leave: number;
        other: number;
        totalDeductions: number;
      }
    > = {};

    for (const s of scheduledDisbursements) {
      scheduledMap[s.currency] = {
        gross: Math.round(Number(s._sum.grossSalary || 0)),
        net: Math.round(Number(s._sum.netSalary || 0)),
        tax: Math.round(Number(s._sum.taxDeduction || 0)),
        leave: Math.round(Number(s._sum.leaveDeduction || 0)),
        other: Math.round(Number(s._sum.otherDeductions || 0)),
        totalDeductions: Math.round(Number(s._sum.totalDeductions || 0)),
      };
    }

    const countryMap: Record<
      string,
      { code: string; currency: string; count: number; salaries: number[] }
    > = {};

    for (const emp of countryEmployees) {
      if (!countryMap[emp.country]) {
        countryMap[emp.country] = {
          code: emp.countryCode,
          currency: emp.salaryRecords[0]?.currency || 'USD',
          count: 0,
          salaries: [],
        };
      }
      countryMap[emp.country].count++;
      if (emp.salaryRecords[0]) {
        countryMap[emp.country].salaries.push(Number(emp.salaryRecords[0].annualSalary));
      }
    }

    const countries: CountryMetric[] = Object.keys(countryMap)
      .map((countryName) => {
        const item = countryMap[countryName];
        const salaries = item.salaries;
        const sum = salaries.reduce((a, b) => a + b, 0);
        const avg = salaries.length > 0 ? Math.round(sum / salaries.length) : 0;
        const min = salaries.length > 0 ? Math.min(...salaries) : 0;
        const max = salaries.length > 0 ? Math.max(...salaries) : 0;

        const fallbackMonthly = Math.round(sum / 12);
        const DEDUCTION_RATES: Record<string, number> = {
          US: 0.25,
          GB: 0.25,
          DE: 0.30,
          NO: 0.31,
          SE: 0.33,
          CA: 0.27,
          IN: 0.23,
        };
        const deductionRate = DEDUCTION_RATES[item.code] || 0.25;

        // Use actual scheduled pay cycle from database if available (reflecting unpaid leave deductions)
        const scheduled = scheduledMap[item.currency];
        const grossMonthly = scheduled && scheduled.gross > 0 ? scheduled.gross : fallbackMonthly;
        const leaveDeductions = scheduled ? scheduled.leave : 0;
        // Taxes & benefits remitted to govt/insurers (Cash Outflow)
        const taxAndBenefitsOutflow =
          scheduled && (scheduled.tax + scheduled.other > 0)
            ? scheduled.tax + scheduled.other
            : Math.round(fallbackMonthly * deductionRate);
        // Direct pay disbursed to employees' accounts (Cash Outflow)
        const netMonthly =
          scheduled && scheduled.net > 0 ? scheduled.net : Math.max(0, grossMonthly - leaveDeductions - taxAndBenefitsOutflow);
        // Total cash outflow required from company accounts (Net Pay + Tax/Benefits)
        // Note: Unpaid leave (LOP) stays in company account and is never disbursed!
        const payableGross = Math.max(0, grossMonthly - leaveDeductions);

        return {
          country: countryName,
          countryCode: item.code,
          currency: item.currency,
          headcount: item.count,
          avgSalary: avg,
          minSalary: min,
          maxSalary: max,
          monthlyPayroll: payableGross,
          grossMonthlyPayroll: grossMonthly,
          payableGrossMonthlyPayroll: payableGross,
          netMonthlyPayroll: netMonthly,
          deductionsMonthlyPayroll: taxAndBenefitsOutflow,
          leaveDeductionsMonthlyPayroll: leaveDeductions,
        };
      })
      .sort((a, b) => b.headcount - a.headcount);

    // 4. Change Reason Distribution
    const reasonGroups = await prisma.salaryRecord.groupBy({
      by: ['reason'],
      _count: { reason: true },
    });

    const totalRevisionsCount = reasonGroups.reduce((acc, curr) => acc + curr._count.reason, 0);

    const reasons: ReasonMetric[] = reasonGroups
      .map((r) => ({
        reason: r.reason,
        count: r._count.reason,
        percentage: `${((r._count.reason / (totalRevisionsCount || 1)) * 100).toFixed(1)}%`,
      }))
      .sort((a, b) => b.count - a.count);

    const overview: AnalyticsOverview = {
      kpis: {
        totalHeadcount,
        activeHeadcount,
        onLeaveHeadcount,
        inactiveHeadcount,
        totalHistoricalRevisions,
        departmentsCount: departments.length,
        countriesCount: countries.length,
        nextMonthPayrollByCurrency: countries.map((c) => ({
          country: c.country,
          currency: c.currency,
          headcount: c.headcount,
          monthlyPayroll: c.monthlyPayroll,
          grossMonthlyPayroll: c.grossMonthlyPayroll,
          payableGrossMonthlyPayroll: c.payableGrossMonthlyPayroll,
          netMonthlyPayroll: c.netMonthlyPayroll,
          deductionsMonthlyPayroll: c.deductionsMonthlyPayroll,
          leaveDeductionsMonthlyPayroll: c.leaveDeductionsMonthlyPayroll,
        })),
      },
      departments,
      countries,
      reasons,
      calculatedAt: new Date().toISOString(),
    };

    // Cache result
    this.cache = {
      data: overview,
      expiresAt: Date.now() + 2 * 60 * 1000,
    };

    return overview;
  }

  static async getOverview1(): Promise<AnalyticsOverview> {
    // 1. Cache Check (TTL: 2 minutes)
    if (this.cache && this.cache.expiresAt > Date.now()) {
      return this.cache.data;
    }

    // 2. Execute ALL required database queries concurrently in 1 single Promise.all
    const [
      statusCounts,
      totalHistoricalRevisions,
      allEmployees,
      scheduledDisbursements,
      reasonGroups,
    ] = await Promise.all([
      // Optimized: Replaces 4 separate count() queries with 1 single GROUP BY
      prisma.employee.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      prisma.salaryRecord.count(),
      // Optimized: Replaces 2 redundant employee table scans with 1 consolidated fetch
      prisma.employee.findMany({
        select: {
          department: true,
          country: true,
          countryCode: true,
          salaryRecords: {
            where: { effectiveTo: null },
            select: { annualSalary: true, currency: true },
          },
        },
      }),
      // Scheduled disbursements for next-month payroll cashflow
      prisma.payrollDisbursement.groupBy({
        by: ['currency'],
        where: { status: 'SCHEDULED' },
        _sum: {
          grossSalary: true,
          taxDeduction: true,
          leaveDeduction: true,
          otherDeductions: true,
          totalDeductions: true,
          netSalary: true,
        },
      }),
      // Revision reasons distribution
      prisma.salaryRecord.groupBy({
        by: ['reason'],
        _count: { reason: true },
      }),
    ]);

    // 3. Process Status Counts
    const statusMap: Record<string, number> = {};
    let totalHeadcount = 0;
    for (const s of statusCounts) {
      statusMap[s.status] = s._count.id;
      totalHeadcount += s._count.id;
    }
    const activeHeadcount = statusMap['ACTIVE'] || 0;
    const onLeaveHeadcount = statusMap['ON_LEAVE'] || 0;
    const inactiveHeadcount = statusMap['INACTIVE'] || 0;

    // 4. Map Scheduled Disbursements
    const scheduledMap: Record<
      string,
      { gross: number; net: number; tax: number; leave: number; other: number; totalDeductions: number }
    > = {};

    for (const s of scheduledDisbursements) {
      scheduledMap[s.currency] = {
        gross: Math.round(Number(s._sum.grossSalary || 0)),
        net: Math.round(Number(s._sum.netSalary || 0)),
        tax: Math.round(Number(s._sum.taxDeduction || 0)),
        leave: Math.round(Number(s._sum.leaveDeduction || 0)),
        other: Math.round(Number(s._sum.otherDeductions || 0)),
        totalDeductions: Math.round(Number(s._sum.totalDeductions || 0)),
      };
    }

    // 5. In-Memory Aggregation: Single loop populates BOTH Departments and Countries
    const deptMap: Record<string, { count: number; salaries: number[] }> = {};
    const countryMap: Record<
      string,
      { code: string; currency: string; count: number; salaries: number[] }
    > = {};

    for (const emp of allEmployees) {
      const salary = emp.salaryRecords[0] ? Number(emp.salaryRecords[0].annualSalary) : null;
      const currency = emp.salaryRecords[0]?.currency || 'USD';

      // Populate Department Map
      if (!deptMap[emp.department]) {
        deptMap[emp.department] = { count: 0, salaries: [] };
      }
      deptMap[emp.department].count++;
      if (salary !== null) {
        deptMap[emp.department].salaries.push(salary);
      }

      // Populate Country Map
      if (!countryMap[emp.country]) {
        countryMap[emp.country] = {
          code: emp.countryCode,
          currency,
          count: 0,
          salaries: [],
        };
      }
      countryMap[emp.country].count++;
      if (salary !== null) {
        countryMap[emp.country].salaries.push(salary);
      }
    }

    // 6. Build Department Metrics
    const departments: DepartmentMetric[] = Object.keys(deptMap)
      .map((dept) => {
        const item = deptMap[dept];
        const count = item.count;
        const salaries = item.salaries;
        const sum = salaries.reduce((a, b) => a + b, 0);

        return {
          department: dept,
          headcount: count,
          avgSalary: salaries.length > 0 ? Math.round(sum / salaries.length) : 0,
          minSalary: salaries.length > 0 ? Math.min(...salaries) : 0,
          maxSalary: salaries.length > 0 ? Math.max(...salaries) : 0,
        };
      })
      .sort((a, b) => b.headcount - a.headcount);

    // 7. Build Country Metrics
    const DEDUCTION_RATES: Record<string, number> = {
      US: 0.25,
      GB: 0.25,
      DE: 0.30,
      NO: 0.31,
      SE: 0.33,
      CA: 0.27,
      IN: 0.23,
    };

    const countries: CountryMetric[] = Object.keys(countryMap)
      .map((countryName) => {
        const item = countryMap[countryName];
        const salaries = item.salaries;
        const sum = salaries.reduce((a, b) => a + b, 0);
        const avg = salaries.length > 0 ? Math.round(sum / salaries.length) : 0;
        const min = salaries.length > 0 ? Math.min(...salaries) : 0;
        const max = salaries.length > 0 ? Math.max(...salaries) : 0;

        const fallbackMonthly = Math.round(sum / 12);
        const deductionRate = DEDUCTION_RATES[item.code] || 0.25;

        const scheduled = scheduledMap[item.currency];
        const grossMonthly = scheduled && scheduled.gross > 0 ? scheduled.gross : fallbackMonthly;
        const leaveDeductions = scheduled ? scheduled.leave : 0;
        const taxAndBenefitsOutflow =
          scheduled && (scheduled.tax + scheduled.other > 0)
            ? scheduled.tax + scheduled.other
            : Math.round(fallbackMonthly * deductionRate);
        const netMonthly =
          scheduled && scheduled.net > 0
            ? scheduled.net
            : Math.max(0, grossMonthly - leaveDeductions - taxAndBenefitsOutflow);
        const payableGross = Math.max(0, grossMonthly - leaveDeductions);

        return {
          country: countryName,
          countryCode: item.code,
          currency: item.currency,
          headcount: item.count,
          avgSalary: avg,
          minSalary: min,
          maxSalary: max,
          monthlyPayroll: payableGross,
          grossMonthlyPayroll: grossMonthly,
          payableGrossMonthlyPayroll: payableGross,
          netMonthlyPayroll: netMonthly,
          deductionsMonthlyPayroll: taxAndBenefitsOutflow,
          leaveDeductionsMonthlyPayroll: leaveDeductions,
        };
      })
      .sort((a, b) => b.headcount - a.headcount);

    // 8. Build Reason Distribution
    const totalRevisionsCount = reasonGroups.reduce((acc, curr) => acc + curr._count.reason, 0);
    const reasons: ReasonMetric[] = reasonGroups
      .map((r) => ({
        reason: r.reason,
        count: r._count.reason,
        percentage: `${((r._count.reason / (totalRevisionsCount || 1)) * 100).toFixed(1)}%`,
      }))
      .sort((a, b) => b.count - a.count);

    // 9. Assemble Overview Response
    const overview: AnalyticsOverview = {
      kpis: {
        totalHeadcount,
        activeHeadcount,
        onLeaveHeadcount,
        inactiveHeadcount,
        totalHistoricalRevisions,
        departmentsCount: departments.length,
        countriesCount: countries.length,
        nextMonthPayrollByCurrency: countries.map((c) => ({
          country: c.country,
          currency: c.currency,
          headcount: c.headcount,
          monthlyPayroll: c.monthlyPayroll,
          grossMonthlyPayroll: c.grossMonthlyPayroll,
          payableGrossMonthlyPayroll: c.payableGrossMonthlyPayroll,
          netMonthlyPayroll: c.netMonthlyPayroll,
          deductionsMonthlyPayroll: c.deductionsMonthlyPayroll,
          leaveDeductionsMonthlyPayroll: c.leaveDeductionsMonthlyPayroll,
        })),
      },
      departments,
      countries,
      reasons,
      calculatedAt: new Date().toISOString(),
    };

    // 10. Cache Result for 2 minutes
    this.cache = {
      data: overview,
      expiresAt: Date.now() + 2 * 60 * 1000,
    };

    return overview;
  }

}
