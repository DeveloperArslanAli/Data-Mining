import React from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Column<T = any> {
  key: string;
  header: string;
  accessor: (item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  className?: string;
}

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export interface TableProps<T = any> {
  data: T[];
  columns: Column<T>[];
  sortConfig?: SortConfig;
  onSort?: (key: string) => void;
  pagination?: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (pageSize: number) => void;
  };
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  onRowClick?: (item: T) => void;
  selectedRows?: string[];
  onRowSelect?: (item: T, selected: boolean) => void;
  selectable?: boolean;
}

export interface TableHeaderProps {
  children: React.ReactNode;
  sortable?: boolean;
  sortDirection?: 'asc' | 'desc';
  onClick?: () => void;
  className?: string;
  width?: string;
}

export interface TableRowProps {
  children: React.ReactNode;
  onClick?: () => void;
  selected?: boolean;
  className?: string;
}

const TableHeader: React.FC<TableHeaderProps> = ({
  children,
  sortable,
  sortDirection,
  onClick,
  className,
  width,
}) => {
  return (
    <th
      className={cn(
        'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
        'border-b border-gray-200 bg-gray-50',
        {
          'cursor-pointer hover:bg-gray-100': sortable,
        },
        className
      )}
      style={{ width }}
      onClick={sortable ? onClick : undefined}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        {sortable && (
          <div className="flex flex-col">
            <ChevronUp
              size={12}
              className={cn(
                'transition-colors',
                sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-300'
              )}
            />
            <ChevronDown
              size={12}
              className={cn(
                'transition-colors -mt-1',
                sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-300'
              )}
            />
          </div>
        )}
      </div>
    </th>
  );
};

const TableRow: React.FC<TableRowProps> = ({
  children,
  onClick,
  selected,
  className,
}) => {
  return (
    <tr
      className={cn(
        'border-b border-gray-200 hover:bg-gray-50 transition-colors',
        {
          'cursor-pointer': onClick,
          'bg-blue-50 border-blue-200': selected,
        },
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
};

function Table<T = any>({
  data,
  columns,
  sortConfig,
  onSort,
  pagination,
  loading = false,
  emptyMessage = 'No data available',
  className,
  onRowClick,
  selectedRows = [],
  onRowSelect,
  selectable = false,
}: TableProps<T>) {
  const handleSort = (key: string) => {
    if (onSort) {
      onSort(key);
    }
  };

  const getRowKey = (item: T, index: number) => {
    // Try to find an id field, otherwise use index
    return (item as any).id || (item as any)._id || index;
  };

  const isRowSelected = (item: T) => {
    const key = getRowKey(item, 0);
    return selectedRows.includes(String(key));
  };

  const handleRowSelect = (item: T, selected: boolean) => {
    if (onRowSelect) {
      onRowSelect(item, selected);
    }
  };

  if (loading) {
    return (
      <div className={cn('animate-pulse', className)}>
        <div className="bg-gray-200 h-8 rounded mb-4"></div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-gray-200 h-12 rounded mb-2"></div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {selectable && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={data.length > 0 && data.every(isRowSelected)}
                    onChange={(e) => {
                      data.forEach((item) => {
                        handleRowSelect(item, e.target.checked);
                      });
                    }}
                  />
                </th>
              )}
              {columns.map((column) => (
                <TableHeader
                  key={column.key}
                  sortable={column.sortable}
                  sortDirection={
                    sortConfig?.key === column.key ? sortConfig.direction : undefined
                  }
                  onClick={() => column.sortable && handleSort(column.key)}
                  className={column.className}
                  width={column.width}
                >
                  {column.header}
                </TableHeader>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <TableRow
                  key={getRowKey(item, index)}
                  onClick={onRowClick ? () => onRowClick(item) : undefined}
                  selected={isRowSelected(item)}
                >
                  {selectable && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={isRowSelected(item)}
                        onChange={(e) => handleRowSelect(item, e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        'px-6 py-4 whitespace-nowrap text-sm text-gray-900',
                        column.className
                      )}
                    >
                      {column.accessor(item)}
                    </td>
                  ))}
                </TableRow>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">
                  {(pagination.currentPage - 1) * pagination.pageSize + 1}
                </span>{' '}
                to{' '}
                <span className="font-medium">
                  {Math.min(
                    pagination.currentPage * pagination.pageSize,
                    pagination.totalItems
                  )}
                </span>{' '}
                of <span className="font-medium">{pagination.totalItems}</span>{' '}
                results
              </p>
            </div>
            <div>
              <nav
                className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                aria-label="Pagination"
              >
                <button
                  onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                
                {[...Array(pagination.totalPages)].map((_, i) => {
                  const page = i + 1;
                  const isCurrent = page === pagination.currentPage;
                  
                  return (
                    <button
                      key={page}
                      onClick={() => pagination.onPageChange(page)}
                      className={cn(
                        'relative inline-flex items-center px-4 py-2 border text-sm font-medium',
                        {
                          'z-10 bg-blue-50 border-blue-500 text-blue-600': isCurrent,
                          'bg-white border-gray-300 text-gray-500 hover:bg-gray-50': !isCurrent,
                        }
                      )}
                    >
                      {page}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { Table, TableHeader, TableRow };
