import React, { useState } from 'react';
import {
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
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

const getStatusBadge = (status: EmploymentStatus) => {
  switch (status) {
    case 'ACTIVE':
      return <span className="badge badge-active">Active</span>;
    case 'ON_LEAVE':
      return <span className="badge badge-onleave">On Leave</span>;
    case 'INACTIVE':
      return <span className="badge badge-inactive">Inactive</span>;
  }
};

const getDepartmentStyle = (dept: string) => {
  switch (dept) {
    case 'Engineering':
      return { color: '#2563EB', backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' };
    case 'Product':
      return { color: '#7C3AED', backgroundColor: '#F5F3FF', borderColor: '#DDD6FE' };
    case 'Sales':
      return { color: '#059669', backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' };
    case 'Finance':
      return { color: '#D97706', backgroundColor: '#FFFBEB', borderColor: '#FDE68A' };
    default:
      return { color: '#475569', backgroundColor: '#F1F5F9', borderColor: '#E2E8F0' };
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
  const [pageInput, setPageInput] = useState(pagination.page.toString());

  React.useEffect(() => {
    setPageInput(pagination.page.toString());
  }, [pagination.page]);

  const startRecord = (pagination.page - 1) * pagination.limit + 1;
  const endRecord = Math.min(pagination.page * pagination.limit, pagination.total);

  const renderSortIcon = (column: string) => {
    if (sortBy !== column) {
      return <ArrowUpDown size={14} style={{ opacity: 0.4 }} />;
    }
    return sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
  };

  return (
    <div style={{ width: '100%' }}>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th
                className="sortable"
                onClick={() => onSortChange('employeeCode')}
                style={{ width: '120px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Code</span>
                  {renderSortIcon('employeeCode')}
                </div>
              </th>

              <th
                className="sortable"
                onClick={() => onSortChange('lastName')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Employee</span>
                  {renderSortIcon('lastName')}
                </div>
              </th>

              <th
                className="sortable"
                onClick={() => onSortChange('department')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Department</span>
                  {renderSortIcon('department')}
                </div>
              </th>

              <th
                className="sortable"
                onClick={() => onSortChange('jobTitle')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Job Title</span>
                  {renderSortIcon('jobTitle')}
                </div>
              </th>

              <th
                className="sortable"
                onClick={() => onSortChange('country')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Country</span>
                  {renderSortIcon('country')}
                </div>
              </th>

              <th style={{ width: '100px' }}>Status</th>

              <th style={{ textAlign: 'right', width: '150px' }}>
                Annual Salary
              </th>

              <th style={{ textAlign: 'center', width: '100px' }}>
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, index) => (
                <tr key={index}>
                  <td colSpan={8} style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading employee directory records...
                  </td>
                </tr>
              ))
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '48px 16px' }}>
                  <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '6px' }}>
                    No matching employees found
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    Try adjusting your search criteria or clearing filters.
                  </div>
                </td>
              </tr>
            ) : (
              employees.map((emp) => {
                const deptStyle = getDepartmentStyle(emp.department);
                return (
                  <tr
                    key={emp.id}
                    onClick={() => onSelectEmployee(emp.id)}
                  >
                    {/* Code */}
                    <td>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontWeight: 600,
                          color: 'var(--primary)',
                          backgroundColor: '#F1F5F9',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                        }}
                      >
                        {emp.employeeCode}
                      </span>
                    </td>

                    {/* Employee Info */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: '#E2E8F0',
                            color: '#334155',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {emp.firstName[0]}
                          {emp.lastName[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                            {emp.fullName}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {emp.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          border: `1px solid ${deptStyle.borderColor}`,
                          color: deptStyle.color,
                          backgroundColor: deptStyle.backgroundColor,
                        }}
                      >
                        {emp.department}
                      </span>
                    </td>

                    {/* Job Title */}
                    <td>
                      <span style={{ color: 'var(--text-main)', fontSize: '0.875rem' }}>
                        {emp.jobTitle}
                      </span>
                    </td>

                    {/* Country */}
                    <td>
                      <span style={{ fontSize: '0.875rem' }}>{emp.country} </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        ({emp.countryCode})
                      </span>
                    </td>

                    {/* Status */}
                    <td>{getStatusBadge(emp.status)}</td>

                    {/* Compensation */}
                    <td style={{ textAlign: 'right' }}>
                      {emp.currentSalary ? (
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                            {formatCurrency(emp.currentSalary.annualSalary, emp.currentSalary.currency)}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600 }}>
                            {formatCurrency(Math.round(emp.currentSalary.annualSalary / 12), emp.currentSalary.currency)}/mo
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>

                    {/* Action */}
                    <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => onSelectEmployee(emp.id)}
                        style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                      >
                        <Eye size={13} />
                        <span>Dossier</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="pagination-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          <span>Rows per page:</span>
          <select
            className="select"
            value={pagination.limit}
            onChange={(e) => {
              onLimitChange(parseInt(e.target.value, 10));
              onPageChange(1);
            }}
            style={{ padding: '4px 8px', fontSize: '0.875rem' }}
          >
            {[10, 25, 50, 100].map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            {pagination.total > 0
              ? `${startRecord}–${endRecord} of ${pagination.total}`
              : '0 of 0'}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {/* First Page */}
            <button
              type="button"
              className="btn btn-outline btn-sm"
              disabled={pagination.page <= 1 || isLoading}
              onClick={() => onPageChange(1)}
              title="First Page"
              style={{ padding: '6px 8px' }}
            >
              <ChevronsLeft size={16} />
            </button>

            {/* Previous Page */}
            <button
              type="button"
              className="btn btn-outline btn-sm"
              disabled={pagination.page <= 1 || isLoading}
              onClick={() => onPageChange(pagination.page - 1)}
              title="Previous Page"
              style={{ padding: '6px 8px' }}
            >
              <ChevronLeft size={16} />
            </button>

            {/* Page Jump Input & Total Pages */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '0 6px', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Page</span>
              <input
                type="number"
                min={1}
                max={pagination.totalPages || 1}
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const pageNum = parseInt(pageInput, 10);
                    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= pagination.totalPages) {
                      onPageChange(pageNum);
                    }
                  }
                }}
                onBlur={() => {
                  const pageNum = parseInt(pageInput, 10);
                  if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= pagination.totalPages) {
                    onPageChange(pageNum);
                  } else {
                    setPageInput(pagination.page.toString());
                  }
                }}
                style={{
                  width: '54px',
                  textAlign: 'center',
                  padding: '4px 6px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-main)',
                  color: 'var(--text-main)',
                }}
                title="Type a page number and press Enter to jump directly"
              />
              <span style={{ color: 'var(--text-muted)' }}>of {pagination.totalPages || 1}</span>
            </div>

            {/* Next Page */}
            <button
              type="button"
              className="btn btn-outline btn-sm"
              disabled={pagination.page >= pagination.totalPages || isLoading}
              onClick={() => onPageChange(pagination.page + 1)}
              title="Next Page"
              style={{ padding: '6px 8px' }}
            >
              <ChevronRight size={16} />
            </button>

            {/* Last Page */}
            <button
              type="button"
              className="btn btn-outline btn-sm"
              disabled={pagination.page >= pagination.totalPages || isLoading}
              onClick={() => onPageChange(pagination.totalPages)}
              title="Last Page"
              style={{ padding: '6px 8px' }}
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
