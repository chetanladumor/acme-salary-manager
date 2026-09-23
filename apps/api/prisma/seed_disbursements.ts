import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const TAX_RATES: Record<string, number> = {
  US: 0.20,
  GB: 0.20,
  DE: 0.25,
  NO: 0.26,
  SE: 0.28,
  CA: 0.22,
  IN: 0.18,
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

async function main() {
  console.log('🔄 Populating payroll disbursements for all employees...');
  const startTime = Date.now();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  // Fetch all employees with salary records
  const employees = await prisma.employee.findMany({
    select: {
      id: true,
      countryCode: true,
      status: true,
      hireDate: true,
      salaryRecords: {
        orderBy: { effectiveFrom: 'desc' },
      },
    },
  });

  console.log(`📋 Found ${employees.length} employees. Generating 12 months of disbursements...`);

  const disbursementsData: any[] = [];

  for (const emp of employees) {
    if (emp.salaryRecords.length === 0) continue;

    const taxRate = TAX_RATES[emp.countryCode] || 0.20;

    // Generate up to 12 months (0 to 11 months back)
    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(currentYear, currentMonth - i, 1);
      const hireDate = new Date(emp.hireDate);
      if (monthDate < new Date(hireDate.getFullYear(), hireDate.getMonth(), 1)) {
        break; // before hire date
      }

      const m = monthDate.getMonth();
      const y = monthDate.getFullYear();
      const payoutDate = new Date(y, m, 28);
      const isPast = payoutDate <= now;

      // Find salary record active on payoutDate
      const activeRecord =
        emp.salaryRecords.find((rec) => {
          const from = new Date(rec.effectiveFrom);
          const to = rec.effectiveTo ? new Date(rec.effectiveTo) : null;
          return from <= payoutDate && (!to || to >= payoutDate);
        }) || emp.salaryRecords[0];

      const grossSalary = Math.round(Number(activeRecord.annualSalary) / 12);
      const taxDeduction = Math.round(grossSalary * taxRate);

      // Leave deduction: if ON_LEAVE, 50% deduction; otherwise slight chance of unpaid day
      let leaveDeduction = 0;
      if (emp.status === 'ON_LEAVE' && i < 3) {
        leaveDeduction = Math.round(grossSalary * 0.4); // 40% leave reduction
      }

      const otherDeductions = Math.round(grossSalary * 0.05); // 5% health & retirement
      const totalDeductions = taxDeduction + leaveDeduction + otherDeductions;
      const netSalary = Math.max(0, grossSalary - totalDeductions);

      disbursementsData.push({
        id: randomUUID(),
        employeeId: emp.id,
        salaryRecordId: activeRecord.id,
        month: m + 1,
        year: y,
        payPeriod: `${MONTH_NAMES[m]} ${y}`,
        payoutDate,
        currency: activeRecord.currency,
        grossSalary,
        taxDeduction,
        leaveDeduction,
        otherDeductions,
        totalDeductions,
        netSalary,
        status: isPast ? 'PAID' : 'SCHEDULED',
        notes: isPast
          ? `Disbursed on 28th via automated ACH/SEPA batch (${activeRecord.reason})`
          : 'Scheduled for upcoming monthly processing cycle',
        createdAt: isPast ? payoutDate : now,
      });
    }
  }

  console.log(`💾 Inserting ${disbursementsData.length} payroll disbursements in batches...`);
  const BATCH_SIZE = 2500;
  for (let i = 0; i < disbursementsData.length; i += BATCH_SIZE) {
    const chunk = disbursementsData.slice(i, i + BATCH_SIZE);
    await prisma.payrollDisbursement.createMany({ data: chunk });
    process.stdout.write(`   ↳ Inserted ${i + chunk.length} / ${disbursementsData.length}\r`);
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n✅ ${disbursementsData.length} Payroll disbursements successfully populated in ${durationSec}s!`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding disbursements:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
