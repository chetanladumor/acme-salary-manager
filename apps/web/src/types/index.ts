export type EmploymentStatus = 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE';

export type ChangeReason =
  | 'NEW_HIRE'
  | 'ANNUAL_REVIEW'
  | 'PROMOTION'
  | 'MARKET_ADJUSTMENT'
  | 'EQUITY_REALIGNMENT'
  | 'LATERAL_MOVE';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface CurrentSalary {
  id: string;
  annualSalary: number;
  monthlySalary?: number;
  currency: string;
  effectiveFrom: string;
  reason: ChangeReason;
}

export interface EmployeeListItem {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  country: string;
  countryCode: string;
  department: string;
  jobTitle: string;
  status: EmploymentStatus;
  hireDate: string;
  currentSalary: CurrentSalary | null;
}

export interface SalaryHistoryItem {
  id: string;
  annualSalary: number;
  currency: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  reason: ChangeReason;
  createdBy: string | null;
  createdAt: string;
}

export type LeaveType = 'SICK' | 'CASUAL' | 'ANNUAL' | 'UNPAID';

export interface LeaveCategoryBalance {
  quota: number;
  balance: number;
  used: number;
}

export interface LeaveBalances {
  sick: LeaveCategoryBalance;
  casual: LeaveCategoryBalance;
  annual: LeaveCategoryBalance;
  totalRemaining: number;
}

export interface LeaveHistoryItem {
  id: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  daysCount: number;
  isPaid: boolean;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  reason?: string;
  month: number;
  year: number;
}

export interface MonthlyPayoutItem {
  id: string;
  month: string;
  year: number;
  amount: number;
  grossSalary?: number;
  taxDeduction?: number;
  leaveDeduction?: number;
  otherDeductions?: number;
  totalDeductions?: number;
  netSalary?: number;
  paidLeaveDays?: number;
  unpaidLeaveDays?: number;
  currency: string;
  status: 'PAID' | 'SCHEDULED';
  payoutDate: string;
  reason: string;
  notes?: string;
}

export interface EmployeeDetail extends EmployeeListItem {
  tenure: {
    years: number;
    months: number;
    totalMonths: number;
  };
  salaryHistory: SalaryHistoryItem[];
  monthlyPayouts?: MonthlyPayoutItem[];
  leaveBalances?: LeaveBalances;
  leaveHistory?: LeaveHistoryItem[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface FilterFacets {
  countries: Array<{ name: string; code: string }>;
  departments: string[];
  jobTitles: string[];
  currencies: string[];
  statuses: EmploymentStatus[];
}

export interface EmployeeFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  country?: string;
  department?: string;
  jobTitle?: string;
  status?: EmploymentStatus;
  currency?: string;
  minSalary?: number;
  maxSalary?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

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
  grossMonthlyPayroll?: number;
  payableGrossMonthlyPayroll?: number;
  netMonthlyPayroll?: number;
  deductionsMonthlyPayroll?: number;
  leaveDeductionsMonthlyPayroll?: number;
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
      grossMonthlyPayroll?: number;
      payableGrossMonthlyPayroll?: number;
      netMonthlyPayroll?: number;
      deductionsMonthlyPayroll?: number;
      leaveDeductionsMonthlyPayroll?: number;
    }>;
  };
  departments: DepartmentMetric[];
  countries: CountryMetric[];
  reasons: ReasonMetric[];
  calculatedAt: string;
}
