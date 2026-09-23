import { prisma } from '../../db/prisma';
import { SalaryAdjustmentInput } from './salary.schema';

export class SalaryService {
  static async adjustSalary(
    employeeIdOrCode: string,
    input: SalaryAdjustmentInput,
    performedByEmail: string
  ) {
    const isCode = employeeIdOrCode.toUpperCase().startsWith('ACM-');

    const employee = await prisma.employee.findFirst({
      where: isCode
        ? { employeeCode: employeeIdOrCode.toUpperCase() }
        : { id: employeeIdOrCode },
      include: {
        salaryRecords: {
          where: { effectiveTo: null },
          take: 1,
        },
      },
    });

    if (!employee) {
      const error: any = new Error(`Employee not found with identifier '${employeeIdOrCode}'`);
      error.statusCode = 404;
      error.code = 'EMPLOYEE_NOT_FOUND';
      throw error;
    }

    if (employee.status === 'INACTIVE') {
      const error: any = new Error(
        'Cannot adjust compensation for an inactive employee. Please reactivate employee first.'
      );
      error.statusCode = 422;
      error.code = 'EMPLOYEE_INACTIVE';
      throw error;
    }

    const currentActiveSalary = employee.salaryRecords[0] || null;
    const newEffectiveDate = new Date(input.effectiveFrom);

    if (currentActiveSalary) {
      const currentEffectiveDate = new Date(currentActiveSalary.effectiveFrom);
      if (newEffectiveDate <= currentEffectiveDate) {
        const error: any = new Error(
          `New effective date (${newEffectiveDate.toISOString().split('T')[0]}) must be after current active salary date (${currentEffectiveDate.toISOString().split('T')[0]}).`
        );
        error.statusCode = 400;
        error.code = 'INVALID_EFFECTIVE_DATE';
        throw error;
      }
    }

    const previousSalaryAmount = currentActiveSalary ? Number(currentActiveSalary.annualSalary) : null;
    const percentChange = previousSalaryAmount
      ? Number((((input.annualSalary - previousSalaryAmount) / previousSalaryAmount) * 100).toFixed(2))
      : 0;

    // Atomic transaction: Close previous record, create new record, create audit log
    const [updatedPrevious, newRecord, auditLog] = await prisma.$transaction(async (tx) => {
      let closedRecord = null;
      if (currentActiveSalary) {
        closedRecord = await tx.salaryRecord.update({
          where: { id: currentActiveSalary.id },
          data: {
            effectiveTo: newEffectiveDate,
          },
        });
      }

      const createdSalary = await tx.salaryRecord.create({
        data: {
          employeeId: employee.id,
          annualSalary: input.annualSalary,
          currency: input.currency,
          effectiveFrom: newEffectiveDate,
          effectiveTo: null,
          reason: input.reason,
          createdBy: performedByEmail,
        },
      });

      const audit = await tx.auditLog.create({
        data: {
          action: 'SALARY_ADJUSTED',
          entityType: 'Employee',
          entityId: employee.id,
          employeeId: employee.id,
          metadata: {
            performedBy: performedByEmail,
            employeeCode: employee.employeeCode,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            previousSalary: previousSalaryAmount,
            newSalary: input.annualSalary,
            currency: input.currency,
            percentageChange: `${percentChange >= 0 ? '+' : ''}${percentChange}%`,
            reason: input.reason,
            effectiveFrom: newEffectiveDate.toISOString(),
          },
        },
      });

      return [closedRecord, createdSalary, audit];
    });

    return {
      salaryRecord: {
        id: newRecord.id,
        annualSalary: Number(newRecord.annualSalary),
        currency: newRecord.currency,
        effectiveFrom: newRecord.effectiveFrom,
        effectiveTo: newRecord.effectiveTo,
        reason: newRecord.reason,
        createdBy: newRecord.createdBy,
        createdAt: newRecord.createdAt,
      },
      auditLogId: auditLog.id,
      previousSalaryClosed: updatedPrevious !== null,
    };
  }

  static async getSalaryHistory(employeeIdOrCode: string) {
    const isCode = employeeIdOrCode.toUpperCase().startsWith('ACM-');

    const employee = await prisma.employee.findFirst({
      where: isCode
        ? { employeeCode: employeeIdOrCode.toUpperCase() }
        : { id: employeeIdOrCode },
      include: {
        salaryRecords: {
          orderBy: { effectiveFrom: 'desc' },
        },
      },
    });

    if (!employee) {
      const error: any = new Error(`Employee not found with identifier '${employeeIdOrCode}'`);
      error.statusCode = 404;
      error.code = 'EMPLOYEE_NOT_FOUND';
      throw error;
    }

    return employee.salaryRecords.map((record) => ({
      id: record.id,
      annualSalary: Number(record.annualSalary),
      currency: record.currency,
      effectiveFrom: record.effectiveFrom,
      effectiveTo: record.effectiveTo,
      reason: record.reason,
      createdBy: record.createdBy,
      createdAt: record.createdAt,
    }));
  }
}
