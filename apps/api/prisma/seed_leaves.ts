import { PrismaClient, LeaveType, LeaveStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Populating employee leaves and syncing leave quotas...');
  const startTime = Date.now();

  // 1. Fetch employees
  const employees = await prisma.employee.findMany({
    select: {
      id: true,
      employeeCode: true,
      status: true,
      countryCode: true,
      salaryRecords: {
        orderBy: { effectiveFrom: 'desc' },
        take: 1,
      },
    },
  });

  console.log(`📋 Found ${employees.length} employees to update.`);

  const leavesData: any[] = [];
  const employeeUpdates: Array<{ id: string; sick: number; casual: number; annual: number }> = [];

  for (const emp of employees) {
    let sickBalance = 10;
    let casualBalance = 12;
    let annualBalance = 15;

    if (emp.employeeCode === 'ACM-00001') {
      // Demo case: 3 paid casual leaves + 2 unpaid leaves in August 2026
      leavesData.push({
        id: randomUUID(),
        employeeId: emp.id,
        leaveType: LeaveType.CASUAL,
        startDate: new Date('2026-08-10'),
        endDate: new Date('2026-08-12'),
        daysCount: 3,
        isPaid: true,
        status: LeaveStatus.APPROVED,
        reason: 'Family event and personal matters (Paid PTO)',
        month: 8,
        year: 2026,
      });
      casualBalance -= 3;

      leavesData.push({
        id: randomUUID(),
        employeeId: emp.id,
        leaveType: LeaveType.UNPAID,
        startDate: new Date('2026-08-20'),
        endDate: new Date('2026-08-21'),
        daysCount: 2,
        isPaid: false,
        status: LeaveStatus.APPROVED,
        reason: 'Unplanned personal leave without quota (Loss of Pay)',
        month: 8,
        year: 2026,
      });

      // 1 paid sick leave in September 2026
      leavesData.push({
        id: randomUUID(),
        employeeId: emp.id,
        leaveType: LeaveType.SICK,
        startDate: new Date('2026-09-08'),
        endDate: new Date('2026-09-08'),
        daysCount: 1,
        isPaid: true,
        status: LeaveStatus.APPROVED,
        reason: 'Seasonal viral flu (Medical certificate submitted)',
        month: 9,
        year: 2026,
      });
      sickBalance -= 1;
    } else {
      // Light deterministic leave records for other employees
      const hash = emp.employeeCode.charCodeAt(emp.employeeCode.length - 1);

      if (hash % 3 === 0) {
        // 1-2 days sick leave
        leavesData.push({
          id: randomUUID(),
          employeeId: emp.id,
          leaveType: LeaveType.SICK,
          startDate: new Date('2026-08-14'),
          endDate: new Date('2026-08-15'),
          daysCount: 2,
          isPaid: true,
          status: LeaveStatus.APPROVED,
          reason: 'Medical recovery',
          month: 8,
          year: 2026,
        });
        sickBalance -= 2;
      }

      if (hash % 5 === 0) {
        // 1 day casual leave
        leavesData.push({
          id: randomUUID(),
          employeeId: emp.id,
          leaveType: LeaveType.CASUAL,
          startDate: new Date('2026-07-22'),
          endDate: new Date('2026-07-22'),
          daysCount: 1,
          isPaid: true,
          status: LeaveStatus.APPROVED,
          reason: 'Personal errands',
          month: 7,
          year: 2026,
        });
        casualBalance -= 1;
      }

      if (emp.status === 'ON_LEAVE') {
        // Unpaid leave record
        leavesData.push({
          id: randomUUID(),
          employeeId: emp.id,
          leaveType: LeaveType.UNPAID,
          startDate: new Date('2026-08-01'),
          endDate: new Date('2026-08-15'),
          daysCount: 10,
          isPaid: false,
          status: LeaveStatus.APPROVED,
          reason: 'Extended leave of absence (Loss of Pay)',
          month: 8,
          year: 2026,
        });
      }
    }

    employeeUpdates.push({
      id: emp.id,
      sick: sickBalance,
      casual: casualBalance,
      annual: annualBalance,
    });
  }

  console.log(`💾 Inserting ${leavesData.length} leave records in batches...`);
  const BATCH_SIZE = 2000;
  for (let i = 0; i < leavesData.length; i += BATCH_SIZE) {
    const chunk = leavesData.slice(i, i + BATCH_SIZE);
    await prisma.employeeLeave.createMany({ data: chunk });
    process.stdout.write(`   ↳ Inserted leaves ${i + chunk.length} / ${leavesData.length}\r`);
  }
  console.log(`\n✅ ${leavesData.length} Employee leave records inserted.`);

  // Update employee balances
  console.log('🔄 Updating employee leave balances...');
  for (const up of employeeUpdates.slice(0, 100)) {
    await prisma.employee.update({
      where: { id: up.id },
      data: {
        sickLeaveBalance: up.sick,
        casualLeaveBalance: up.casual,
        annualLeaveBalance: up.annual,
      },
    });
  }

  // Update ACM-00001 August disbursement specifically with paid and unpaid days
  const acmEmp = employees.find((e) => e.employeeCode === 'ACM-00001');
  if (acmEmp) {
    const augDisbursement = await prisma.payrollDisbursement.findFirst({
      where: { employeeId: acmEmp.id, month: 8, year: 2026 },
    });

    if (augDisbursement) {
      const gross = Number(augDisbursement.grossSalary);
      const unpaidDays = 2;
      const dailyRate = Math.round(gross / 22);
      const leaveDeduction = unpaidDays * dailyRate;
      const taxRate = 0.18;
      const taxableGross = Math.max(0, gross - leaveDeduction);
      const taxDeduction = Math.round(taxableGross * taxRate);
      const otherDeductions = Math.round(gross * 0.05);
      const totalDeductions = taxDeduction + leaveDeduction + otherDeductions;
      const netSalary = Math.max(0, gross - totalDeductions);

      await prisma.payrollDisbursement.update({
        where: { id: augDisbursement.id },
        data: {
          paidLeaveDays: 3,
          unpaidLeaveDays: 2,
          leaveDeduction,
          taxDeduction,
          totalDeductions,
          netSalary,
          notes: 'Disbursed via automated batch (3 Paid Leaves, 2 Unpaid Leaves @ ₹5,966/day)',
        },
      });
      console.log(`✅ Updated ACM-00001 August payroll disbursement with 3 paid & 2 unpaid leave days.`);
    }
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`🎉 Leave system setup complete in ${durationSec}s!`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding leaves:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
