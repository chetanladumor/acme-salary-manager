import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Search, X, Filter, RotateCcw, Download, Loader2, HardDriveDownload } from 'lucide-react';
import { RootState } from '../../app/store';
import { FilterFacets, EmployeeFilterParams } from '../../types';
import { useLazyExportEmployeesQuery } from '../../features/api/apiSlice';
import { generateEmployeesCsv, downloadCsv } from '../../utils/csv';

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

  // =========================================================================
  // METHOD 1: CLIENT-SIDE CSV CREATION
  // Fetches JSON array and constructs CSV text via Blob in browser memory.
  // Best suited for standard, filtered page-level exports.
  // =========================================================================
  const [triggerExport, { isFetching: isExporting }] = useLazyExportEmployeesQuery();

  const handleExportCsv = async () => {
    try {
      const data = await triggerExport(filters, true).unwrap();
      if (data && data.length > 0) {
        const csv = generateEmployeesCsv(data);
        downloadCsv(csv);
      }
    } catch (err) {
      console.error('Failed to export employees (client):', err);
    }
  };

  // =========================================================================
  // METHOD 2: BACKEND-GENERATED CSV STREAMING (FOR LARGE DATASETS: 100k - 1M+ ROWS)
  // Backend directly pipes chunked CSV lines into the HTTP response stream.
  // Maintains O(1) constant server memory (~30MB) and prevents browser RAM freeze.
  // =========================================================================
  const authToken = useSelector((state: RootState) => state.auth.token);
  const [isServerStreaming, setIsServerStreaming] = useState(false);

  const handleServerStreamExportCsv = async () => {
    try {
      setIsServerStreaming(true);
      const queryParams = new URLSearchParams();
      if (filters.search) queryParams.set('search', filters.search);
      if (filters.country) queryParams.set('country', filters.country);
      if (filters.department) queryParams.set('department', filters.department);
      if (filters.status) queryParams.set('status', filters.status);
      if (filters.currency) queryParams.set('currency', filters.currency);
      if (filters.minSalary !== undefined) queryParams.set('minSalary', filters.minSalary.toString());
      if (filters.maxSalary !== undefined) queryParams.set('maxSalary', filters.maxSalary.toString());

      const rawApiUrl = (import.meta as any).env?.VITE_API_URL;
      const baseUrl = rawApiUrl
        ? (rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl.replace(/\/$/, '')}/api`)
        : '/api';

      const response = await fetch(`${baseUrl}/employees/export-csv?${queryParams.toString()}`, {
        headers: {
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error(`Server stream export failed with status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const filename = `employees_server_stream_${new Date().toISOString().slice(0, 10)}.csv`;
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to stream server CSV export (large data):', err);
    } finally {
      setIsServerStreaming(false);
    }
  };

  return (
    <div className="card" style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Top Row: Search and Quick Stats */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          {/* Search Box with Icon */}
          <div
            style={{
              position: 'relative',
              flex: '1',
              minWidth: '280px',
              maxWidth: '540px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '12px',
                color: 'var(--text-muted)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              className="input-text"
              placeholder="Search by name, employee code (e.g. ACM-00001), or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '38px',
                paddingRight: searchTerm ? '36px' : '12px',
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  onFilterChange({ search: undefined, page: 1 });
                }}
                className="btn-icon"
                style={{
                  position: 'absolute',
                  right: '6px',
                  padding: '4px',
                }}
                title="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Records Count & Reset Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {totalResults !== undefined && (
              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Showing{' '}
                <strong style={{ color: 'var(--text-main)' }}>
                  {totalResults.toLocaleString()}
                </strong>{' '}
                records
              </span>
            )}

            {/* 1. Client-Side Export (converts JSON payload in browser memory) */}
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={handleExportCsv}
              disabled={isExporting || isServerStreaming || totalResults === 0}
              title="Client-Side Export: Fetches JSON and converts to CSV in browser memory"
            >
              {isExporting ? <Loader2 size={14} className="spin" /> : <Download size={14} />}
              <span>{isExporting ? 'Exporting...' : 'Export CSV (Client)'}</span>
            </button>

            {/* 2. Backend-Generated Streaming Export (optimized for large datasets: 100k - 1M+ rows) */}
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleServerStreamExportCsv}
              disabled={isServerStreaming || isExporting || totalResults === 0}
              title="Server-Side Streaming: Backend streams CSV directly via HTTP chunks to maintain flat O(1) memory (recommended for large datasets 100k+)"
            >
              {isServerStreaming ? <Loader2 size={14} className="spin" /> : <HardDriveDownload size={14} />}
              <span>{isServerStreaming ? 'Streaming...' : 'Server Stream (Large Data)'}</span>
            </button>

            {activeFilterCount > 0 && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setSearchTerm('');
                  onReset();
                }}
              >
                <RotateCcw size={14} />
                <span>Reset ({activeFilterCount})</span>
              </button>
            )}
          </div>
        </div>

        {/* Bottom Row: Multi-Faceted Filters */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            paddingTop: '8px',
            borderTop: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '4px' }}>
            <Filter size={15} color="var(--text-muted)" />
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Filters:
            </span>
          </div>

          {/* Department Filter */}
          <select
            className="select"
            value={filters.department || ''}
            onChange={(e) =>
              onFilterChange({ department: e.target.value || undefined, page: 1 })
            }
            style={{ minWidth: '150px' }}
          >
            <option value="">All Departments</option>
            {facets?.departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          {/* Country Filter */}
          <select
            className="select"
            value={filters.country || ''}
            onChange={(e) =>
              onFilterChange({ country: e.target.value || undefined, page: 1 })
            }
            style={{ minWidth: '150px' }}
          >
            <option value="">All Countries</option>
            {facets?.countries.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>

          {/* Employment Status Filter */}
          <select
            className="select"
            value={filters.status || ''}
            onChange={(e) =>
              onFilterChange({ status: (e.target.value as any) || undefined, page: 1 })
            }
            style={{ minWidth: '130px' }}
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="ON_LEAVE">On Leave</option>
            <option value="INACTIVE">Inactive (Left)</option>
          </select>

          {/* Currency Filter */}
          <select
            className="select"
            value={filters.currency || ''}
            onChange={(e) =>
              onFilterChange({ currency: e.target.value || undefined, page: 1 })
            }
            style={{ minWidth: '110px' }}
          >
            <option value="">All Currencies</option>
            {facets?.currencies.map((curr) => (
              <option key={curr} value={curr}>
                {curr}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
