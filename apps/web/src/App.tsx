import React, { useState } from 'react';
import {
  Container,
  Box,
  Stack,
  Typography,
  Grid,
  Card,
  CardContent,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import PublicIcon from '@mui/icons-material/Public';
import DomainIcon from '@mui/icons-material/Domain';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import BarChartIcon from '@mui/icons-material/BarChart';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import { useSelector } from 'react-redux';
import { RootState } from './app/store';
import {
  useGetEmployeesQuery,
  useGetFacetsQuery,
} from './features/api/apiSlice';
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
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Executive Navbar */}
      <Navbar
        onOpenLogin={() => {}}
        totalEmployees={employeesData?.pagination.total}
      />

      <Container maxWidth="xl" sx={{ py: 4, px: { xs: 2, sm: 3, md: 4 } }}>
        <Stack spacing={3}>
          {/* Header Row: Title & Navigation View Switcher */}
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems={{ md: 'center' }}
            spacing={2}
          >
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
                {activeTab === 'directory' ? 'Workforce Compensation Directory' : 'Executive Compensation Analytics'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {activeTab === 'directory'
                  ? 'Centralized HR compensation management across global jurisdictions.'
                  : 'Real-time organization-wide pay parity, departmental budgets, and growth metrics.'}
              </Typography>
            </Box>

            {/* View Switcher Tabs */}
            <Tabs
              value={activeTab}
              onChange={(_, newVal) => setActiveTab(newVal)}
              sx={{
                bgcolor: '#E2E8F0',
                borderRadius: 2,
                p: 0.5,
                minHeight: 'auto',
                '& .MuiTabs-indicator': { display: 'none' },
              }}
            >
              <Tab
                value="directory"
                label="Directory"
                icon={<FormatListBulletedIcon fontSize="small" />}
                iconPosition="start"
                sx={{
                  borderRadius: 1.5,
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  minHeight: 36,
                  py: 0.5,
                  px: 2,
                  textTransform: 'none',
                  '&.Mui-selected': {
                    bgcolor: '#FFFFFF',
                    color: 'primary.main',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  },
                }}
              />
              <Tab
                value="analytics"
                label="Analytics & KPIs"
                icon={<BarChartIcon fontSize="small" />}
                iconPosition="start"
                sx={{
                  borderRadius: 1.5,
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  minHeight: 36,
                  py: 0.5,
                  px: 2,
                  textTransform: 'none',
                  '&.Mui-selected': {
                    bgcolor: '#FFFFFF',
                    color: 'primary.main',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  },
                }}
              />
            </Tabs>
          </Stack>

          {/* Conditional View Rendering */}
          {activeTab === 'analytics' ? (
            <AnalyticsDashboard />
          ) : (
            <>
              {/* Quick Metrics Bar */}
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Card>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: '#EFF6FF', color: '#2563EB', display: 'flex' }}>
                          <PeopleAltIcon fontSize="small" />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                            Total Headcount
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
                            {employeesData ? employeesData.pagination.total.toLocaleString() : '10,000'}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={6} sm={3}>
                  <Card>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: '#F0FDF4', color: '#16A34A', display: 'flex' }}>
                          <PublicIcon fontSize="small" />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                            Global Regions
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
                            {facets ? facets.countries.length : 7} Countries
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={6} sm={3}>
                  <Card>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: '#FAF5FF', color: '#9333EA', display: 'flex' }}>
                          <DomainIcon fontSize="small" />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                            Departments
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
                            {facets ? facets.departments.length : 8} Divisions
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={6} sm={3}>
                  <Card>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: '#FFFBEB', color: '#D97706', display: 'flex' }}>
                          <AccountBalanceWalletIcon fontSize="small" />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                            Currencies
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
                            {facets ? facets.currencies.length : 7} Currencies
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {employeesError && (
                <Alert severity="error">
                  Unable to load employee compensation records. Please verify connection to the backend.
                </Alert>
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
        </Stack>
      </Container>

      {/* Slide-Over Dossier Drawer */}
      <EmployeeDetailDrawer
        employeeId={selectedEmployeeId}
        open={Boolean(selectedEmployeeId)}
        onClose={() => setSelectedEmployeeId(null)}
      />
    </Box>
  );
};

export default App;
