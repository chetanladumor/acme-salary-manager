import { Prisma } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { EmployeeQueryInput } from './employee.schema';

export class EmployeeService {
  // In-memory cache for filter facets (TTL: 5 minutes)
  private static facetsCache: {
    data: any;
    expiresAt: number;
  } | null = null;

  static async listEmployees(query: EmployeeQueryInput) {
    const {
      page,
      limit,
      search,
      country,
      department,
      jobTitle,
      status,
      currency,
      minSalary,
      maxSalary,
      sortBy,
      sortOrder,
    } = query;

    const where: Prisma.EmployeeWhereInput = {};

    // 1. Full-text search on employeeCode, names, and email
    if (search && search.length > 0) {
      const terms = search.split(/\s+/).filter(Boolean);
      if (terms.length === 1) {
        const term = terms[0];
        where.OR = [
          { employeeCode: { contains: term, mode: 'insensitive' } },
          { firstName: { contains: term, mode: 'insensitive' } },
          { lastName: { contains: term, mode: 'insensitive' } },
          { email: { contains: term, mode: 'insensitive' } },
        ];
      } else if (terms.length >= 2) {
        // Multi-word search (e.g. "Ingrid Young")
        where.AND = terms.map((t) => ({
          OR: [
            { firstName: { contains: t, mode: 'insensitive' } },
            { lastName: { contains: t, mode: 'insensitive' } },
            { employeeCode: { contains: t, mode: 'insensitive' } },
          ],
        }));
      }
    }

    // 2. Direct filter attributes
    if (country) {
      where.country = { equals: country, mode: 'insensitive' };
    }

    if (department) {
      where.department = { equals: department, mode: 'insensitive' };
    }

    if (jobTitle) {
      where.jobTitle = { contains: jobTitle, mode: 'insensitive' };
    }

    if (status) {
      where.status = status;
    }

    // 3. Compensation filters on active salary record
    const hasSalaryFilter = currency || minSalary !== undefined || maxSalary !== undefined;
    if (hasSalaryFilter) {
      const salaryCondition: Prisma.SalaryRecordWhereInput = {
        effectiveTo: null,
      };

      if (currency) {
        salaryCondition.currency = currency;
      }

      if (minSalary !== undefined || maxSalary !== undefined) {
        salaryCondition.annualSalary = {
          ...(minSalary !== undefined ? { gte: minSalary } : {}),
          ...(maxSalary !== undefined ? { lte: maxSalary } : {}),
        };
      }

      where.salaryRecords = {
        some: salaryCondition,
      };
    }

    // 4. Sorting & Pagination
    const skip = (page - 1) * limit;
    const take = limit;

    const orderBy: Prisma.EmployeeOrderByWithRelationInput[] = [];
    if (sortBy === 'lastName') {
      orderBy.push({ lastName: sortOrder }, { firstName: sortOrder });
    } else {
      orderBy.push({ [sortBy]: sortOrder });
    }

    // Execute count and data fetch in parallel
    const [total, records] = await prisma.$transaction([
      prisma.employee.count({ where }),
      prisma.employee.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          salaryRecords: {
            where: { effectiveTo: null },
            take: 1,
            select: {
              id: true,
              annualSalary: true,
              currency: true,
              effectiveFrom: true,
              reason: true,
            },
          },
        },
      }),
    ]);

    // Format employee list with normalized currentSalary
    const employees = records.map((emp) => {
      const activeSalary = emp.salaryRecords[0] || null;
      return {
        id: emp.id,
        employeeCode: emp.employeeCode,
        firstName: emp.firstName,
        lastName: emp.lastName,
        fullName: `${emp.firstName} ${emp.lastName}`,
        email: emp.email,
        country: emp.country,
        countryCode: emp.countryCode,
        department: emp.department,
        jobTitle: emp.jobTitle,
        status: emp.status,
        hireDate: emp.hireDate,
        currentSalary: activeSalary
          ? {
              id: activeSalary.id,
              annualSalary: Number(activeSalary.annualSalary),
              currency: activeSalary.currency,
              effectiveFrom: activeSalary.effectiveFrom,
              reason: activeSalary.reason,
            }
          : null,
      };
    });

    const totalPages = Math.ceil(total / limit);

    return {
      employees,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  static async getEmployeeById(idOrCode: string) {
    const isCode = idOrCode.toUpperCase().startsWith('ACM-');

    const employee = await prisma.employee.findFirst({
      where: isCode ? { employeeCode: idOrCode.toUpperCase() } : { id: idOrCode },
      include: {
        salaryRecords: {
          orderBy: { effectiveFrom: 'desc' },
        },
      },
    });

    if (!employee) {
      const error: any = new Error(`Employee not found with identifier '${idOrCode}'`);
      error.statusCode = 404;
      error.code = 'EMPLOYEE_NOT_FOUND';
      throw error;
    }

    const activeSalary = employee.salaryRecords.find((s) => s.effectiveTo === null) || null;
    const history = employee.salaryRecords.map((s) => ({
      id: s.id,
      annualSalary: Number(s.annualSalary),
      currency: s.currency,
      effectiveFrom: s.effectiveFrom,
      effectiveTo: s.effectiveTo,
      reason: s.reason,
      createdBy: s.createdBy,
      createdAt: s.createdAt,
    }));

    // Calculate tenure in years and months
    const now = new Date();
    const hireDate = new Date(employee.hireDate);
    const totalMonths = (now.getFullYear() - hireDate.getFullYear()) * 12 + (now.getMonth() - hireDate.getMonth());
    const tenureYears = Math.floor(totalMonths / 12);
    const tenureMonths = totalMonths % 12;

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];

    const monthlyPayouts: Array<{
      month: string;
      year: number;
      amount: number;
      currency: string;
      status: 'PAID' | 'SCHEDULED';
      payoutDate: string;
      reason: string;
    }> = [];

    // Calculate payouts for past months up to 12 months
    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      if (monthDate < new Date(hireDate.getFullYear(), hireDate.getMonth(), 1)) {
        break; // before hire date
      }

      const payoutDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), 28);

      const record =
        employee.salaryRecords.find((rec) => {
          const from = new Date(rec.effectiveFrom);
          const to = rec.effectiveTo ? new Date(rec.effectiveTo) : null;
          return from <= payoutDate && (!to || to >= payoutDate);
        }) || employee.salaryRecords[0];

      if (record) {
        monthlyPayouts.push({
          month: `${monthNames[monthDate.getMonth()]} ${monthDate.getFullYear()}`,
          year: monthDate.getFullYear(),
          amount: Math.round(Number(record.annualSalary) / 12),
          currency: record.currency,
          status: payoutDate <= now ? 'PAID' : 'SCHEDULED',
          payoutDate: payoutDate.toISOString().split('T')[0],
          reason: record.reason,
        });
      }
    }

    return {
      id: employee.id,
      employeeCode: employee.employeeCode,
      firstName: employee.firstName,
      lastName: employee.lastName,
      fullName: `${employee.firstName} ${employee.lastName}`,
      email: employee.email,
      country: employee.country,
      countryCode: employee.countryCode,
      department: employee.department,
      jobTitle: employee.jobTitle,
      status: employee.status,
      hireDate: employee.hireDate,
      tenure: {
        years: tenureYears,
        months: tenureMonths,
        totalMonths,
      },
      currentSalary: activeSalary
        ? {
            id: activeSalary.id,
            annualSalary: Number(activeSalary.annualSalary),
            monthlySalary: Math.round(Number(activeSalary.annualSalary) / 12),
            currency: activeSalary.currency,
            effectiveFrom: activeSalary.effectiveFrom,
            reason: activeSalary.reason,
          }
        : null,
      salaryHistory: history,
      monthlyPayouts,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt,
    };
  }

  static async getFilterFacets() {
    // Check in-memory cache
    if (this.facetsCache && this.facetsCache.expiresAt > Date.now()) {
      return this.facetsCache.data;
    }

    const [countries, departments, jobTitles, currencies] = await Promise.all([
      prisma.employee.findMany({
        distinct: ['country'],
        select: { country: true, countryCode: true },
        orderBy: { country: 'asc' },
      }),
      prisma.employee.findMany({
        distinct: ['department'],
        select: { department: true },
        orderBy: { department: 'asc' },
      }),
      prisma.employee.findMany({
        distinct: ['jobTitle'],
        select: { jobTitle: true },
        orderBy: { jobTitle: 'asc' },
      }),
      prisma.salaryRecord.findMany({
        distinct: ['currency'],
        where: { effectiveTo: null },
        select: { currency: true },
        orderBy: { currency: 'asc' },
      }),
    ]);

    const facets = {
      countries: countries.map((c) => ({ name: c.country, code: c.countryCode })),
      departments: departments.map((d) => d.department),
      jobTitles: jobTitles.map((j) => j.jobTitle),
      currencies: currencies.map((c) => c.currency),
      statuses: ['ACTIVE', 'ON_LEAVE', 'INACTIVE'],
    };

    // Cache for 5 minutes
    this.facetsCache = {
      data: facets,
      expiresAt: Date.now() + 5 * 60 * 1000,
    };

    return facets;
  }
}
