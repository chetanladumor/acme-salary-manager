import React from 'react';
import {
  Users,
  CheckCircle2,
  TrendingUp,
  Globe,
  Building2,
  PieChart,
  Wallet,
} from 'lucide-react';
import { useGetAnalyticsQuery } from '../../features/api/apiSlice';
import { formatCurrency, getReasonLabel } from '../../utils/formatters';

export const AnalyticsDashboard: React.FC = () => {
  const { data: analytics, isLoading, error } = useGetAnalyticsQuery();

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
        Loading workforce compensation analytics...
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="alert alert-error">
        <span>Unable to load workforce compensation analytics. Please verify connection to the server.</span>
      </div>
    );
  }

  const { kpis, departments, countries, reasons } = analytics;
  const maxDeptHeadcount = Math.max(...departments.map((d) => d.headcount), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* KPI Overview Grid */}
      <div className="grid-cols-4">
        {/* Card 1: Total Workforce */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#EFF6FF',
              color: '#2563EB',
              display: 'flex',
            }}
          >
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Total Workforce
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.2 }}>
              {kpis.totalHeadcount.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Across 7 Jurisdictions
            </div>
          </div>
        </div>

        {/* Card 2: Active on Payroll */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#F0FDF4',
              color: '#16A34A',
              display: 'flex',
            }}
          >
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Active On Payroll
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#16A34A', lineHeight: 1.2 }}>
              {kpis.activeHeadcount.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {((kpis.activeHeadcount / kpis.totalHeadcount) * 100).toFixed(1)}% Active Rate
            </div>
          </div>
        </div>

        {/* Card 3: Salary Actions */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#FAF5FF',
              color: '#9333EA',
              display: 'flex',
            }}
          >
            <TrendingUp size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Salary Actions
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#9333EA', lineHeight: 1.2 }}>
              {kpis.totalHistoricalRevisions.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Progression Records
            </div>
          </div>
        </div>

        {/* Card 4: Operating Regions */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#FFFBEB',
              color: '#D97706',
              display: 'flex',
            }}
          >
            <Globe size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Operating Regions
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#D97706', lineHeight: 1.2 }}>
              {kpis.countriesCount} Countries
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              7 Global Currencies
            </div>
          </div>
        </div>
      </div>

      {/* Next Month Total Payroll Cashflow Forecast Section */}
      <div className="card" style={{ padding: '24px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                padding: '10px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#EFF6FF',
                color: 'var(--accent)',
                display: 'flex',
              }}
            >
              <Wallet size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)' }}>
                Next Month Total Payroll Cashflow Forecast
              </h3>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Projected cash outflow required from company accounts (Net Pay + Taxes & Benefits). Unpaid leave (LOP) stays with company.
              </div>
            </div>
          </div>

          <span
            className="badge"
            style={{
              backgroundColor: 'var(--success-bg)',
              color: 'var(--success-text)',
              border: '1px solid #A7F3D0',
              padding: '6px 14px',
              fontWeight: 700,
              fontSize: '0.8rem',
            }}
          >
            Upcoming Pay Cycle
          </span>
        </div>

        {/* Currency Forecast Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '16px',
          }}
        >
          {kpis.nextMonthPayrollByCurrency?.map((item) => (
            <div
              key={item.country}
              style={{
                backgroundColor: '#F8FAFC',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div>
                {/* Header: Country & Currency */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {item.country}
                  </span>
                  <span
                    className="badge"
                    style={{
                      backgroundColor: '#EFF6FF',
                      color: 'var(--accent)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      border: '1px solid #BFDBFE',
                    }}
                  >
                    {item.currency}
                  </span>
                </div>

                {/* Primary Outflow Figure */}
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                  {formatCurrency(item.payableGrossMonthlyPayroll || item.monthlyPayroll, item.currency)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 500 }}>
                  Total Cash Outflow Needed
                </div>
              </div>

              {/* Breakdown */}
              <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Net Direct Pay:</span>
                  <span style={{ color: '#16A34A', fontWeight: 700 }}>
                    {formatCurrency(item.netMonthlyPayroll || Math.round(item.monthlyPayroll * 0.75), item.currency)}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Taxes & Benefits:</span>
                  <span style={{ color: '#DC2626', fontWeight: 600 }}>
                    {formatCurrency(item.deductionsMonthlyPayroll || Math.round(item.monthlyPayroll * 0.25), item.currency)}
                  </span>
                </div>

                {Boolean(item.leaveDeductionsMonthlyPayroll && item.leaveDeductionsMonthlyPayroll > 0) && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.75rem',
                      color: 'var(--accent)',
                      borderTop: '1px dashed var(--border)',
                      paddingTop: '6px',
                      marginTop: '6px',
                    }}
                  >
                    <span>Retained (Unpaid LOP):</span>
                    <span style={{ fontWeight: 700 }}>
                      +{formatCurrency(item.leaveDeductionsMonthlyPayroll!, item.currency)}
                    </span>
                  </div>
                )}

                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    marginTop: '10px',
                    paddingTop: '8px',
                    borderTop: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>Active Headcount</span>
                  <strong style={{ color: 'var(--text-main)' }}>
                    {item.headcount.toLocaleString()} employees
                  </strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Row 2: Department Pay Distribution & Change Drivers */}
      <div className="grid-cols-2">
        {/* Department Distribution */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Building2 size={20} color="var(--primary)" />
            <div>
              <h4 style={{ fontSize: '1rem' }}>Department Compensation & Headcount</h4>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Workforce density and comparative average compensation by division
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {departments.map((dept) => {
              const percentOfMax = (dept.headcount / maxDeptHeadcount) * 100;
              const percentOfTotal = ((dept.headcount / kpis.totalHeadcount) * 100).toFixed(1);

              return (
                <div key={dept.department}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{dept.department}</span>
                      <span
                        className="badge"
                        style={{ backgroundColor: '#F1F5F9', color: 'var(--text-muted)', fontSize: '0.7rem' }}
                      >
                        {dept.headcount.toLocaleString()} ({percentOfTotal}%)
                      </span>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--accent)' }}>
                      Avg: {formatCurrency(dept.avgSalary, 'USD')}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        backgroundColor: 'var(--primary)',
                        borderRadius: '4px',
                        width: `${percentOfMax}%`,
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    <span>Min: {formatCurrency(dept.minSalary, 'USD')}</span>
                    <span>Max: {formatCurrency(dept.maxSalary, 'USD')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Change Drivers */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <PieChart size={20} color="var(--accent)" />
            <div>
              <h4 style={{ fontSize: '1rem' }}>Compensation Change Drivers</h4>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Historical allocation of raises and adjustments
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {reasons.map((r) => (
              <div
                key={r.reason}
                style={{
                  padding: '14px 16px',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{getReasonLabel(r.reason)}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {r.count.toLocaleString()} actions recorded
                  </div>
                </div>
                <span
                  className="badge"
                  style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)', fontWeight: 700 }}
                >
                  {r.percentage}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Geographic Jurisdictions Table */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Globe size={20} color="var(--primary)" />
          <div>
            <h4 style={{ fontSize: '1rem' }}>Geographic Compensation & Currency Parity</h4>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Regional headcounts and localized currency compensation figures
            </div>
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Country</th>
                <th>Currency</th>
                <th style={{ textAlign: 'right' }}>Headcount</th>
                <th style={{ textAlign: 'right' }}>% of Workforce</th>
                <th style={{ textAlign: 'right' }}>Average Salary</th>
                <th style={{ textAlign: 'right' }}>Salary Range (Min – Max)</th>
                <th style={{ textAlign: 'right', color: 'var(--accent)' }}>
                  Next Month Payroll (Gross / Net)
                </th>
              </tr>
            </thead>
            <tbody>
              {countries.map((c) => {
                const pct = ((c.headcount / kpis.totalHeadcount) * 100).toFixed(1);
                return (
                  <tr key={c.country}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 600 }}>{c.country}</span>
                        <span
                          className="badge"
                          style={{ backgroundColor: '#F1F5F9', color: 'var(--text-muted)', fontSize: '0.7rem' }}
                        >
                          {c.countryCode}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{ border: '1px solid var(--border)', fontWeight: 700 }}
                      >
                        {c.currency}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>
                      {c.headcount.toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                      {pct}%
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>
                      {formatCurrency(c.avgSalary, c.currency)}
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                      {formatCurrency(c.minSalary, c.currency)} – {formatCurrency(c.maxSalary, c.currency)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700 }}>
                        {formatCurrency(c.monthlyPayroll, c.currency)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#16A34A', fontWeight: 700 }}>
                        Net: {formatCurrency(c.netMonthlyPayroll || Math.round(c.monthlyPayroll * 0.75), c.currency)}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
