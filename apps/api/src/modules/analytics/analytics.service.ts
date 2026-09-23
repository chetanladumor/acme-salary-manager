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
  monthlyPayroll: number;
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

    // 3. Country & Currency Breakdown
    const countryEmployees = await prisma.employee.findMany({
      select: {
        country: true,
        countryCode: true,
        salaryRecords: {
          where: { effectiveTo: null },
          select: { annualSalary: true, currency: true },
        },
      },
    });

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

        const monthlySum = Math.round(sum / 12);

        return {
          country: countryName,
          countryCode: item.code,
          currency: item.currency,
          headcount: item.count,
          avgSalary: avg,
          minSalary: min,
          maxSalary: max,
          monthlyPayroll: monthlySum,
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
}
