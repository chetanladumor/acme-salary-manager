import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Users,
  Globe,
  Building2,
  Coins,
  List,
  BarChart3,
} from 'lucide-react';
import { RootState } from './app/store';
import { useGetEmployeesQuery, useGetFacetsQuery } from './features/api/apiSlice';
import { EmployeeFilterParams } from './types';
import { Navbar } from './components/layout/Navbar';
import { FilterBar } from './components/employees/FilterBar';
import { EmployeeTable } from './components/employees/EmployeeTable';
import { EmployeeDetailDrawer } from './components/employees/EmployeeDetailDrawer';
import { LoginScreen } from './components/auth/LoginScreen';
import { AnalyticsDashboard } from './components/analytics/AnalyticsDashboard';

export const App: React.FC = () => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const [activeTab, setActiveTab] = useState<'directory' | 'analytics'>('directory');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  // Filter & Pagination State
  const [filters, setFilters] = useState<EmployeeFilterParams>({
    page: 1,
    limit: 25,
    sortBy: 'employeeCode',
    sortOrder: 'asc',
  });

  // Queries (only active when user is authenticated)
  const { data: facets } = useGetFacetsQuery(undefined, { skip: !isAuthenticated });
  const {
    data: employeesData,
    isLoading: isEmployeesLoading,
    error: employeesError,
  } = useGetEmployeesQuery(filters, { skip: !isAuthenticated || activeTab !== 'directory' });

  const handleFilterChange = (newFilters: Partial<EmployeeFilterParams>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilters({
      page: 1,
      limit: 25,
      sortBy: 'employeeCode',
      sortOrder: 'asc',
    });
  };

  const handleSortChange = (column: string) => {
    setFilters((prev) => {
      const isAsc = prev.sortBy === column && prev.sortOrder === 'asc';
      return {
        ...prev,
        sortBy: column,
        sortOrder: isAsc ? 'desc' : 'asc',
        page: 1,
      };
    });
  };

  // If not authenticated, show dedicated full-page Login Screen
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // Authenticated Executive Portal
  return (
    <div className="app-container">
      {/* Executive Navbar */}
      <Navbar totalEmployees={employeesData?.pagination.total} />

      <main className="main-content">
        {/* Header Row: Title & Navigation View Switcher */}
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
          <div>
            <h1 style={{ fontSize: '1.6rem', marginBottom: '4px' }}>
              {activeTab === 'directory'
                ? 'Workforce Compensation Directory'
                : 'Executive Compensation Analytics'}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              {activeTab === 'directory'
                ? 'Centralized HR compensation management across global jurisdictions.'
                : 'Real-time organization-wide pay parity, departmental budgets, and growth metrics.'}
            </p>
          </div>

          {/* View Switcher Tabs */}
          <div
            style={{
              backgroundColor: '#E2E8F0',
              borderRadius: 'var(--radius-md)',
              padding: '4px',
              display: 'flex',
              gap: '4px',
            }}
          >
            <button
              type="button"
              className="tab-btn"
              onClick={() => setActiveTab('directory')}
              style={{
                borderRadius: 'var(--radius-sm)',
                borderBottom: 'none',
                margin: 0,
                padding: '6px 16px',
                backgroundColor: activeTab === 'directory' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'directory' ? 'var(--primary)' : 'var(--text-muted)',
                boxShadow: activeTab === 'directory' ? 'var(--shadow-sm)' : 'none',
              }}
            >
              <List size={16} />
              <span>Directory</span>
            </button>

            <button
              type="button"
              className="tab-btn"
              onClick={() => setActiveTab('analytics')}
              style={{
                borderRadius: 'var(--radius-sm)',
                borderBottom: 'none',
                margin: 0,
                padding: '6px 16px',
                backgroundColor: activeTab === 'analytics' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'analytics' ? 'var(--primary)' : 'var(--text-muted)',
                boxShadow: activeTab === 'analytics' ? 'var(--shadow-sm)' : 'none',
              }}
            >
              <BarChart3 size={16} />
              <span>Analytics & KPIs</span>
            </button>
          </div>
        </div>

        {/* Conditional View Rendering */}
        {activeTab === 'analytics' ? (
          <AnalyticsDashboard />
        ) : (
          <>
            {/* Quick Metrics Bar */}
            <div className="grid-cols-4">
              <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px' }}>
                <div
                  style={{
                    padding: '10px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#EFF6FF',
                    color: '#2563EB',
                    display: 'flex',
                  }}
                >
                  <Users size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    Total Headcount
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    {employeesData ? employeesData.pagination.total.toLocaleString() : '10,000'}
                  </div>
                </div>
              </div>

              <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px' }}>
                <div
                  style={{
                    padding: '10px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#F0FDF4',
                    color: '#16A34A',
                    display: 'flex',
                  }}
                >
                  <Globe size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    Global Regions
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    {facets ? facets.countries.length : 7} Countries
                  </div>
                </div>
              </div>

              <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px' }}>
                <div
                  style={{
                    padding: '10px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#FAF5FF',
                    color: '#9333EA',
                    display: 'flex',
                  }}
                >
                  <Building2 size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    Departments
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    {facets ? facets.departments.length : 8} Divisions
                  </div>
                </div>
              </div>

              <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px' }}>
                <div
                  style={{
                    padding: '10px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#FFFBEB',
                    color: '#D97706',
                    display: 'flex',
                  }}
                >
                  <Coins size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    Currencies
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    {facets ? facets.currencies.length : 7} Currencies
                  </div>
                </div>
              </div>
            </div>

            {employeesError && (
              <div className="alert alert-error">
                <span>
                  Unable to load employee compensation records. Please verify connection to the backend.
                </span>
              </div>
            )}

            {/* Filter Bar */}
            <FilterBar
              facets={facets}
              filters={filters}
              onFilterChange={handleFilterChange}
              onReset={handleResetFilters}
              totalResults={employeesData?.pagination.total}
            />

            {/* Employee Directory Table */}
            <EmployeeTable
              employees={employeesData?.employees || []}
              pagination={
                employeesData?.pagination || {
                  total: 0,
                  page: 1,
                  limit: 25,
                  totalPages: 0,
                  hasNext: false,
                  hasPrev: false,
                }
              }
              isLoading={isEmployeesLoading}
              onPageChange={(page) => handleFilterChange({ page })}
              onLimitChange={(limit) => handleFilterChange({ limit, page: 1 })}
              onSortChange={handleSortChange}
              sortBy={filters.sortBy || 'employeeCode'}
              sortOrder={filters.sortOrder || 'asc'}
              onSelectEmployee={(id) => setSelectedEmployeeId(id)}
            />
          </>
        )}
      </main>

      {/* Slide-Over Dossier Drawer */}
      <EmployeeDetailDrawer
        employeeId={selectedEmployeeId}
        open={Boolean(selectedEmployeeId)}
        onClose={() => setSelectedEmployeeId(null)}
      />
    </div>
  );
};

export default App;
