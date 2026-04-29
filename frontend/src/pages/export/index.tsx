/**
 * Data Mining Platform - Data Export Dashboard
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Download,
  Database,
  FileText,
  FileSpreadsheet,
  FileCode,
  FileJson,
  FileArchive,
  Settings,
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  Plus,
  RefreshCw,
  Eye,
  Filter,
  ArrowDown,
  Info,
  Zap,
  Target,
  TrendingUp,
  Activity,
  Calendar,
  HardDrive,
  BarChart3,
  Search,
  SortAsc,
  SortDesc,
  X,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
} from 'lucide-react';

// Components
import { Button } from '@/components/ui/Button';

// Hooks
import { useAuthStore } from '@/store/auth';

// Types
import { Dataset, ExportJob, ExportFormat, ExportJobStatus, DatasetList } from '@/types';

// Utils
import { formatDate, formatFileSize, cn } from '@/lib/utils';
import api from '@/lib/api';

export default function DataExportPage() {
  const router = useRouter();
  const { dataset: datasetId } = router.query;
  const { user } = useAuthStore();
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'jobs' | 'templates' | 'history'>('overview');
  const [showNewExport, setShowNewExport] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('csv' as ExportFormat);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [ds, jobs] = await Promise.all([
          api.getDatasets({ page: 1, size: 50 }),
          api.getExportJobs(),
        ]);
        if (ignore) return;
        setDatasets(ds.datasets || []);
        setExportJobs(jobs || []);
        if (datasetId) {
          const match = (ds.datasets || []).find(d => d.id === Number(datasetId));
          setSelectedDataset(match || null);
        }
      } catch (e: any) {
        if (ignore) return;
        setError(e?.message || 'Failed to load export data');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, [datasetId]);

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

  const getStatusIcon = (status: ExportJobStatus | string) => {
    switch (String(status).toLowerCase()) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'processing':
        return <Clock className="w-5 h-5 text-blue-500 animate-pulse" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Settings className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: ExportJobStatus | string) => {
    switch (String(status).toLowerCase()) {
      case 'completed':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'processing':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'failed':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getFormatIcon = (format: ExportFormat | string) => {
    switch (String(format).toLowerCase()) {
      case 'csv':
        return <FileText className="w-6 h-6 text-blue-500" />;
      case 'xlsx':
        return <FileSpreadsheet className="w-6 h-6 text-green-500" />;
      case 'json':
        return <FileJson className="w-6 h-6 text-yellow-500" />;
      case 'xml':
        return <FileCode className="w-6 h-6 text-purple-500" />;
      case 'parquet':
        return <FileArchive className="w-6 h-6 text-orange-500" />;
      case 'sql':
        return <Database className="w-6 h-6 text-indigo-500" />;
      default:
        return <FileText className="w-6 h-6 text-gray-500" />;
    }
  };

  const getFormatInfo = (format: ExportFormat) => {
    switch (String(format).toLowerCase() as ExportFormat) {
      case 'csv':
        return {
          name: 'CSV (Comma Separated Values)',
          description: 'Standard CSV format for spreadsheet applications',
          bestFor: 'Excel, Google Sheets, data analysis tools',
          compression: 'None',
        };
      case 'xlsx':
        return {
          name: 'Excel (XLSX)',
          description: 'Microsoft Excel format with multiple sheets',
          bestFor: 'Excel, data presentation, reports',
          compression: 'Built-in',
        };
      case 'json':
        return {
          name: 'JSON (JavaScript Object Notation)',
          description: 'Structured data format for APIs and web applications',
          bestFor: 'Web applications, APIs, data exchange',
          compression: 'None',
        };
      case 'xml':
        return {
          name: 'XML (Extensible Markup Language)',
          description: 'Markup language for structured data',
          bestFor: 'Enterprise systems, data integration',
          compression: 'None',
        };
      case 'parquet':
        return {
          name: 'Parquet',
          description: 'Columnar storage format for big data processing',
          bestFor: 'Big data, analytics, data warehouses',
          compression: 'High',
        };
      case 'sql':
        return {
          name: 'SQL',
          description: 'SQL INSERT statements with database schema',
          bestFor: 'Database imports, data migration',
          compression: 'None',
        };
      default:
        return {
          name: 'Unknown Format',
          description: 'Unknown export format',
          bestFor: 'Unknown',
          compression: 'Unknown',
        };
    }
  };

  const handleQuickExport = async () => {
    if (!selectedDataset) return;
    await api.quickExport(selectedDataset.id, selectedFormat);
    const jobs = await api.getExportJobs();
    setExportJobs(jobs || []);
  };

  const handleStartExport = async () => {
    if (!selectedDataset) return;
    await api.startExportJob({ dataset_id: selectedDataset.id, export_format: selectedFormat });
    const jobs = await api.getExportJobs();
    setExportJobs(jobs || []);
  };

  const handleDownloadExport = async (jobId: number) => {
    const res = await api.downloadExport(jobId);
    if (res?.download_url) {
      window.open(res.download_url, '_blank');
    }
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
        <title>Data Export - Data Mining Platform</title>
        <meta name="description" content="Export your datasets in various formats" />
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Data Export</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Export your datasets in various formats for analysis and sharing
            </p>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Refresh
            </Button>
            <Button
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setShowNewExport(true)}
            >
              New Export
            </Button>
          </div>
        </div>

        {/* Dataset Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Select Dataset</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/datasets')}
            >
              View All Datasets
            </Button>
          </div>

          {datasets.length === 0 ? (
            <div className="text-center py-8">
              <Database className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No datasets available</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Upload a dataset to start export operations.
              </p>
              <div className="mt-4">
                <Link href="/datasets/upload">
                  <Button leftIcon={<Plus className="w-4 h-4" />}>
                    Upload Dataset
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {datasets.map((dataset) => (
                <div
                  key={dataset.id}
                  className={cn(
                    'border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md',
                    selectedDataset?.id === dataset.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  )}
                  onClick={() => setSelectedDataset(dataset)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        {dataset.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {dataset.description}
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>{dataset.row_count?.toLocaleString()} rows</span>
                        <span>{dataset.column_count ?? 0} columns</span>
                        <span>{String(dataset.format).toUpperCase()}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-12 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
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
                      <span className="text-xs font-medium">
                        {computeQualityScore(dataset).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedDataset && (
          <>
            {/* Export Configuration */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Export Configuration - {selectedDataset.name}
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/datasets/${selectedDataset.id}`)}
                >
                  View Dataset
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Format Selection */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Export Format</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {(['csv', 'xlsx', 'json', 'xml', 'parquet', 'sql'] as ExportFormat[]).map((format) => (
                      <div
                        key={format}
                        className={cn(
                          'border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md',
                          selectedFormat === format
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        )}
                        onClick={() => setSelectedFormat(format)}
                      >
                        <div className="flex items-center space-x-3">
                          {getFormatIcon(format)}
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                              {getFormatInfo(format).name}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {getFormatInfo(format).description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Format Details */}
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Format Details
                    </h4>
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex justify-between">
                        <span>Best for:</span>
                        <span>{getFormatInfo(selectedFormat).bestFor}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Compression:</span>
                        <span>{getFormatInfo(selectedFormat).compression}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Estimated size:</span>
                        <span>{formatFileSize(selectedDataset.file_size)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Export Options */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Export Options</h3>
                  
                  {/* Quick Export */}
                  <div className="mb-6">
                    <Button
                      className="w-full h-auto p-4 flex-col items-center"
                      leftIcon={<Zap className="w-6 h-6" />}
                      onClick={handleQuickExport}
                    >
                      <span className="font-medium">Quick Export</span>
                      <span className="text-sm opacity-75">Export with default settings</span>
                    </Button>
                  </div>

                  {/* Advanced Options Toggle */}
                  <div className="mb-4">
                    <button
                      onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                      className="flex items-center justify-between w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Advanced Options
                      </span>
                      {showAdvancedOptions ? (
                        <ChevronUp className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                  </div>

                  {/* Advanced Options */}
                  {showAdvancedOptions && (
                    <div className="space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      {/* Column Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Include Columns
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {['id', 'name', 'email', 'age', 'city', 'purchase_amount', 'rating', 'date'].map((column) => (
                            <label key={column} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                defaultChecked
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">{column}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Row Limit */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Row Limit
                        </label>
                        <input
                          type="number"
                          placeholder="All rows"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>

                      {/* Sorting */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Sort By
                        </label>
                        <div className="flex space-x-2">
                          <select className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white">
                            <option>id</option>
                            <option>name</option>
                            <option>date</option>
                            <option>purchase_amount</option>
                          </select>
                          <button className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700">
                            <SortAsc className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Filters */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Filters
                        </label>
                        <div className="space-y-2">
                          <div className="flex space-x-2">
                            <select className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white">
                              <option>purchase_amount</option>
                              <option>age</option>
                              <option>rating</option>
                            </select>
                            <select className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white">
                              <option>&gt;</option>
                              <option>&lt;</option>
                              <option>=</option>
                              <option>!=</option>
                            </select>
                            <input
                              type="text"
                              placeholder="Value"
                              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Start Export Button */}
                  <div className="mt-6">
                    <Button
                      className="w-full"
                      leftIcon={<Play className="w-4 h-4" />}
                      onClick={handleStartExport}
                    >
                      Start Export
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex space-x-8 px-6">
                  {[
                    { id: 'overview', name: 'Overview', icon: BarChart3 },
                    { id: 'jobs', name: 'Export Jobs', icon: Activity },
                    { id: 'templates', name: 'Templates', icon: FileText },
                    { id: 'history', name: 'History', icon: Clock },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={cn(
                          'flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                          activeTab === tab.id
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{tab.name}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="p-6">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <div className="flex items-center">
                          <Download className="w-8 h-8 text-blue-500" />
                          <div className="ml-3">
                            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Total Exports</p>
                            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                              {exportJobs.length}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <div className="flex items-center">
                          <CheckCircle className="w-8 h-8 text-green-500" />
                          <div className="ml-3">
                            <p className="text-sm font-medium text-green-800 dark:text-green-200">Completed</p>
                            <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                              {exportJobs.filter(job => String(job.status).toLowerCase() === 'completed').length}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                        <div className="flex items-center">
                          <Clock className="w-8 h-8 text-yellow-500" />
                          <div className="ml-3">
                            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">In Progress</p>
                            <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                              {exportJobs.filter(job => String(job.status).toLowerCase() === 'processing').length}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                        <div className="flex items-center">
                          <HardDrive className="w-8 h-8 text-purple-500" />
                          <div className="ml-3">
                            <p className="text-sm font-medium text-purple-800 dark:text-purple-200">Total Size</p>
                            <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                              {formatFileSize(exportJobs.reduce((sum, job) => sum + (job.file_size || 0), 0))}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Recent Exports */}
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Recent Exports</h3>
                        <div className="space-y-3">
                          {exportJobs.slice(0, 3).map((job) => (
                            <div
                              key={job.id}
                              className="flex items-center justify-between p-3 bg-white dark:bg-gray-600 rounded-lg"
                            >
                              <div className="flex items-center space-x-3">
                                {getFormatIcon(job.export_format)}
                                <div>
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {job.name}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {formatDate(job.created_at)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {getStatusIcon(job.status)}
                                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(job.status)}`}>
                                  {job.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setActiveTab('history')}
                          >
                            View All Exports
                          </Button>
                        </div>
                      </div>

                      {/* Export Statistics */}
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Export Statistics</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Most Popular Format</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">CSV</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Average Export Time</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">45s</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Success Rate</span>
                            <span className="text-sm font-medium text-green-600">98.5%</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Total Data Exported</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {formatFileSize(exportJobs.reduce((sum, job) => sum + (job.file_size || 0), 0))}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Export Jobs Tab */}
                {activeTab === 'jobs' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">Export Jobs</h3>
                      <Button
                        leftIcon={<Plus className="w-4 h-4" />}
                        onClick={() => setShowNewExport(true)}
                      >
                        New Export
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {exportJobs.map((job) => (
                        <div
                          key={job.id}
                          className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {getFormatIcon(job.export_format)}
                              <div>
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                  {job.name}
                                </h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {job.description}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              {String(job.status).toLowerCase() === 'processing' && (
                                <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                  <div
                                    className="bg-blue-500 h-2 rounded-full transition-all"
                                    style={{ width: `${job.progress}%` }}
                                  />
                                </div>
                              )}
                              <div className="flex items-center space-x-2">
                                {getStatusIcon(job.status)}
                                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(job.status)}`}>
                                  {String(job.status).toUpperCase()}
                                </span>
                              </div>
                            </div>
                          </div>

                          {String(job.status).toLowerCase() === 'completed' && (
                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">Rows Exported:</span>
                                  <span className="ml-1 font-medium">{job.rows_exported?.toLocaleString()}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">File Size:</span>
                                  <span className="ml-1 font-medium">{formatFileSize(job.file_size || 0)}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">Processing Time:</span>
                                  <span className="ml-1 font-medium">{job.processing_time}s</span>
                                </div>
                                <div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    leftIcon={<Download className="w-3 h-3" />}
                                    onClick={() => handleDownloadExport(job.id)}
                                  >
                                    Download
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Templates Tab */}
                {activeTab === 'templates' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">Export Templates</h3>
                      <Button
                        leftIcon={<Plus className="w-4 h-4" />}
                      >
                        New Template
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* CSV Template */}
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          {getFormatIcon('CSV')}
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white">Standard CSV</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Basic CSV export</p>
                          </div>
                        </div>
                        <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400 mb-4">
                          <div>• All columns included</div>
                          <div>• No filters applied</div>
                          <div>• UTF-8 encoding</div>
                        </div>
                        <Button size="sm" variant="outline" className="w-full">
                          Use Template
                        </Button>
                      </div>

                      {/* Excel Template */}
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          {getFormatIcon('XLSX')}
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white">Formatted Excel</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Excel with formatting</p>
                          </div>
                        </div>
                        <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400 mb-4">
                          <div>• Headers with styling</div>
                          <div>• Auto-filter enabled</div>
                          <div>• Multiple sheets</div>
                        </div>
                        <Button size="sm" variant="outline" className="w-full">
                          Use Template
                        </Button>
                      </div>

                      {/* JSON Template */}
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          {getFormatIcon('JSON')}
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white">API JSON</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">JSON for APIs</p>
                          </div>
                        </div>
                        <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400 mb-4">
                          <div>• Nested structure</div>
                          <div>• Metadata included</div>
                          <div>• Pretty formatted</div>
                        </div>
                        <Button size="sm" variant="outline" className="w-full">
                          Use Template
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* History Tab */}
                {activeTab === 'history' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Export History</h3>

                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Export
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Format
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Progress
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Created
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Size
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {exportJobs.map((job) => (
                            <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {job.name}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {job.description}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center space-x-2">
                                  {getFormatIcon(job.export_format)}
                                  <span className="text-sm text-gray-900 dark:text-white">
                                    {String(job.export_format).toUpperCase()}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center space-x-2">
                                  {getStatusIcon(job.status)}
                                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(job.status)}`}>
                                    {String(job.status).toUpperCase()}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                  <div
                                    className="bg-blue-500 h-2 rounded-full transition-all"
                                    style={{ width: `${job.progress}%` }}
                                  />
                                </div>
                                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                  {job.progress}%
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {formatDate(job.created_at)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {formatFileSize(job.file_size || 0)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end space-x-2">
                                  <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  {String(job.status).toLowerCase() === 'completed' && (
                                    <button 
                                      className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                      onClick={() => handleDownloadExport(job.id)}
                                    >
                                      <Download className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Info Panel */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-500 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Data Export Features
              </h4>
              <ul className="mt-2 text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Multiple export formats (CSV, Excel, JSON, XML, Parquet, SQL)</li>
                <li>• Advanced filtering and column selection</li>
                <li>• Export templates for common use cases</li>
                <li>• Real-time progress tracking</li>
                <li>• Automatic file compression and optimization</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
