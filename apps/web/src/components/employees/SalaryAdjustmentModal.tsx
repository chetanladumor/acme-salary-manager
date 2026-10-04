import React, { useState, useEffect } from 'react';
import { TrendingUp, X } from 'lucide-react';
import { EmployeeDetail, ChangeReason } from '../../types';
import { useAdjustSalaryMutation } from '../../features/api/apiSlice';
import { formatCurrency, calculatePercentageChange, getReasonLabel } from '../../utils/formatters';

interface SalaryAdjustmentModalProps {
  open: boolean;
  onClose: () => void;
  employee: EmployeeDetail | null;
}

const REASONS: ChangeReason[] = [
  'ANNUAL_REVIEW',
  'PROMOTION',
  'MARKET_ADJUSTMENT',
  'EQUITY_REALIGNMENT',
  'LATERAL_MOVE',
];

export const SalaryAdjustmentModal: React.FC<SalaryAdjustmentModalProps> = ({
  open,
  onClose,
  employee,
}) => {
  const [adjustSalaryApi, { isLoading }] = useAdjustSalaryMutation();

  const currentSalary = employee?.currentSalary?.annualSalary || 0;
  const currency = employee?.currentSalary?.currency || 'USD';

  const [newSalary, setNewSalary] = useState<number>(0);
  const [reason, setReason] = useState<ChangeReason>('ANNUAL_REVIEW');
  const [effectiveFrom, setEffectiveFrom] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Set default initial values when opened
  useEffect(() => {
    if (employee && open) {
      const suggestedSalary = Math.round((currentSalary * 1.08) / 500) * 500;
      setNewSalary(suggestedSalary);
      setReason('ANNUAL_REVIEW');
      setEffectiveFrom(new Date().toISOString().split('T')[0]);
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [employee, open, currentSalary]);

  if (!open || !employee) return null;

  const diffAmount = newSalary - currentSalary;
  const percentageGain = calculatePercentageChange(currentSalary, newSalary);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (newSalary <= 0) {
      setErrorMessage('Annual salary must be greater than zero.');
      return;
    }

    try {
      await adjustSalaryApi({
        employeeId: employee.id,
        data: {
          annualSalary: Number(newSalary),
          currency,
          effectiveFrom,
          reason,
        },
      }).unwrap();

      onClose();
    } catch (err: any) {
      setErrorMessage(
        err?.data?.error?.message || 'Failed to apply salary adjustment. Please verify inputs.'
      );
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          {/* Modal Header */}
          <div className="modal-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  backgroundColor: 'var(--accent)',
                  color: '#FFFFFF',
                  padding: '8px',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                }}
              >
                <TrendingUp size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem' }}>Adjust Compensation</h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {employee.fullName} ({employee.employeeCode}) • {employee.jobTitle}
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn-icon"
              onClick={onClose}
              disabled={isLoading}
              title="Close dialog"
            >
              <X size={20} />
            </button>
          </div>

          {/* Modal Body */}
          <div className="modal-body">
            {errorMessage && (
              <div className="alert alert-error">
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="alert alert-success">
                <span>{successMessage}</span>
              </div>
            )}

            {/* Live Delta Preview Card */}
            <div
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#F8FAFC',
                border: '1px solid var(--border)',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    Current Base
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#475569' }}>
                    {formatCurrency(currentSalary, currency)}
                  </div>
                </div>

                <div style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>→</div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    Proposed New Base
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>
                      {formatCurrency(newSalary, currency)}
                    </span>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        backgroundColor: diffAmount >= 0 ? 'var(--success-bg)' : 'var(--danger-bg)',
                        color: diffAmount >= 0 ? 'var(--success-text)' : 'var(--danger-text)',
                      }}
                    >
                      {percentageGain}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* New Salary Input */}
            <div className="form-group">
              <label className="form-label">
                New Annual Salary ({currency})
              </label>
              <input
                type="number"
                min="1"
                step="any"
                required
                className="input-text"
                value={newSalary === 0 ? '' : newSalary}
                onChange={(e) =>
                  setNewSalary(e.target.value === '' ? 0 : Number(e.target.value))
                }
                disabled={isLoading || Boolean(successMessage)}
                style={{ width: '100%' }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Net adjustment: {diffAmount >= 0 ? '+' : ''}
                {formatCurrency(diffAmount, currency)}
              </span>
            </div>

            {/* Change Reason Dropdown */}
            <div className="form-group">
              <label className="form-label">
                Adjustment Reason
              </label>
              <select
                className="select"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value as ChangeReason)}
                disabled={isLoading || Boolean(successMessage)}
                style={{ width: '100%' }}
              >
                {REASONS.map((r) => (
                  <option key={r} value={r}>
                    {getReasonLabel(r)}
                  </option>
                ))}
              </select>
            </div>

            {/* Effective Date Input */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">
                Effective Date
              </label>
              <input
                type="date"
                required
                className="input-text"
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
                disabled={isLoading || Boolean(successMessage)}
                style={{ width: '100%' }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Date from which the new salary record takes legal effect
              </span>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading || Boolean(successMessage)}
            >
              {isLoading ? 'Processing...' : 'Apply Compensation Revision'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
