import React, { useState } from 'react';
import {
  X,
  Coins,
  Calendar,
  Building2,
  Globe,
  TrendingUp,
  Receipt,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useGetEmployeeByIdQuery } from '../../features/api/apiSlice';
import {
  formatCurrency,
  formatDate,
  calculatePercentageChange,
  getReasonLabel,
} from '../../utils/formatters';
import { SalaryAdjustmentModal } from './SalaryAdjustmentModal';

interface EmployeeDetailDrawerProps {
  employeeId: string | null;
  open: boolean;
  onClose: () => void;
}

export const EmployeeDetailDrawer: React.FC<EmployeeDetailDrawerProps> = ({
  employeeId,
  open,
  onClose,
}) => {
  const { data: employee, isLoading, error } = useGetEmployeeByIdQuery(employeeId || '', {
    skip: !employeeId || !open,
  });

  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
  const [expandedPayouts, setExpandedPayouts] = useState<Record<string, boolean>>({});

  if (!open) return null;

  const togglePayoutExpand = (id: string) => {
    setExpandedPayouts((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            backgroundColor: 'var(--primary)',
            color: '#FFFFFF',
            position: 'sticky',
            top: 0,
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent)',
                color: '#FFFFFF',
                fontSize: '1.1rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {employee ? `${employee.firstName[0]}${employee.lastName[0]}` : '—'}
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', color: '#FFFFFF', lineHeight: 1.2 }}>
                {employee ? employee.fullName : 'Employee Dossier'}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                {employee && (
                  <span
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      color: '#FFFFFF',
                      fontFamily: 'monospace',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    {employee.employeeCode}
                  </span>
                )}
                {employee && (
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                    Tenure: {employee.tenure.years}y {employee.tenure.months}m
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            className="btn-icon"
            onClick={onClose}
            style={{ color: 'rgba(255, 255, 255, 0.8)' }}
            title="Close Dossier"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body Content */}
        <div className="drawer-body">
          {isLoading && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              Loading employee dossier...
            </div>
          )}

          {error && (
            <div className="alert alert-error">
              <span>Unable to load employee details. Please try again.</span>
            </div>
          )}

          {employee && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Card 1: Current Active Compensation */}
              <div
                className="card"
                style={{
                  border: '2px solid var(--accent)',
                  boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.1)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Coins size={16} color="var(--accent)" />
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Current Base Compensation
                    </span>
                  </div>
                  <span
                    className="badge"
                    style={{
                      backgroundColor: 'var(--accent-light)',
                      color: 'var(--accent)',
                      fontWeight: 700,
                    }}
                  >
                    {employee.currentSalary ? employee.currentSalary.currency : '—'}
                  </span>
                </div>

                <div style={{ marginTop: '12px', marginBottom: '12px' }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.02em' }}>
                    {employee.currentSalary
                      ? formatCurrency(employee.currentSalary.annualSalary, employee.currentSalary.currency)
                      : 'Not Set'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Per Annum</span>
                    <span style={{ color: 'var(--border)' }}>•</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--accent)' }}>
                      {employee.currentSalary
                        ? `${formatCurrency(
                            employee.currentSalary.monthlySalary ||
                              Math.round(employee.currentSalary.annualSalary / 12),
                            employee.currentSalary.currency
                          )} / month`
                        : '—'}
                    </span>
                  </div>
                </div>

                <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '14px 0' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Effective Since:</span>
                  <span style={{ fontWeight: 600 }}>
                    {employee.currentSalary ? formatDate(employee.currentSalary.effectiveFrom) : '—'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '16px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Adjustment Reason:</span>
                  <span
                    style={{
                      padding: '2px 8px',
                      backgroundColor: '#F1F5F9',
                      borderRadius: '4px',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                    }}
                  >
                    {employee.currentSalary ? getReasonLabel(employee.currentSalary.reason) : '—'}
                  </span>
                </div>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setAdjustmentModalOpen(true)}
                  style={{ width: '100%' }}
                >
                  <TrendingUp size={16} />
                  <span>Adjust Compensation</span>
                </button>
              </div>

              {/* Card 2: Employment Profile & Demographics */}
              <div className="card">
                <h4 style={{ fontSize: '0.95rem', marginBottom: '14px' }}>Employment Details</h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.875rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                      <Building2 size={16} />
                      <span>Department:</span>
                    </div>
                    <span style={{ fontWeight: 600 }}>{employee.department}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                      <span>💼</span>
                      <span>Job Title:</span>
                    </div>
                    <span style={{ fontWeight: 600 }}>{employee.jobTitle}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                      <Globe size={16} />
                      <span>Country:</span>
                    </div>
                    <span style={{ fontWeight: 600 }}>
                      {employee.country} ({employee.countryCode})
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                      <Calendar size={16} />
                      <span>Hire Date:</span>
                    </div>
                    <span style={{ fontWeight: 600 }}>{formatDate(employee.hireDate)}</span>
                  </div>
                </div>
              </div>

              {/* Card 2.5: Annual Paid Leave Quotas & Attendance History */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ fontSize: '0.95rem' }}>Leave Entitlement & Quotas</h4>
                  <span
                    className="badge"
                    style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}
                  >
                    {employee.leaveBalances?.totalRemaining ?? 37} Days Available
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  Annual paid leave quotas. Leaves exceeding available balance automatically incur Loss of Pay (unpaid) salary cuts.
                </div>

                {/* Quota Progress */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {/* Sick Leave */}
                  <div
                    style={{
                      padding: '12px',
                      backgroundColor: '#F8FAFC',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.8rem', fontWeight: 700 }}>
                      <span>🤒 Sick Leave</span>
                      <span style={{ color: 'var(--accent)' }}>
                        {employee.leaveBalances?.sick.balance ?? 10} / {employee.leaveBalances?.sick.quota ?? 10} Days Left
                      </span>
                    </div>
                    <div style={{ height: '6px', backgroundColor: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          backgroundColor: 'var(--accent)',
                          width: `${((employee.leaveBalances?.sick.balance ?? 10) / (employee.leaveBalances?.sick.quota ?? 10)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Casual Leave */}
                  <div
                    style={{
                      padding: '12px',
                      backgroundColor: '#F8FAFC',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.8rem', fontWeight: 700 }}>
                      <span>🏖️ Casual / Personal Leave</span>
                      <span style={{ color: 'var(--success)' }}>
                        {employee.leaveBalances?.casual.balance ?? 12} / {employee.leaveBalances?.casual.quota ?? 12} Days Left
                      </span>
                    </div>
                    <div style={{ height: '6px', backgroundColor: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          backgroundColor: 'var(--success)',
                          width: `${((employee.leaveBalances?.casual.balance ?? 12) / (employee.leaveBalances?.casual.quota ?? 12)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Annual Leave */}
                  <div
                    style={{
                      padding: '12px',
                      backgroundColor: '#F8FAFC',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.8rem', fontWeight: 700 }}>
                      <span>✈️ Annual Vacation</span>
                      <span style={{ color: '#7C3AED' }}>
                        {employee.leaveBalances?.annual.balance ?? 15} / {employee.leaveBalances?.annual.quota ?? 15} Days Left
                      </span>
                    </div>
                    <div style={{ height: '6px', backgroundColor: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          backgroundColor: '#7C3AED',
                          width: `${((employee.leaveBalances?.annual.balance ?? 15) / (employee.leaveBalances?.annual.quota ?? 15)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Salary Progression Timeline */}
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <TrendingUp size={16} color="var(--accent)" />
                  <h4 style={{ fontSize: '0.95rem' }}>
                    Compensation Timeline ({employee.salaryHistory.length} Record
                    {employee.salaryHistory.length === 1 ? '' : 's'})
                  </h4>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {employee.salaryHistory.map((item, index) => {
                    const nextItem = employee.salaryHistory[index + 1];
                    const percentChange = nextItem
                      ? calculatePercentageChange(nextItem.annualSalary, item.annualSalary)
                      : null;
                    const isActive = item.effectiveTo === null;

                    return (
                      <div
                        key={item.id}
                        style={{
                          padding: '14px',
                          backgroundColor: isActive ? '#F8FAFC' : '#FFFFFF',
                          border: isActive ? '1px solid var(--accent)' : '1px solid var(--border)',
                          borderRadius: 'var(--radius-md)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary)' }}>
                              {formatCurrency(item.annualSalary, item.currency)}
                            </span>
                            {percentChange && (
                              <span
                                style={{
                                  padding: '2px 6px',
                                  borderRadius: '9999px',
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  backgroundColor: 'var(--success-bg)',
                                  color: 'var(--success-text)',
                                }}
                              >
                                {percentChange}
                              </span>
                            )}
                          </div>
                          <span
                            className="badge"
                            style={{
                              backgroundColor: isActive ? 'var(--primary)' : '#F1F5F9',
                              color: isActive ? '#FFFFFF' : 'var(--text-muted)',
                            }}
                          >
                            {isActive ? 'Active' : 'Prior'}
                          </span>
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginTop: '8px',
                            fontSize: '0.75rem',
                          }}
                        >
                          <span style={{ color: 'var(--text-muted)' }}>
                            {formatDate(item.effectiveFrom)} – {formatDate(item.effectiveTo)}
                          </span>
                          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                            {getReasonLabel(item.reason)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Card 4: Monthly Salary Disbursement Ledger */}
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <Receipt size={16} color="var(--primary)" />
                  <h4 style={{ fontSize: '0.95rem' }}>Monthly Pay Ledger</h4>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  Historical record of monthly salary payouts disbursed to this employee.
                </div>

                {employee.monthlyPayouts && employee.monthlyPayouts.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {employee.monthlyPayouts.map((payout) => {
                      const isExpanded = !!expandedPayouts[payout.id];
                      const gross = payout.grossSalary || payout.amount;
                      const tax = payout.taxDeduction || 0;
                      const leave = payout.leaveDeduction || 0;
                      const other = payout.otherDeductions || 0;
                      const net = payout.netSalary !== undefined ? payout.netSalary : payout.amount;
                      const taxRatePct =
                        gross > 0 ? ((tax / gross) * 100).toFixed(1).replace('.0', '') : '20';
                      const otherRatePct =
                        gross > 0 ? ((other / gross) * 100).toFixed(1).replace('.0', '') : '5';

                      return (
                        <div
                          key={payout.id}
                          style={{
                            padding: '14px',
                            backgroundColor: '#FFFFFF',
                            border: isExpanded ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                            borderRadius: 'var(--radius-md)',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: '0.875rem' }}>{payout.month}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                Pay Date: {formatDate(payout.payoutDate)}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                Basis: {getReasonLabel(payout.reason as any)}
                              </div>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                                <div>
                                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                    Gross: {formatCurrency(gross, payout.currency)}
                                  </div>
                                  <div style={{ fontWeight: 800, fontSize: '0.875rem', color: '#16A34A' }}>
                                    Net: {formatCurrency(net, payout.currency)}
                                  </div>
                                </div>
                                <span
                                  className="badge"
                                  style={{
                                    backgroundColor: payout.status === 'PAID' ? '#DCFCE7' : '#EFF6FF',
                                    color: payout.status === 'PAID' ? '#15803D' : '#2563EB',
                                    gap: '4px',
                                  }}
                                >
                                  <CheckCircle2 size={12} />
                                  <span>{payout.status}</span>
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => togglePayoutExpand(payout.id)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: 'var(--accent)',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  marginTop: '6px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '2px',
                                }}
                              >
                                <span>{isExpanded ? 'Hide Payslip' : 'View Payslip'}</span>
                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </button>
                            </div>
                          </div>

                          {/* Itemized Voucher */}
                          {isExpanded && (
                            <div
                              style={{
                                marginTop: '14px',
                                padding: '14px',
                                backgroundColor: '#F8FAFC',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border)',
                                fontSize: '0.8rem',
                              }}
                            >
                              <div
                                style={{
                                  fontWeight: 700,
                                  color: 'var(--text-muted)',
                                  textTransform: 'uppercase',
                                  fontSize: '0.7rem',
                                  letterSpacing: '0.05em',
                                  marginBottom: '10px',
                                }}
                              >
                                Itemized Payslip & Deduction Voucher
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span style={{ fontWeight: 600 }}>🟢 Gross Salary:</span>
                                  <span style={{ fontWeight: 700 }}>{formatCurrency(gross, payout.currency)}</span>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--danger)' }}>
                                  <span>🔴 Income Tax Withholding:</span>
                                  <span style={{ fontWeight: 600 }}>
                                    - {formatCurrency(tax, payout.currency)} ({taxRatePct}%)
                                  </span>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}>
                                  <span>🟢 Paid Leaves (Covered by PTO):</span>
                                  <span style={{ fontWeight: 600 }}>
                                    {payout.paidLeaveDays || 0} Day{(payout.paidLeaveDays || 0) === 1 ? '' : 's'} Covered
                                  </span>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--danger)' }}>
                                  <span>🔴 Unpaid Leave (Loss of Pay):</span>
                                  <span style={{ fontWeight: 600 }}>
                                    {leave > 0
                                      ? `- ${formatCurrency(leave, payout.currency)} (${payout.unpaidLeaveDays || 2} days)`
                                      : `- ${formatCurrency(0, payout.currency)} (0 days)`}
                                  </span>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--danger)' }}>
                                  <span>🔴 Benefits & Retirement:</span>
                                  <span style={{ fontWeight: 600 }}>
                                    - {formatCurrency(other, payout.currency)} ({otherRatePct}%)
                                  </span>
                                </div>

                                <div style={{ height: '1px', backgroundColor: '#CBD5E1', margin: '6px 0' }} />

                                <div
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    fontSize: '0.95rem',
                                    fontWeight: 800,
                                    color: 'var(--accent)',
                                  }}
                                >
                                  <span>🔵 Net Disbursed Take-Home:</span>
                                  <span>{formatCurrency(net, payout.currency)}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    No historical monthly disbursements on record.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Salary Adjustment Dialog */}
      <SalaryAdjustmentModal
        open={adjustmentModalOpen}
        onClose={() => setAdjustmentModalOpen(false)}
        employee={employee || null}
      />
    </div>
  );
};
