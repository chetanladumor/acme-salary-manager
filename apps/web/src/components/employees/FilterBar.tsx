import React, { useState, useEffect } from 'react';
import { Search, X, Filter, RotateCcw } from 'lucide-react';
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
