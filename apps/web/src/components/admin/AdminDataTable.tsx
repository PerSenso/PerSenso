'use client';

import { useState } from 'react';
import { ChevronUp, ChevronDown, Search, X } from 'lucide-react';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
}

interface AdminDataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  // Search
  searchable?: boolean;
  searchPlaceholder?: string;
  searchKeys?: string[];        // dot-path keys, e.g. ['client.name', 'product.name']
  // External filter (chip filters managed by parent)
  filterFn?: (item: T) => boolean;
}

function getByPath(obj: unknown, path: string): string {
  const val = path.split('.').reduce<unknown>((acc, key) => {
    if (acc != null && typeof acc === 'object') return (acc as Record<string, unknown>)[key];
    return null;
  }, obj);
  return val == null ? '' : String(val);
}

export function AdminDataTable<T>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  emptyMessage = 'Sin datos',
  searchable,
  searchPlaceholder = 'Buscar…',
  searchKeys,
  filterFn,
}: AdminDataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  // 1. Sort
  const sorted = sortKey
    ? [...data].sort((a, b) => {
        const aVal = (a as Record<string, unknown>)[sortKey];
        const bVal = (b as Record<string, unknown>)[sortKey];
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return sortDir === 'asc' ? cmp : -cmp;
      })
    : data;

  // 2. Text search
  const searched =
    searchable && searchQuery.trim() && searchKeys?.length
      ? sorted.filter((item) =>
          searchKeys.some((key) =>
            getByPath(item, key).toLowerCase().includes(searchQuery.toLowerCase()),
          ),
        )
      : sorted;

  // 3. External filter
  const filtered = filterFn ? searched.filter(filterFn) : searched;

  const showCount = (searchable && searchQuery.trim()) || filterFn;

  return (
    <div className="card-persenso overflow-hidden">
      {/* Search bar */}
      {searchable && (
        <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--ps-border)' }}>
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
              style={{ color: 'var(--ps-text-muted)' }}
            />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-9 py-2 rounded-lg text-sm"
              style={{
                background: 'var(--ps-input-bg)',
                border: '1px solid var(--ps-input-border)',
                color: 'var(--ps-input-text)',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--ps-text-muted)' }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Table or empty state */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center" style={{ color: 'var(--ps-text-muted)' }}>
          <p className="text-sm">
            {searchQuery ? `Sin resultados para "${searchQuery}"` : emptyMessage}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          {/* Result count when filtering */}
          {showCount && (
            <div className="px-4 pt-2.5 pb-0">
              <span className="text-[10px] font-medium" style={{ color: 'var(--ps-text-muted)' }}>
                {filtered.length} de {data.length} registros
              </span>
            </div>
          )}
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--ps-border)' }}>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-4 py-3 text-[10px] font-bold uppercase tracking-widest ${
                      col.sortable ? 'cursor-pointer select-none' : ''
                    }`}
                    style={{
                      color: sortKey === col.key ? 'var(--ps-gold)' : 'var(--ps-text-muted)',
                      textAlign: col.align || 'left',
                    }}
                    onClick={() => col.sortable && handleSort(col.key)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.header}
                      {col.sortable && (
                        <span style={{ opacity: sortKey === col.key ? 1 : 0.3 }}>
                          {sortKey === col.key && sortDir === 'desc' ? (
                            <ChevronDown className="w-3 h-3" />
                          ) : (
                            <ChevronUp className="w-3 h-3" />
                          )}
                        </span>
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, idx) => (
                <tr
                  key={keyExtractor(item)}
                  className={`transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                  style={{
                    borderBottom: idx < filtered.length - 1 ? '1px solid var(--ps-border)' : 'none',
                  }}
                  onClick={() => onRowClick?.(item)}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'var(--ps-surface-hover)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="px-4 py-3 text-sm"
                      style={{ color: 'var(--ps-text)', textAlign: col.align || 'left' }}
                    >
                      {col.render
                        ? col.render(item)
                        : String((item as Record<string, unknown>)[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
