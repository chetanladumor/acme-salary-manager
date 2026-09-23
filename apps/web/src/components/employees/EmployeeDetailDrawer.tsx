import React, { useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Stack,
  Chip,
  Divider,
  Card,
  CardContent,
  CircularProgress,
  Avatar,
  Paper,
  Button,
  Collapse,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PaidIcon from '@mui/icons-material/Paid';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import BusinessIcon from '@mui/icons-material/Business';
import PublicIcon from '@mui/icons-material/Public';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { useGetEmployeeByIdQuery } from '../../features/api/apiSlice';
import { formatCurrency, formatDate, calculatePercentageChange, getReasonLabel } from '../../utils/formatters';
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

  const togglePayoutExpand = (id: string) => {
    setExpandedPayouts((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 520 },
          p: 0,
          bgcolor: '#F8FAFC',
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 3,
          bgcolor: 'primary.main',
          color: 'common.white',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              sx={{
                width: 52,
                height: 52,
                bgcolor: 'secondary.main',
                fontSize: '1.2rem',
                fontWeight: 700,
              }}
            >
              {employee ? `${employee.firstName[0]}${employee.lastName[0]}` : '—'}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                {employee ? employee.fullName : 'Employee Dossier'}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                {employee && (
                  <Chip
                    label={employee.employeeCode}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.15)',
                      color: 'common.white',
                      fontFamily: 'monospace',
                      fontWeight: 600,
                      height: 22,
                    }}
                  />
                )}
                {employee && (
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    Tenure: {employee.tenure.years}y {employee.tenure.months}m
                  </Typography>
                )}
              </Stack>
            </Box>
          </Stack>

          <IconButton
            onClick={onClose}
            size="small"
            sx={{ color: 'rgba(255, 255, 255, 0.8)', '&:hover': { color: 'common.white' } }}
          >
            <CloseIcon />
          </IconButton>
        </Stack>
      </Box>

      {/* Body Content */}
      <Box sx={{ p: 3 }}>
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Card sx={{ p: 3, bgcolor: '#FEF2F2', border: '1px solid #FCA5A5' }}>
            <Typography variant="body2" color="error">
              Unable to load employee details. Please try again.
            </Typography>
          </Card>
        )}

        {employee && (
          <Stack spacing={3}>
            {/* Card 1: Current Active Compensation */}
            <Card sx={{ border: '2px solid #2563EB', bgcolor: '#FFFFFF', boxShadow: '0 4px 6px -1px rgb(37 99 235 / 0.1)' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <PaidIcon color="secondary" fontSize="small" />
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
                      Current Base Compensation
                    </Typography>
                  </Stack>
                  <Chip
                    label={employee.currentSalary ? employee.currentSalary.currency : '—'}
                    size="small"
                    color="secondary"
                    sx={{ fontWeight: 700, height: 22 }}
                  />
                </Stack>

                <Box sx={{ mt: 1.5, mb: 1 }}>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                    {employee.currentSalary
                      ? formatCurrency(employee.currentSalary.annualSalary, employee.currentSalary.currency)
                      : 'Not Set'}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      Per Annum
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                      •
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#2563EB' }}>
                      {employee.currentSalary
                        ? `${formatCurrency(employee.currentSalary.monthlySalary || Math.round(employee.currentSalary.annualSalary / 12), employee.currentSalary.currency)} / month`
                        : '—'}
                    </Typography>
                  </Stack>
                </Box>

                <Divider sx={{ my: 1.5 }} />

                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" color="text.secondary">
                    Effective Since:
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    {employee.currentSalary ? formatDate(employee.currentSalary.effectiveFrom) : '—'}
                  </Typography>
                </Stack>

                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Adjustment Reason:
                  </Typography>
                  <Chip
                    label={employee.currentSalary ? getReasonLabel(employee.currentSalary.reason) : '—'}
                    size="small"
                    sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600, bgcolor: '#F1F5F9' }}
                  />
                </Stack>

                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  fullWidth
                  startIcon={<TrendingUpIcon />}
                  onClick={() => setAdjustmentModalOpen(true)}
                  sx={{ mt: 2, fontWeight: 600 }}
                >
                  Adjust Compensation
                </Button>
              </CardContent>
            </Card>

            {/* Card 2: Employment Profile & Demographics */}
            <Card>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                  Employment Details
                </Typography>

                <Stack spacing={1.5}>
                  <Stack direction="row" justifyContent="space-between">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <BusinessIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        Department:
                      </Typography>
                    </Stack>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {employee.department}
                    </Typography>
                  </Stack>

                  <Stack direction="row" justifyContent="space-between">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <WorkspacePremiumIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        Job Title:
                      </Typography>
                    </Stack>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {employee.jobTitle}
                    </Typography>
                  </Stack>

                  <Stack direction="row" justifyContent="space-between">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <PublicIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        Country:
                      </Typography>
                    </Stack>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {employee.country} ({employee.countryCode})
                    </Typography>
                  </Stack>

                  <Stack direction="row" justifyContent="space-between">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CalendarMonthIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        Hire Date:
                      </Typography>
                    </Stack>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatDate(employee.hireDate)}
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            {/* Card 3: Salary Progression Timeline */}
            <Card>
              <CardContent sx={{ p: 2.5 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <TrendingUpIcon color="secondary" fontSize="small" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Compensation Timeline ({employee.salaryHistory.length} Record{employee.salaryHistory.length === 1 ? '' : 's'})
                  </Typography>
                </Stack>

                <Stack spacing={2}>
                  {employee.salaryHistory.map((item, index) => {
                    const nextItem = employee.salaryHistory[index + 1];
                    const percentChange = nextItem
                      ? calculatePercentageChange(nextItem.annualSalary, item.annualSalary)
                      : null;
                    const isActive = item.effectiveTo === null;

                    return (
                      <Paper
                        key={item.id}
                        elevation={0}
                        sx={{
                          p: 2,
                          bgcolor: isActive ? '#F8FAFC' : '#FFFFFF',
                          border: isActive ? '1px solid #2563EB' : '1px solid #E2E8F0',
                          borderRadius: 2,
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="body1" sx={{ fontWeight: 700, color: '#0F172A' }}>
                              {formatCurrency(item.annualSalary, item.currency)}
                            </Typography>
                            {percentChange && (
                              <Chip
                                label={percentChange}
                                size="small"
                                sx={{
                                  bgcolor: '#ECFDF5',
                                  color: '#065F46',
                                  fontWeight: 700,
                                  fontSize: '0.7rem',
                                  height: 20,
                                }}
                              />
                            )}
                          </Stack>
                          <Chip
                            label={isActive ? 'Active' : 'Prior'}
                            size="small"
                            variant={isActive ? 'filled' : 'outlined'}
                            color={isActive ? 'primary' : 'default'}
                            sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                          />
                        </Stack>

                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(item.effectiveFrom)} – {formatDate(item.effectiveTo)}
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: '#475569' }}>
                            {getReasonLabel(item.reason)}
                          </Typography>
                        </Stack>
                      </Paper>
                    );
                  })}
                </Stack>
              </CardContent>
            </Card>

            {/* Card 4: Monthly Salary Disbursement Ledger (Previous Months Paid) */}
            <Card>
              <CardContent sx={{ p: 2.5 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <ReceiptLongIcon color="primary" fontSize="small" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Monthly Pay Ledger (Previous Disbursements)
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                  Historical record of monthly salary payouts disbursed to this employee.
                </Typography>

                {employee.monthlyPayouts && employee.monthlyPayouts.length > 0 ? (
                  <Stack spacing={1.5}>
                    {employee.monthlyPayouts.map((payout) => {
                      const isExpanded = !!expandedPayouts[payout.id];
                      const gross = payout.grossSalary || payout.amount;
                      const tax = payout.taxDeduction || 0;
                      const leave = payout.leaveDeduction || 0;
                      const other = payout.otherDeductions || 0;
                      const net = payout.netSalary !== undefined ? payout.netSalary : payout.amount;
                      const taxRatePct = gross > 0 ? ((tax / gross) * 100).toFixed(1).replace('.0', '') : '20';
                      const otherRatePct = gross > 0 ? ((other / gross) * 100).toFixed(1).replace('.0', '') : '5';

                      return (
                        <Paper
                          key={payout.id}
                          elevation={0}
                          sx={{
                            p: 2,
                            bgcolor: '#FFFFFF',
                            border: isExpanded ? '1.5px solid #2563EB' : '1px solid #E2E8F0',
                            borderRadius: 2,
                            transition: 'all 0.2s ease',
                            '&:hover': { borderColor: '#93C5FA', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' },
                          }}
                        >
                          {/* Header: Gross vs. Net Pay Overview */}
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                                {payout.month}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Pay Date: {formatDate(payout.payoutDate)}
                              </Typography>
                              <Typography variant="caption" sx={{ display: 'block', color: '#64748B', mt: 0.25 }}>
                                Basis: {getReasonLabel(payout.reason as any)}
                              </Typography>
                            </Box>

                            <Stack alignItems="flex-end" spacing={0.5}>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Box sx={{ textAlign: 'right' }}>
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.68rem' }}>
                                    Gross: {formatCurrency(gross, payout.currency)}
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#16A34A' }}>
                                    Net: {formatCurrency(net, payout.currency)}
                                  </Typography>
                                </Box>
                                <Chip
                                  icon={<CheckCircleOutlineIcon style={{ fontSize: 13 }} />}
                                  label={payout.status}
                                  size="small"
                                  sx={{
                                    height: 20,
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                    bgcolor: payout.status === 'PAID' ? '#DCFCE7' : '#EFF6FF',
                                    color: payout.status === 'PAID' ? '#15803D' : '#2563EB',
                                  }}
                                />
                              </Stack>

                              <Button
                                size="small"
                                onClick={() => togglePayoutExpand(payout.id)}
                                endIcon={isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                                sx={{
                                  fontSize: '0.72rem',
                                  fontWeight: 600,
                                  textTransform: 'none',
                                  p: 0,
                                  minWidth: 'auto',
                                  color: '#2563EB',
                                }}
                              >
                                {isExpanded ? 'Hide Payslip' : 'View Payslip'}
                              </Button>
                            </Stack>
                          </Stack>

                          {/* Expandable Payslip Breakdown */}
                          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                            <Box
                              sx={{
                                mt: 2,
                                p: 2,
                                bgcolor: '#F8FAFC',
                                borderRadius: 2,
                                border: '1px solid #E2E8F0',
                              }}
                            >
                              <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', mb: 1.5, letterSpacing: '0.05em' }}>
                                Itemized Payslip & Deduction Voucher
                              </Typography>

                              <Stack spacing={1}>
                                {/* Gross Salary */}
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
                                    🟢 Gross Salary:
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                                    {formatCurrency(gross, payout.currency)}
                                  </Typography>
                                </Stack>

                                {/* Income Tax Withholding */}
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                  <Typography variant="body2" sx={{ color: '#DC2626' }}>
                                    🔴 Income Tax Withholding:
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#DC2626' }}>
                                    - {formatCurrency(tax, payout.currency)} ({taxRatePct}%)
                                  </Typography>
                                </Stack>

                                {/* Unpaid Leave */}
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                  <Typography variant="body2" sx={{ color: '#DC2626' }}>
                                    🔴 Unpaid Leave:
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600, color: leave > 0 ? '#DC2626' : '#64748B' }}>
                                    - {formatCurrency(leave, payout.currency)}
                                  </Typography>
                                </Stack>

                                {/* Benefits & Retirement */}
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                  <Typography variant="body2" sx={{ color: '#DC2626' }}>
                                    🔴 Benefits & Retirement:
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#DC2626' }}>
                                    - {formatCurrency(other, payout.currency)} ({otherRatePct}%)
                                  </Typography>
                                </Stack>

                                <Divider sx={{ my: 1, borderColor: '#CBD5E1' }} />

                                {/* Net Disbursed Take-Home */}
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                  <Typography variant="body1" sx={{ fontWeight: 800, color: '#1D4ED8' }}>
                                    🔵 Net Disbursed Take-Home:
                                  </Typography>
                                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#1D4ED8' }}>
                                    {formatCurrency(net, payout.currency)}
                                  </Typography>
                                </Stack>
                              </Stack>

                              {payout.notes && (
                                <Box sx={{ mt: 1.5, pt: 1, borderTop: '1px dashed #E2E8F0' }}>
                                  <Typography variant="caption" sx={{ color: '#64748B', fontStyle: 'italic', display: 'block' }}>
                                    Remittance Reference: {payout.notes}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </Collapse>
                        </Paper>
                      );
                    })}
                  </Stack>
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    No historical monthly disbursements on record.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Stack>
        )}
      </Box>

      {/* Salary Adjustment Dialog */}
      <SalaryAdjustmentModal
        open={adjustmentModalOpen}
        onClose={() => setAdjustmentModalOpen(false)}
        employee={employee || null}
      />
    </Drawer>
  );
};
