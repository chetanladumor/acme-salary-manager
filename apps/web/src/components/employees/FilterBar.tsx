import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  TextField,
  InputAdornment,
  MenuItem,
  Stack,
  Button,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import FilterListIcon from '@mui/icons-material/FilterList';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { FilterFacets, EmployeeFilterParams } from '../../types';

interface FilterBarProps {
  facets?: FilterFacets;
  filters: EmployeeFilterParams;
  onFilterChange: (newFilters: Partial<EmployeeFilterParams>) => void;
  onReset: () => void;
  totalResults?: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  facets,
  filters,
  onFilterChange,
  onReset,
  totalResults,
}) => {
  const [searchTerm, setSearchTerm] = useState(filters.search || '');

  // Debounce search input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== (filters.search || '')) {
        onFilterChange({ search: searchTerm || undefined, page: 1 });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, filters.search, onFilterChange]);

  const activeFilterCount = [
    filters.search,
    filters.department,
    filters.country,
    filters.status,
    filters.currency,
  ].filter(Boolean).length;

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Stack spacing={2}>
          {/* Top Row: Search and Quick Stats */}
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            justifyContent="space-between"
            alignItems={{ xs: 'stretch', md: 'center' }}
          >
            <TextField
              placeholder="Search by name, employee code (e.g. ACM-00001), or email..."
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ flexGrow: 1, maxWidth: { md: 540 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: searchTerm ? (
                  <InputAdornment position="end">
                    <Button
                      size="small"
                      onClick={() => {
                        setSearchTerm('');
                        onFilterChange({ search: undefined, page: 1 });
                      }}
                      sx={{ minWidth: 'auto', p: 0.5 }}
                    >
                      <ClearIcon fontSize="small" />
                    </Button>
                  </InputAdornment>
                ) : null,
              }}
            />

            <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="flex-end">
              {totalResults !== undefined && (
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Showing <strong style={{ color: '#0F172A' }}>{totalResults.toLocaleString()}</strong> records
                </Typography>
              )}
              {activeFilterCount > 0 && (
                <Button
                  size="small"
                  variant="outlined"
                  color="inherit"
                  startIcon={<RestartAltIcon />}
                  onClick={() => {
                    setSearchTerm('');
                    onReset();
                  }}
                  sx={{ textTransform: 'none', borderColor: '#CBD5E1' }}
                >
                  Reset ({activeFilterCount})
                </Button>
              )}
            </Stack>
          </Stack>

          {/* Bottom Row: Multi-Faceted Filters */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            alignItems="center"
            flexWrap="wrap"
            useFlexGap
          >
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mr: 1 }}>
              <FilterListIcon fontSize="small" color="action" />
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
                Filters:
              </Typography>
            </Stack>

            {/* Department Filter */}
            <TextField
              select
              size="small"
              label="Department"
              value={filters.department || ''}
              onChange={(e) => onFilterChange({ department: e.target.value || undefined, page: 1 })}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="">All Departments</MenuItem>
              {facets?.departments.map((dept) => (
                <MenuItem key={dept} value={dept}>
                  {dept}
                </MenuItem>
              ))}
            </TextField>

            {/* Country Filter */}
            <TextField
              select
              size="small"
              label="Country"
              value={filters.country || ''}
              onChange={(e) => onFilterChange({ country: e.target.value || undefined, page: 1 })}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="">All Countries</MenuItem>
              {facets?.countries.map((c) => (
                <MenuItem key={c.name} value={c.name}>
                  {c.name} ({c.code})
                </MenuItem>
              ))}
            </TextField>

            {/* Employment Status Filter */}
            <TextField
              select
              size="small"
              label="Status"
              value={filters.status || ''}
              onChange={(e) => onFilterChange({ status: (e.target.value as any) || undefined, page: 1 })}
              sx={{ minWidth: 130 }}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="ON_LEAVE">On Leave</MenuItem>
              <MenuItem value="INACTIVE">Inactive (Left)</MenuItem>
            </TextField>

            {/* Currency Filter */}
            <TextField
              select
              size="small"
              label="Currency"
              value={filters.currency || ''}
              onChange={(e) => onFilterChange({ currency: e.target.value || undefined, page: 1 })}
              sx={{ minWidth: 110 }}
            >
              <MenuItem value="">All</MenuItem>
              {facets?.currencies.map((curr) => (
                <MenuItem key={curr} value={curr}>
                  {curr}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};
