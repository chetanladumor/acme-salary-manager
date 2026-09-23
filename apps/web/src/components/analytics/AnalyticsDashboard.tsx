import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Stack,
  LinearProgress,
  Chip,
  CircularProgress,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PublicIcon from '@mui/icons-material/Public';
import DomainIcon from '@mui/icons-material/Domain';
import PieChartIcon from '@mui/icons-material/PieChart';
import { useGetAnalyticsQuery } from '../../features/api/apiSlice';
import { formatCurrency, getReasonLabel } from '../../utils/formatters';

export const AnalyticsDashboard: React.FC = () => {
  const { data: analytics, isLoading, error } = useGetAnalyticsQuery();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !analytics) {
    return (
      <Alert severity="error">
        Unable to load workforce compensation analytics. Please verify connection to the server.
      </Alert>
    );
  }

  const { kpis, departments, countries, reasons } = analytics;
  const maxDeptHeadcount = Math.max(...departments.map((d) => d.headcount), 1);

  return (
    <Stack spacing={3}>
      {/* KPI Overview Grid */}
      <Grid container spacing={2}>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: '#EFF6FF', color: '#2563EB', display: 'flex' }}>
                  <PeopleAltIcon />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Total Workforce
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A' }}>
                    {kpis.totalHeadcount.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Across 7 Jurisdictions
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: '#F0FDF4', color: '#16A34A', display: 'flex' }}>
                  <CheckCircleIcon />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Active On Payroll
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#16A34A' }}>
                    {kpis.activeHeadcount.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {((kpis.activeHeadcount / kpis.totalHeadcount) * 100).toFixed(1)}% Active Rate
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: '#FAF5FF', color: '#9333EA', display: 'flex' }}>
                  <TrendingUpIcon />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Salary Actions
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#9333EA' }}>
                    {kpis.totalHistoricalRevisions.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Progression Records
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: '#FFFBEB', color: '#D97706', display: 'flex' }}>
                  <PublicIcon />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Operating Regions
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#D97706' }}>
                    {kpis.countriesCount} Countries
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    7 Global Currencies
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Row 2: Department Pay Distribution & Change Drivers */}
      <Grid container spacing={3}>
        {/* Department Distribution */}
        <Grid item xs={12} lg={7}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
                <DomainIcon color="primary" />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Department Compensation & Headcount
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Workforce density and comparative average compensation by division
                  </Typography>
                </Box>
              </Stack>

              <Stack spacing={2.5}>
                {departments.map((dept) => {
                  const percentOfMax = (dept.headcount / maxDeptHeadcount) * 100;
                  const percentOfTotal = ((dept.headcount / kpis.totalHeadcount) * 100).toFixed(1);

                  return (
                    <Box key={dept.department}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E293B' }}>
                            {dept.department}
                          </Typography>
                          <Chip
                            label={`${dept.headcount.toLocaleString()} (${percentOfTotal}%)`}
                            size="small"
                            sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600, bgcolor: '#F1F5F9' }}
                          />
                        </Stack>

                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                          Avg: {formatCurrency(dept.avgSalary, 'USD')}
                        </Typography>
                      </Stack>

                      <LinearProgress
                        variant="determinate"
                        value={percentOfMax}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: '#E2E8F0',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                            bgcolor: 'primary.main',
                          },
                        }}
                      />

                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          Min: {formatCurrency(dept.minSalary, 'USD')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Max: {formatCurrency(dept.maxSalary, 'USD')}
                        </Typography>
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Compensation Change Reasons Breakdown */}
        <Grid item xs={12} lg={5}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
                <PieChartIcon color="secondary" />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Compensation Change Drivers
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Historical allocation of raises and adjustments
                  </Typography>
                </Box>
              </Stack>

              <Stack spacing={2}>
                {reasons.map((r) => (
                  <Paper
                    key={r.reason}
                    variant="outlined"
                    sx={{ p: 2, borderRadius: 2, bgcolor: '#F8FAFC' }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                          {getReasonLabel(r.reason)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {r.count.toLocaleString()} actions recorded
                        </Typography>
                      </Box>
                      <Chip
                        label={r.percentage}
                        color="secondary"
                        size="small"
                        sx={{ fontWeight: 700 }}
                      />
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Row 3: Geographic Jurisdictions Table */}
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
            <PublicIcon color="primary" />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Geographic Compensation & Currency Parity
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Regional headcounts and localized currency compensation figures
              </Typography>
            </Box>
          </Stack>

          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
            <Table size="medium">
              <TableHead>
                <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Country</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Currency</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Headcount</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>% of Workforce</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Average Salary</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Salary Range (Min – Max)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {countries.map((c) => {
                  const pct = ((c.headcount / kpis.totalHeadcount) * 100).toFixed(1);
                  return (
                    <TableRow key={c.country} hover>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {c.country}
                          </Typography>
                          <Chip
                            label={c.countryCode}
                            size="small"
                            sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600, bgcolor: '#F1F5F9' }}
                          />
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={c.currency}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ fontWeight: 700, height: 22 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {c.headcount.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="text.secondary">
                          {pct}%
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                          {formatCurrency(c.avgSalary, c.currency)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="text.secondary">
                          {formatCurrency(c.minSalary, c.currency)} – {formatCurrency(c.maxSalary, c.currency)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Stack>
  );
};
