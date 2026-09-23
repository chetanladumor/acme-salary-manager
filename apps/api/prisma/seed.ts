import { PrismaClient, EmploymentStatus, ChangeReason, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// Mulberry32 deterministic PRNG
function createPRNG(seed: number) {
  let s = seed;
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = createPRNG(42);

function randInt(min: number, max: number): number {
  return Math.floor(random() * (max - min + 1)) + min;
}

function randChoice<T>(items: readonly T[]): T {
  return items[Math.floor(random() * items.length)];
}

// 7 Supported Jurisdictions & Currencies
interface CountryConfig {
  name: string;
  code: string;
  currency: string;
  salaryBands: Record<string, [number, number]>;
}

const COUNTRIES: readonly CountryConfig[] = [
  {
    name: 'United States',
    code: 'US',
    currency: 'USD',
    salaryBands: {
      Junior: [75000, 95000],
      Mid: [105000, 138000],
      Senior: [145000, 185000],
      Staff: [190000, 230000],
      Manager: [195000, 245000],
      Director: [240000, 310000],
    },
  },
  {
    name: 'United Kingdom',
    code: 'GB',
    currency: 'GBP',
    salaryBands: {
      Junior: [42000, 55000],
      Mid: [62000, 85000],
      Senior: [90000, 122000],
      Staff: [125000, 150000],
      Manager: [130000, 165000],
      Director: [160000, 210000],
    },
  },
  {
    name: 'Germany',
    code: 'DE',
    currency: 'EUR',
    salaryBands: {
      Junior: [48000, 62000],
      Mid: [66000, 88000],
      Senior: [92000, 125000],
      Staff: [128000, 155000],
      Manager: [135000, 170000],
      Director: [165000, 215000],
    },
  },
  {
    name: 'Norway',
    code: 'NO',
    currency: 'NOK',
    salaryBands: {
      Junior: [580000, 720000],
      Mid: [750000, 920000],
      Senior: [950000, 1220000],
      Staff: [1240000, 1460000],
      Manager: [1280000, 1550000],
      Director: [1500000, 1920000],
    },
  },
  {
    name: 'Sweden',
    code: 'SE',
    currency: 'SEK',
    salaryBands: {
      Junior: [520000, 650000],
      Mid: [680000, 850000],
      Senior: [880000, 1120000],
      Staff: [1150000, 1360000],
      Manager: [1200000, 1460000],
      Director: [1420000, 1780000],
    },
  },
  {
    name: 'India',
    code: 'IN',
    currency: 'INR',
    salaryBands: {
      Junior: [1200000, 1800000],
      Mid: [2000000, 3200000],
      Senior: [3500000, 5000000],
      Staff: [5200000, 7000000],
      Manager: [5500000, 7600000],
      Director: [7500000, 10800000],
    },
  },
  {
    name: 'Canada',
    code: 'CA',
    currency: 'CAD',
    salaryBands: {
      Junior: [70000, 92000],
      Mid: [95000, 128000],
      Senior: [130000, 168000],
      Staff: [170000, 208000],
      Manager: [180000, 225000],
      Director: [210000, 280000],
    },
  },
];

// Department and Role Hierarchies
const DEPARTMENTS = [
  {
    name: 'Engineering',
    weight: 0.35,
    roles: [
      { level: 'Junior', title: 'Junior Software Engineer' },
      { level: 'Mid', title: 'Software Engineer' },
      { level: 'Senior', title: 'Senior Software Engineer' },
      { level: 'Staff', title: 'Staff Software Engineer' },
      { level: 'Manager', title: 'Engineering Manager' },
      { level: 'Director', title: 'Director of Engineering' },
    ],
  },
  {
    name: 'Product',
    weight: 0.1,
    roles: [
      { level: 'Junior', title: 'Associate Product Manager' },
      { level: 'Mid', title: 'Product Manager' },
      { level: 'Senior', title: 'Senior Product Manager' },
      { level: 'Staff', title: 'Principal Product Manager' },
      { level: 'Manager', title: 'Group Product Manager' },
      { level: 'Director', title: 'Director of Product' },
    ],
  },
  {
    name: 'Sales',
    weight: 0.18,
    roles: [
      { level: 'Junior', title: 'Sales Development Rep' },
      { level: 'Mid', title: 'Account Executive' },
      { level: 'Senior', title: 'Senior Account Executive' },
      { level: 'Staff', title: 'Enterprise Account Executive' },
      { level: 'Manager', title: 'Sales Manager' },
      { level: 'Director', title: 'Director of Sales' },
    ],
  },
  {
    name: 'Marketing',
    weight: 0.1,
    roles: [
      { level: 'Junior', title: 'Marketing Coordinator' },
      { level: 'Mid', title: 'Marketing Manager' },
      { level: 'Senior', title: 'Senior Marketing Specialist' },
      { level: 'Staff', title: 'Lead Growth Strategist' },
      { level: 'Manager', title: 'Brand Marketing Manager' },
      { level: 'Director', title: 'Director of Marketing' },
    ],
  },
  {
    name: 'Operations',
    weight: 0.12,
    roles: [
      { level: 'Junior', title: 'Operations Associate' },
      { level: 'Mid', title: 'Operations Specialist' },
      { level: 'Senior', title: 'Senior Operations Analyst' },
      { level: 'Staff', title: 'Principal Operations Lead' },
      { level: 'Manager', title: 'Operations Manager' },
      { level: 'Director', title: 'Director of Operations' },
    ],
  },
  {
    name: 'Finance',
    weight: 0.08,
    roles: [
      { level: 'Junior', title: 'Junior Accountant' },
      { level: 'Mid', title: 'Financial Analyst' },
      { level: 'Senior', title: 'Senior Financial Analyst' },
      { level: 'Staff', title: 'Staff Controller' },
      { level: 'Manager', title: 'Finance Manager' },
      { level: 'Director', title: 'Director of Finance' },
    ],
  },
  {
    name: 'Human Resources',
    weight: 0.05,
    roles: [
      { level: 'Junior', title: 'HR Coordinator' },
      { level: 'Mid', title: 'HR Generalist' },
      { level: 'Senior', title: 'Senior People Partner' },
      { level: 'Staff', title: 'Principal People Operations' },
      { level: 'Manager', title: 'HR Manager' },
      { level: 'Director', title: 'Director of People' },
    ],
  },
  {
    name: 'Legal',
    weight: 0.02,
    roles: [
      { level: 'Junior', title: 'Legal Assistant' },
      { level: 'Mid', title: 'Compliance Specialist' },
      { level: 'Senior', title: 'Senior Corporate Counsel' },
      { level: 'Staff', title: 'Principal Legal Counsel' },
      { level: 'Manager', title: 'Head of Regulatory Affairs' },
      { level: 'Director', title: 'General Counsel' },
    ],
  },
];

const FIRST_NAMES = [
  'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason', 'Isabella', 'William',
  'Mia', 'James', 'Charlotte', 'Benjamin', 'Amelia', 'Lucas', 'Harper', 'Henry', 'Evelyn', 'Alexander',
  'Abigail', 'Michael', 'Emily', 'Daniel', 'Elizabeth', 'Matthew', 'Mila', 'Aiden', 'Ella', 'David',
  'Avery', 'Joseph', 'Sofia', 'Samuel', 'Camila', 'Sebastian', 'Aria', 'Jack', 'Scarlett', 'Owen',
  'Victoria', 'John', 'Madison', 'Luke', 'Luna', 'Gabriel', 'Grace', 'Anthony', 'Chloe', 'Isaac',
  'Freja', 'Lars', 'Astrid', 'Magnus', 'Ingrid', 'Henrik', 'Sigrid', 'Sven', 'Elin', 'Oskar',
  'Aarav', 'Ananya', 'Vivaan', 'Diya', 'Aditya', 'Isha', 'Vihaan', 'Kavya', 'Arjun', 'Rhea',
  'Lucas', 'Leon', 'Lukas', 'Finn', 'Jonas', 'Maximilian', 'Paul', 'Felix', 'Elias', 'Emil',
  'Hanna', 'Lea', 'Mia', 'Anna', 'Lena', 'Marie', 'Laura', 'Sophie', 'Emily', 'Amelie',
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Hansen', 'Johansen', 'Olsen', 'Larsen', 'Andersen', 'Pedersen', 'Nilsen', 'Kristiansen', 'Jensen', 'Karlsen',
  'Sharma', 'Patel', 'Verma', 'Gupta', 'Singh', 'Kumar', 'Reddy', 'Mehta', 'Nair', 'Iyer',
  'Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann',
];

async function main() {
  console.log('🌱 Starting deterministic 10,000 employee database seeding...');
  const startTime = Date.now();

  // 1. Clean existing records in referential order
  console.log('🧹 Clearing existing database tables...');
  await prisma.auditLog.deleteMany();
  await prisma.salaryRecord.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Demo HR Manager User
  console.log('👤 Creating demo HR Manager account...');
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin#Pass2026!';
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(adminPassword, salt);

  const hrAdmin = await prisma.user.create({
    data: {
      email: 'hr@acme.com',
      passwordHash,
      name: 'Sarah Jenkins (HR Director)',
      role: Role.HR_ADMIN,
    },
  });
  console.log(`✅ Demo HR Manager created: ${hrAdmin.email} [credentials managed via SEED_ADMIN_PASSWORD]`);

  // 3. Prepare 10,000 Employees and their Salary History
  console.log('📊 Generating 10,000 employee profiles and compensation histories...');
  const TOTAL_EMPLOYEES = 10000;
  const employeesData: any[] = [];
  const salaryRecordsData: any[] = [];

  const now = new Date('2026-09-01T00:00:00.000Z');

  for (let i = 1; i <= TOTAL_EMPLOYEES; i++) {
    const employeeId = randomUUID();
    const codeNumber = i.toString().padStart(5, '0');
    const employeeCode = `ACM-${codeNumber}`;

    const firstName = randChoice(FIRST_NAMES);
    const lastName = randChoice(LAST_NAMES);
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${i}@acme.corp`;

    // Weighted Country Selection
    const country = randChoice(COUNTRIES);

    // Weighted Department Selection
    const deptRoll = random();
    let cumulative = 0;
    let selectedDept = DEPARTMENTS[0];
    for (const d of DEPARTMENTS) {
      cumulative += d.weight;
      if (deptRoll <= cumulative) {
        selectedDept = d;
        break;
      }
    }

    // Role selection with realistic seniority pyramid:
    // Junior: 25%, Mid: 35%, Senior: 25%, Staff: 8%, Manager: 5%, Director: 2%
    const levelRoll = random();
    let roleIndex = 1; // default Mid
    if (levelRoll < 0.25) roleIndex = 0; // Junior
    else if (levelRoll < 0.60) roleIndex = 1; // Mid
    else if (levelRoll < 0.85) roleIndex = 2; // Senior
    else if (levelRoll < 0.93) roleIndex = 3; // Staff
    else if (levelRoll < 0.98) roleIndex = 4; // Manager
    else roleIndex = 5; // Director

    const selectedRole = selectedDept.roles[roleIndex];

    // Status: 94% Active, 3% On Leave, 3% Inactive
    const statusRoll = random();
    let status: EmploymentStatus = EmploymentStatus.ACTIVE;
    if (statusRoll > 0.97) status = EmploymentStatus.INACTIVE;
    else if (statusRoll > 0.94) status = EmploymentStatus.ON_LEAVE;

    // Tenure: Hire date between 6 months and 7 years ago
    const daysEmployed = randInt(180, 2550);
    const hireDate = new Date(now.getTime() - daysEmployed * 24 * 60 * 60 * 1000);

    employeesData.push({
      id: employeeId,
      employeeCode,
      firstName,
      lastName,
      email,
      country: country.name,
      countryCode: country.code,
      department: selectedDept.name,
      jobTitle: selectedRole.title,
      status,
      hireDate,
      createdAt: hireDate,
      updatedAt: now,
    });

    // Generate Compensation & Salary History
    const [minSalary, maxSalary] = country.salaryBands[selectedRole.level];
    const initialBaseSalary = Math.round((minSalary + random() * (maxSalary - minSalary)) / 500) * 500;

    // Does this employee have salary progression?
    // If tenure > 400 days and status != INACTIVE, give 1 to 3 historical raises
    const eligibleForHistory = daysEmployed > 400 && random() < 0.45;
    const historySteps = eligibleForHistory ? (daysEmployed > 1200 ? randInt(2, 3) : 1) : 0;

    if (historySteps === 0) {
      // Single active salary record
      salaryRecordsData.push({
        id: randomUUID(),
        employeeId,
        annualSalary: initialBaseSalary,
        currency: country.currency,
        effectiveFrom: hireDate,
        effectiveTo: null,
        reason: ChangeReason.NEW_HIRE,
        createdBy: hrAdmin.email,
        createdAt: hireDate,
        updatedAt: hireDate,
      });
    } else {
      // Historical progression
      let currentEffectiveFrom = hireDate;
      let currentSalary = Math.round(initialBaseSalary * 0.82 / 500) * 500; // start 18% lower
      const stepDurationDays = Math.floor(daysEmployed / (historySteps + 1));

      for (let step = 0; step < historySteps; step++) {
        const stepEndDate = new Date(currentEffectiveFrom.getTime() + stepDurationDays * 24 * 60 * 60 * 1000);
        const reason = step === 0 ? ChangeReason.NEW_HIRE : randChoice([ChangeReason.ANNUAL_REVIEW, ChangeReason.PROMOTION]);

        salaryRecordsData.push({
          id: randomUUID(),
          employeeId,
          annualSalary: currentSalary,
          currency: country.currency,
          effectiveFrom: currentEffectiveFrom,
          effectiveTo: stepEndDate,
          reason,
          createdBy: hrAdmin.email,
          createdAt: currentEffectiveFrom,
          updatedAt: currentEffectiveFrom,
        });

        // 8% to 15% raise per progression
        currentSalary = Math.round(currentSalary * (1 + (randInt(8, 15) / 100)) / 500) * 500;
        currentEffectiveFrom = stepEndDate;
      }

      // Final active salary record
      salaryRecordsData.push({
        id: randomUUID(),
        employeeId,
        annualSalary: currentSalary,
        currency: country.currency,
        effectiveFrom: currentEffectiveFrom,
        effectiveTo: null,
        reason: randChoice([ChangeReason.ANNUAL_REVIEW, ChangeReason.PROMOTION, ChangeReason.MARKET_ADJUSTMENT]),
        createdBy: hrAdmin.email,
        createdAt: currentEffectiveFrom,
        updatedAt: currentEffectiveFrom,
      });
    }
  }

  // 4. Batch Insertion in chunks of 1,000 for high performance
  const BATCH_SIZE = 1000;
  console.log(`💾 Inserting ${employeesData.length} employees in batches of ${BATCH_SIZE}...`);
  for (let i = 0; i < employeesData.length; i += BATCH_SIZE) {
    const chunk = employeesData.slice(i, i + BATCH_SIZE);
    await prisma.employee.createMany({ data: chunk });
    process.stdout.write(`   ↳ Inserted employees ${i + chunk.length} / ${employeesData.length}\r`);
  }
  console.log(`\n✅ 10,000 Employees successfully inserted.`);

  console.log(`💾 Inserting ${salaryRecordsData.length} salary records in batches of ${BATCH_SIZE}...`);
  for (let i = 0; i < salaryRecordsData.length; i += BATCH_SIZE) {
    const chunk = salaryRecordsData.slice(i, i + BATCH_SIZE);
    await prisma.salaryRecord.createMany({ data: chunk });
    process.stdout.write(`   ↳ Inserted salary records ${i + chunk.length} / ${salaryRecordsData.length}\r`);
  }
  console.log(`\n✅ ${salaryRecordsData.length} Salary records successfully inserted.`);

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`🎉 Seeding complete in ${durationSec} seconds!`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
