/**
 * Data Mining Platform - Datasets Page
 */

import React, { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  Database,
  Search,
  Filter,
  Plus,
  Download,
  Trash2,
  Eye,
  Edit,
  MoreHorizontal,
  Upload,
  FileText,
  Calendar,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
} from 'lucide-react';

// Components
import { Button } from '@/components/ui/Button';

// Hooks
import { useAuthStore } from '@/store/auth';

// Types
import { Dataset, DatasetStatus, DatasetFormat, DatasetList } from '@/types';

// Utils
import { formatFileSize, formatDate, cn } from '@/lib/utils';
import api from '@/lib/api';

export default function DatasetsPage() {
  const { user } = useAuthStore();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<DatasetStatus | 'all'>('all');
  const [formatFilter, setFormatFilter] = useState<DatasetFormat | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDatasets, setSelectedDatasets] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Helpers to map backend snake_case enums/fields to UI labels and TS enums
  const statusToLabel = (status: DatasetStatus | string) => {
    const s = String(status).toLowerCase();
    switch (s) {
      case 'cleaned':
        return 'CLEANED';
      case 'processing':
        return 'PROCESSING';
      case 'uploaded':
        return 'UPLOADED';
      case 'error':
        return 'ERROR';
      case 'exported':
        return 'CLEANED';
      default:
        return (status as string).toUpperCase();
    }
  };

  const formatToLabel = (format: DatasetFormat | string) => String(format).toUpperCase();

  // Fetch datasets from API
  useEffect(() => {
    let ignore = false;
    async function fetchDatasets() {
      setLoading(true);
      setError(null);
      try {
        const res: DatasetList = await api.getDatasets({ page: currentPage, size: itemsPerPage, search: searchTerm || undefined });
        if (ignore) return;
        // The backend returns snake_case fields; keep as-is because our Dataset type already uses snake_case
        setDatasets(res.datasets || []);
        setTotalPages(res.pages || 1);
        setTotalCount(res.total || (res.datasets?.length ?? 0));
      } catch (e: any) {
        if (ignore) return;
        setError(e?.message || 'Failed to load datasets');
        setDatasets([]);
        setTotalPages(1);
        setTotalCount(0);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    fetchDatasets();
    return () => {
      ignore = true;
    };
  }, [currentPage, itemsPerPage, searchTerm]);

  const getStatusIcon = (status: string) => {
    switch (String(status).toLowerCase()) {
      case 'cleaned':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'uploaded':
        return <Upload className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Database className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (String(status).toLowerCase()) {
      case 'cleaned':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'processing':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      case 'uploaded':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'error':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getFormatIcon = (format: string) => {
    switch (String(format).toLowerCase()) {
      case 'csv':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'xlsx':
        return <FileText className="w-4 h-4 text-green-500" />;
      case 'json':
        return <FileText className="w-4 h-4 text-purple-500" />;
      case 'xml':
        return <FileText className="w-4 h-4 text-orange-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const computeQualityScore = (d: Dataset): number => {
    if (!d.row_count || !d.column_count) return 0;
    let score = 100;
    const totalCells = d.row_count * d.column_count;
    const missing = d.missing_values_count ? Object.values(d.missing_values_count).reduce((a, b) => a + (b || 0), 0) : 0;
    const missingPct = totalCells ? (missing / totalCells) * 100 : 0;
    score -= missingPct * 0.5;
    const dup = d.duplicate_rows_count || 0;
    const dupPct = d.row_count ? (dup / d.row_count) * 100 : 0;
    score -= dupPct * 0.3;
    return Math.max(0, Math.min(100, Number.isFinite(score) ? score : 0));
  };

  // Client-side filter for status/format; server already paginates
  const filteredDatasets = useMemo(() => {
    return datasets.filter((dataset) => {
      const matchesStatus = statusFilter === 'all' || String(dataset.status).toLowerCase() === String(statusFilter).toLowerCase();
      const matchesFormat = formatFilter === 'all' || String(dataset.format).toLowerCase() === String(formatFilter).toLowerCase();
      return matchesStatus && matchesFormat;
    });
  }, [datasets, statusFilter, formatFilter]);

  const paginatedDatasets = filteredDatasets; // already paginated by API

  const handleSelectAll = () => {
    if (selectedDatasets.length === paginatedDatasets.length) {
      setSelectedDatasets([]);
    } else {
      setSelectedDatasets(paginatedDatasets.map(d => d.id));
    }
  };

  const handleSelectDataset = (datasetId: number) => {
    setSelectedDatasets(prev => 
      prev.includes(datasetId) 
        ? prev.filter(id => id !== datasetId)
        : [...prev, datasetId]
    );
  };

  const handleDeleteSelected = () => {
    // TODO: Implement bulk delete
    console.log('Deleting datasets:', selectedDatasets);
    setSelectedDatasets([]);
  };

  const handleExportSelected = () => {
    // TODO: Implement bulk export
    console.log('Exporting datasets:', selectedDatasets);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Datasets - Data Mining Platform</title>
        <meta name="description" content="Manage your datasets" />
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Datasets</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage and organize your data mining datasets
            </p>
          </div>
          <div className="flex space-x-3">
            <Link href="/datasets/upload">
              <Button leftIcon={<Plus className="w-4 h-4" />}>
                Upload Dataset
              </Button>
            </Link>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search datasets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <Button
              variant="outline"
              leftIcon={<Filter className="w-4 h-4" />}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filters
            </Button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as DatasetStatus | 'all')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="all">All Status</option>
                    <option value="uploaded">Uploaded</option>
                    <option value="processing">Processing</option>
                    <option value="cleaned">Cleaned</option>
                    <option value="error">Error</option>
                  </select>
                </div>

                {/* Format Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Format
                  </label>
                  <select
                    value={formatFilter}
                    onChange={(e) => setFormatFilter(e.target.value as DatasetFormat | 'all')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="all">All Formats</option>
                    <option value="csv">CSV</option>
                    <option value="xlsx">XLSX</option>
                    <option value="json">JSON</option>
                    <option value="xml">XML</option>
                  </select>
                </div>

                {/* Clear Filters */}
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStatusFilter('all');
                      setFormatFilter('all');
                      setSearchTerm('');
                    }}
                    leftIcon={<X className="w-4 h-4" />}
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bulk Actions */}
        {selectedDatasets.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700 dark:text-blue-300">
                {selectedDatasets.length} dataset(s) selected
              </span>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Download className="w-4 h-4" />}
                  onClick={handleExportSelected}
                >
                  Export Selected
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  leftIcon={<Trash2 className="w-4 h-4" />}
                  onClick={handleDeleteSelected}
                >
                  Delete Selected
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Datasets Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedDatasets.length === paginatedDatasets.length && paginatedDatasets.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Dataset
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Format
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Quality
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Updated
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedDatasets.map((dataset) => (
                  <tr key={dataset.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedDatasets.includes(dataset.id)}
                        onChange={() => handleSelectDataset(dataset.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {dataset.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {dataset.description}
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          {dataset.row_count?.toLocaleString()} rows × {dataset.column_count ?? 0} columns
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(dataset.status as string)}
                        <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(dataset.status as string)}`}>
                          {statusToLabel(dataset.status)}
                        </span>
                      </div>
                      {dataset.error_message && (
                        <div className="text-xs text-red-500 mt-1">{dataset.error_message}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getFormatIcon(dataset.format as string)}
                        <span className="ml-2 text-sm text-gray-900 dark:text-white">
                          {formatToLabel(dataset.format)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatFileSize(dataset.file_size)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                          <div
                            className={cn(
                              'h-2 rounded-full transition-all',
                              computeQualityScore(dataset) >= 90 ? 'bg-green-500' :
                              computeQualityScore(dataset) >= 70 ? 'bg-yellow-500' :
                              'bg-red-500'
                            )}
                            style={{ width: `${computeQualityScore(dataset)}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-900 dark:text-white">
                          {computeQualityScore(dataset).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(dataset.updated_at || dataset.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          href={`/datasets/${dataset.id}`}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/datasets/${dataset.id}/edit`}
                          className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => console.log('Download dataset', dataset.id)}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => console.log('Delete dataset', dataset.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Showing{' '}
                      <span className="font-medium">{(currentPage - 1) * itemsPerPage + (filteredDatasets.length > 0 ? 1 : 0)}</span>
                      {' '}to{' '}
                      <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalCount)}</span>
                      {' '}of{' '}
                      <span className="font-medium">{totalCount}</span>
                      {' '}results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={cn(
                            'relative inline-flex items-center px-4 py-2 border text-sm font-medium',
                            page === currentPage
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          )}
                        >
                          {page}
                        </button>
                      ))}
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Empty State */}
        {(!loading && filteredDatasets.length === 0) && (
          <div className="text-center py-12">
            <Database className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No datasets found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm || statusFilter !== 'all' || formatFilter !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'Get started by uploading your first dataset.'}
            </p>
            <div className="mt-6">
              <Link href="/datasets/upload">
                <Button leftIcon={<Plus className="w-4 h-4" />}>
                  Upload Dataset
                </Button>
              </Link>
            </div>
          </div>
        )}
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Failed to load datasets</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
