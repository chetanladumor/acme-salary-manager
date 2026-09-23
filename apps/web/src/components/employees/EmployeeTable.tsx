import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  Stack,
  Typography,
  TablePagination,
  Button,
  Skeleton,
  Box,
  TableSortLabel,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { EmployeeListItem, PaginationMeta, EmploymentStatus } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface EmployeeTableProps {
  employees: EmployeeListItem[];
  pagination: PaginationMeta;
  isLoading: boolean;
  onPageChange: (newPage: number) => void;
  onLimitChange: (newLimit: number) => void;
  onSortChange: (column: string) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSelectEmployee: (employeeId: string) => void;
}

const getStatusChip = (status: EmploymentStatus) => {
  switch (status) {
    case 'ACTIVE':
      return (
        <Chip
          label="Active"
          size="small"
          sx={{
            bgcolor: '#ECFDF5',
            color: '#065F46',
            fontWeight: 600,
            fontSize: '0.75rem',
            border: '1px solid #A7F3D0',
          }}
        />
      );
    case 'ON_LEAVE':
      return (
        <Chip
          label="On Leave"
          size="small"
          sx={{
            bgcolor: '#FFFBEB',
            color: '#92400E',
            fontWeight: 600,
            fontSize: '0.75rem',
            border: '1px solid #FDE68A',
          }}
        />
      );
    case 'INACTIVE':
      return (
        <Chip
          label="Inactive"
          size="small"
          sx={{
            bgcolor: '#F1F5F9',
            color: '#475569',
            fontWeight: 600,
            fontSize: '0.75rem',
            border: '1px solid #CBD5E1',
          }}
        />
      );
  }
};

const getDepartmentColor = (dept: string) => {
  switch (dept) {
    case 'Engineering':
      return '#2563EB'; // Blue
    case 'Product':
      return '#7C3AED'; // Purple
    case 'Sales':
      return '#059669'; // Emerald
    case 'Finance':
      return '#D97706'; // Amber
    default:
      return '#475569'; // Slate
  }
};

export const EmployeeTable: React.FC<EmployeeTableProps> = ({
  employees,
  pagination,
  isLoading,
  onPageChange,
  onLimitChange,
  onSortChange,
  sortBy,
  sortOrder,
  onSelectEmployee,
}) => {
  const handleChangePage = (_: unknown, newPage: number) => {
    onPageChange(newPage + 1); // MUI is 0-indexed, our API is 1-indexed
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    onLimitChange(parseInt(event.target.value, 10));
    onPageChange(1);
  };

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden', border: '1px solid #E2E8F0', borderRadius: 2 }}>
      <TableContainer sx={{ maxHeight: 680 }}>
        <Table stickyHeader size="medium">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, bgcolor: '#F8FAFC' }}>
                <TableSortLabel
                  active={sortBy === 'employeeCode'}
                  direction={sortBy === 'employeeCode' ? sortOrder : 'asc'}
                  onClick={() => onSortChange('employeeCode')}
                >
                  Code
                </TableSortLabel>
              </TableCell>

              <TableCell sx={{ fontWeight: 700, bgcolor: '#F8FAFC' }}>
                <TableSortLabel
                  active={sortBy === 'lastName'}
                  direction={sortBy === 'lastName' ? sortOrder : 'asc'}
                  onClick={() => onSortChange('lastName')}
                >
                  Employee
                </TableSortLabel>
              </TableCell>

              <TableCell sx={{ fontWeight: 700, bgcolor: '#F8FAFC' }}>
                <TableSortLabel
                  active={sortBy === 'department'}
                  direction={sortBy === 'department' ? sortOrder : 'asc'}
                  onClick={() => onSortChange('department')}
                >
                  Department
                </TableSortLabel>
              </TableCell>

              <TableCell sx={{ fontWeight: 700, bgcolor: '#F8FAFC' }}>
                <TableSortLabel
                  active={sortBy === 'jobTitle'}
                  direction={sortBy === 'jobTitle' ? sortOrder : 'asc'}
                  onClick={() => onSortChange('jobTitle')}
                >
                  Job Title
                </TableSortLabel>
              </TableCell>

              <TableCell sx={{ fontWeight: 700, bgcolor: '#F8FAFC' }}>
                <TableSortLabel
                  active={sortBy === 'country'}
                  direction={sortBy === 'country' ? sortOrder : 'asc'}
                  onClick={() => onSortChange('country')}
                >
                  Country
                </TableSortLabel>
              </TableCell>

              <TableCell sx={{ fontWeight: 700, bgcolor: '#F8FAFC' }}>Status</TableCell>

              <TableCell align="right" sx={{ fontWeight: 700, bgcolor: '#F8FAFC' }}>
                Annual Salary
              </TableCell>

              <TableCell align="center" sx={{ fontWeight: 700, bgcolor: '#F8FAFC' }}>
                Action
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton width={80} /></TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Skeleton variant="circular" width={32} height={32} />
                      <Box sx={{ width: '100%' }}>
                        <Skeleton width={120} height={18} />
                        <Skeleton width={160} height={14} />
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell><Skeleton width={90} /></TableCell>
                  <TableCell><Skeleton width={140} /></TableCell>
                  <TableCell><Skeleton width={80} /></TableCell>
                  <TableCell><Skeleton width={60} /></TableCell>
                  <TableCell align="right"><Skeleton width={90} sx={{ ml: 'auto' }} /></TableCell>
                  <TableCell align="center"><Skeleton width={80} sx={{ mx: 'auto' }} /></TableCell>
                </TableRow>
              ))
            ) : employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No matching employees found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Try adjusting your search criteria or clearing filters.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              employees.map((emp) => (
                <TableRow
                  key={emp.id}
                  hover
                  sx={{
                    '&:last-child td, &:last-child th': { border: 0 },
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease',
                  }}
                  onClick={() => onSelectEmployee(emp.id)}
                >
                  {/* Code */}
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: 'monospace',
                        fontWeight: 600,
                        color: 'primary.main',
                        bgcolor: '#F1F5F9',
                        px: 1,
                        py: 0.25,
                        borderRadius: 1,
                        display: 'inline-block',
                      }}
                    >
                      {emp.employeeCode}
                    </Typography>
                  </TableCell>

                  {/* Employee Info */}
                  <TableCell>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          fontSize: '0.8rem',
                          bgcolor: '#E2E8F0',
                          color: '#334155',
                          fontWeight: 700,
                        }}
                      >
                        {emp.firstName[0]}
                        {emp.lastName[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                          {emp.fullName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {emp.email}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>

                  {/* Department */}
                  <TableCell>
                    <Chip
                      label={emp.department}
                      size="small"
                      sx={{
                        fontWeight: 500,
                        fontSize: '0.75rem',
                        color: getDepartmentColor(emp.department),
                        bgcolor: `${getDepartmentColor(emp.department)}12`,
                        borderRadius: 1,
                      }}
                    />
                  </TableCell>

                  {/* Job Title */}
                  <TableCell>
                    <Typography variant="body2" sx={{ color: 'text.primary' }}>
                      {emp.jobTitle}
                    </Typography>
                  </TableCell>

                  {/* Country */}
                  <TableCell>
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <Typography variant="body2">{emp.country}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        ({emp.countryCode})
                      </Typography>
                    </Stack>
                  </TableCell>

                  {/* Status */}
                  <TableCell>{getStatusChip(emp.status)}</TableCell>

                  {/* Current Compensation (Annual & Monthly) */}
                  <TableCell align="right">
                    {emp.currentSalary ? (
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                          {formatCurrency(emp.currentSalary.annualSalary, emp.currentSalary.currency)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#2563EB', fontWeight: 600, display: 'block' }}>
                          {formatCurrency(Math.round(emp.currentSalary.annualSalary / 12), emp.currentSalary.currency)}/mo
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        —
                      </Typography>
                    )}
                  </TableCell>

                  {/* Action */}
                  <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="small"
                      variant="outlined"
                      color="primary"
                      startIcon={<VisibilityIcon fontSize="small" />}
                      onClick={() => onSelectEmployee(emp.id)}
                      sx={{ fontSize: '0.75rem', py: 0.25, px: 1 }}
                    >
                      Dossier
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[10, 25, 50, 100]}
        component="div"
        count={pagination.total}
        rowsPerPage={pagination.limit}
        page={Math.max(0, pagination.page - 1)}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        sx={{ borderTop: '1px solid #E2E8F0' }}
      />
    </Paper>
  );
};
