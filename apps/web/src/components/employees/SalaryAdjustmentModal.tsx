import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  Typography,
  Alert,
  CircularProgress,
  MenuItem,
  Box,
  Chip,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
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

  if (!employee) return null;

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

      setSuccessMessage('Compensation revision recorded successfully!');
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMessage(
        err?.data?.error?.message || 'Failed to apply salary adjustment. Please verify inputs.'
      );
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                bgcolor: 'secondary.main',
                color: 'common.white',
                p: 1,
                borderRadius: 1.5,
                display: 'flex',
              }}
            >
              <TrendingUpIcon fontSize="small" />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Adjust Compensation
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {employee.fullName} ({employee.employeeCode}) • {employee.jobTitle}
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>

        <DialogContent dividers sx={{ py: 3 }}>
          <Stack spacing={2.5}>
            {errorMessage && (
              <Alert severity="error" onClose={() => setErrorMessage(null)}>
                {errorMessage}
              </Alert>
            )}

            {successMessage && (
              <Alert severity="success">
                {successMessage}
              </Alert>
            )}

            {/* Live Delta Preview Card */}
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: '#F8FAFC',
                border: '1px solid #E2E8F0',
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Current Base
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: '#475569' }}>
                    {formatCurrency(currentSalary, currency)}
                  </Typography>
                </Box>

                <Typography variant="h6" color="text.secondary">→</Typography>

                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Proposed New Base
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end">
                    <Typography variant="body1" sx={{ fontWeight: 800, color: 'primary.main' }}>
                      {formatCurrency(newSalary, currency)}
                    </Typography>
                    <Chip
                      label={percentageGain}
                      size="small"
                      sx={{
                        bgcolor: diffAmount >= 0 ? '#ECFDF5' : '#FEF2F2',
                        color: diffAmount >= 0 ? '#065F46' : '#991B1B',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        height: 22,
                      }}
                    />
                  </Stack>
                </Box>
              </Stack>
            </Box>

            {/* New Salary Input */}
            <TextField
              label={`New Annual Salary (${currency})`}
              type="number"
              fullWidth
              required
              size="small"
              value={newSalary === 0 ? '' : newSalary}
              onChange={(e) => setNewSalary(e.target.value === '' ? 0 : Number(e.target.value))}
              disabled={isLoading || Boolean(successMessage)}
              inputProps={{ min: 1, step: 'any' }}
              helperText={`Net adjustment: ${diffAmount >= 0 ? '+' : ''}${formatCurrency(diffAmount, currency)}`}
            />

            {/* Change Reason Dropdown */}
            <TextField
              select
              label="Adjustment Reason"
              fullWidth
              required
              size="small"
              value={reason}
              onChange={(e) => setReason(e.target.value as ChangeReason)}
              disabled={isLoading || Boolean(successMessage)}
            >
              {REASONS.map((r) => (
                <MenuItem key={r} value={r}>
                  {getReasonLabel(r)}
                </MenuItem>
              ))}
            </TextField>

            {/* Effective Date */}
            <TextField
              label="Effective Date"
              type="date"
              fullWidth
              required
              size="small"
              value={effectiveFrom}
              onChange={(e) => setEffectiveFrom(e.target.value)}
              disabled={isLoading || Boolean(successMessage)}
              InputLabelProps={{ shrink: true }}
              helperText="Date from which the new salary record takes legal effect"
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={isLoading} color="inherit">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isLoading || Boolean(successMessage)}
            startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ fontWeight: 600 }}
          >
            {isLoading ? 'Processing...' : 'Apply Compensation Revision'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
