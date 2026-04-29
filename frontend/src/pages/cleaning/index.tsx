/**
 * Data Mining Platform - Data Cleaning Dashboard
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  Settings,
  Database,
  Play,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Sparkles,
  Filter,
  RefreshCw,
  Eye,
  Download,
  Plus,
  ArrowRight,
  Info,
  Zap,
  Target,
  TrendingUp,
  Activity,
  FileText,
} from 'lucide-react';

// Components
import { Button } from '@/components/ui/Button';

// Hooks
import { useAuthStore } from '@/store/auth';

// Types
import { Dataset, CleaningOperation, CleaningOperationType, CleaningOperationStatus, DatasetStatus } from '@/types';

// Utils
import { formatDate, cn } from '@/lib/utils';

export default function DataCleaningPage() {
  const router = useRouter();
  const { dataset: datasetId } = router.query;
  const { user } = useAuthStore();
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [cleaningOperations, setCleaningOperations] = useState<CleaningOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'operations' | 'suggestions' | 'history'>('overview');
  const [showNewOperation, setShowNewOperation] = useState(false);

  // Mock data - replace with API calls
  useEffect(() => {
    const mockDatasets: Dataset[] = [
  {
    id: 1,
    name: 'Customer Analytics 2024',
    description: 'Customer behavior and analytics data for Q1 2024',
  filename: 'customer_analytics_2024.csv',
  file_path: '/uploads/customer_analytics_2024.csv',
  status: DatasetStatus.CLEANED,
  format: 'csv' as any,
  row_count: 15420,
  column_count: 12,
  file_size: 2048576,
  created_at: new Date('2024-01-15').toISOString(),
  updated_at: new Date('2024-01-16').toISOString(),
  owner_id: user?.id || 1,
  processing_progress: 100,
  duplicate_rows_count: 156,
      },
  {
    id: 2,
    name: 'Sales Data Q4',
    description: 'Quarterly sales performance data',
  filename: 'sales_data_q4.xlsx',
  file_path: '/uploads/sales_data_q4.xlsx',
  status: DatasetStatus.PROCESSING,
  format: 'xlsx' as any,
  row_count: 8920,
  column_count: 8,
  file_size: 1536000,
  created_at: new Date('2024-01-14').toISOString(),
  updated_at: new Date('2024-01-14').toISOString(),
  owner_id: user?.id || 1,
  processing_progress: 65,
  duplicate_rows_count: 89,
      },
    ];

    const mockOperations: CleaningOperation[] = [
      {
        id: 1,
        name: 'Remove Duplicate Rows',
        description: 'Remove 156 duplicate rows from Customer Analytics dataset',
  operation_type: CleaningOperationType.REMOVE_DUPLICATES,
  status: CleaningOperationStatus.COMPLETED,
  progress: 100,
  created_at: new Date('2024-01-16T10:30:00').toISOString(),
  started_at: new Date('2024-01-16T10:30:00').toISOString(),
  completed_at: new Date('2024-01-16T10:30:45').toISOString(),
  dataset_id: 1,
  user_id: user?.id || 1,
      },
      {
        id: 2,
        name: 'Handle Missing Values',
        description: 'Fill missing values in age, gender, and city columns',
  operation_type: CleaningOperationType.HANDLE_MISSING_VALUES,
  status: CleaningOperationStatus.PROCESSING,
  progress: 65,
  created_at: new Date('2024-01-16T11:00:00').toISOString(),
  started_at: new Date('2024-01-16T11:00:00').toISOString(),
  dataset_id: 1,
  user_id: user?.id || 1,
      },
    ];

    setDatasets(mockDatasets);
    setCleaningOperations(mockOperations);

    // Set selected dataset if datasetId is provided
    if (datasetId) {
      const dataset = mockDatasets.find(d => d.id === parseInt(datasetId as string));
      setSelectedDataset(dataset || null);
    }

    setLoading(false);
  }, [datasetId, user?.id]);

  const getStatusIcon = (status: CleaningOperationStatus) => {
    switch (status) {
  case CleaningOperationStatus.COMPLETED:
        return <CheckCircle className="w-5 h-5 text-green-500" />;
  case CleaningOperationStatus.PROCESSING:
        return <Clock className="w-5 h-5 text-blue-500 animate-pulse" />;
  case CleaningOperationStatus.PENDING:
        return <Clock className="w-5 h-5 text-yellow-500" />;
  case CleaningOperationStatus.FAILED:
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Settings className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: CleaningOperationStatus) => {
    switch (status) {
      case CleaningOperationStatus.COMPLETED:
        return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case CleaningOperationStatus.PROCESSING:
        return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      case CleaningOperationStatus.PENDING:
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case CleaningOperationStatus.FAILED:
        return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getOperationIcon = (type: CleaningOperationType) => {
    switch (type) {
      case CleaningOperationType.REMOVE_DUPLICATES:
        return <Filter className="w-4 h-4 text-blue-500" />;
      case CleaningOperationType.HANDLE_MISSING_VALUES:
        return <Target className="w-4 h-4 text-green-500" />;
      case CleaningOperationType.REMOVE_OUTLIERS:
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case CleaningOperationType.DATA_TYPE_CONVERSION:
        return <FileText className="w-4 h-4 text-purple-500" />;
      case CleaningOperationType.STRING_CLEANING:
        return <Settings className="w-4 h-4 text-orange-500" />;
      case CleaningOperationType.NORMALIZATION:
        return <TrendingUp className="w-4 h-4 text-indigo-500" />;
      default:
        return <Settings className="w-4 h-4 text-gray-500" />;
    }
  };

  const handleStartAutoClean = () => {
    if (!selectedDataset) return;
    
    // TODO: Implement auto-clean functionality
    console.log('Starting auto-clean for dataset:', selectedDataset.id);
  };

  const handleStartManualOperation = () => {
    setShowNewOperation(true);
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
        <title>Data Cleaning - Data Mining Platform</title>
        <meta name="description" content="Clean and process your datasets with AI-powered tools" />
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Data Cleaning</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Clean and process your datasets with AI-powered tools
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
              onClick={handleStartManualOperation}
            >
              New Operation
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
                Upload a dataset to start cleaning operations.
              </p>
              <div className="mt-4">
                <Button onClick={() => router.push('/datasets/upload')}>
                  Upload Dataset
                </Button>
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
                        <span>{dataset.column_count} columns</span>
                        <span>{dataset.format}</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">Size: {(dataset.file_size/1024).toFixed(1)} KB</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedDataset && (
          <>
            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Quick Actions - {selectedDataset.name}
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/datasets/${selectedDataset.id}`)}
                >
                  View Dataset
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  className="h-auto p-4 flex-col items-start"
                  leftIcon={<Zap className="w-6 h-6" />}
                  onClick={handleStartAutoClean}
                >
                  <span className="font-medium">Auto-Clean</span>
                  <span className="text-sm opacity-75">AI-powered automatic cleaning</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto p-4 flex-col items-start"
                  leftIcon={<Sparkles className="w-6 h-6" />}
                  onClick={() => setActiveTab('suggestions')}
                >
                  <span className="font-medium">AI Suggestions</span>
                  <span className="text-sm opacity-75">Get cleaning recommendations</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto p-4 flex-col items-start"
                  leftIcon={<Settings className="w-6 h-6" />}
                  onClick={handleStartManualOperation}
                >
                  <span className="font-medium">Manual Operation</span>
                  <span className="text-sm opacity-75">Custom cleaning operations</span>
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex space-x-8 px-6">
                  {[
                    { id: 'overview', name: 'Overview', icon: BarChart3 },
                    { id: 'operations', name: 'Operations', icon: Activity },
                    { id: 'suggestions', name: 'AI Suggestions', icon: Sparkles },
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
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <div className="flex items-center">
                          <AlertCircle className="w-8 h-8 text-red-500" />
                          <div className="ml-3">
                            <p className="text-sm font-medium text-red-800 dark:text-red-200">Missing Values</p>
                            <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                              —
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                        <div className="flex items-center">
                          <Filter className="w-8 h-8 text-yellow-500" />
                          <div className="ml-3">
                            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Duplicates</p>
                            <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                              —
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                        <div className="flex items-center">
                          <AlertCircle className="w-8 h-8 text-orange-500" />
                          <div className="ml-3">
                            <p className="text-sm font-medium text-orange-800 dark:text-orange-200">Outliers</p>
                            <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                              —
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <div className="flex items-center">
                          <TrendingUp className="w-8 h-8 text-green-500" />
                          <div className="ml-3">
                            <p className="text-sm font-medium text-green-800 dark:text-green-200">Quality Score</p>
                            <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                              —
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Recent Operations */}
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Recent Operations</h3>
                        <div className="space-y-3">
                {cleaningOperations.slice(0, 3).map((operation) => (
                            <div
                              key={operation.id}
                              className="flex items-center justify-between p-3 bg-white dark:bg-gray-600 rounded-lg"
                            >
                              <div className="flex items-center space-x-3">
                    {getOperationIcon(operation.operation_type as any)}
                                <div>
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {operation.name}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(operation.created_at || new Date().toISOString())}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {getStatusIcon(operation.status)}
                                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(operation.status)}`}>
                                  {operation.status}
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
                            View All Operations
                          </Button>
                        </div>
                      </div>

                      {/* Quality Improvement */}
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Quality Improvement</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Current Quality</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              —
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div
                              className={cn(
                                'h-2 rounded-full transition-all',
                                'bg-green-500'
                              )}
                              style={{ width: '100%' }}
                            />
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Target: 95% quality score
                          </div>
                        </div>
                        <div className="mt-4">
                          <Button
                            leftIcon={<Sparkles className="w-4 h-4" />}
                            onClick={() => setActiveTab('suggestions')}
                          >
                            Get AI Suggestions
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Operations Tab */}
                {activeTab === 'operations' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">Cleaning Operations</h3>
                      <Button
                        leftIcon={<Plus className="w-4 h-4" />}
                        onClick={handleStartManualOperation}
                      >
                        New Operation
                      </Button>
                    </div>

                    <div className="space-y-4">
          {cleaningOperations.map((operation) => (
                        <div
                          key={operation.id}
                          className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
            {getOperationIcon(operation.operation_type as any)}
                              <div>
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                  {operation.name}
                                </h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {operation.description}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              {operation.status === CleaningOperationStatus.PROCESSING && (
                                <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                  <div
                                    className="bg-blue-500 h-2 rounded-full transition-all"
                                    style={{ width: `${operation.progress}%` }}
                                  />
                                </div>
                              )}
                              <div className="flex items-center space-x-2">
                                {getStatusIcon(operation.status)}
                                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(operation.status)}`}>
                                  {operation.status}
                                </span>
                              </div>
                            </div>
                          </div>
          {/* Completed operation summary could go here once metrics are available */}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Suggestions Tab */}
                {activeTab === 'suggestions' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">AI Cleaning Suggestions</h3>
                      <Button
                        leftIcon={<Zap className="w-4 h-4" />}
                        onClick={handleStartAutoClean}
                      >
                        Run Auto-Clean
                      </Button>
                    </div>

                    <div className="border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 text-sm text-blue-800 dark:text-blue-200">
                      Suggestions will appear here once analysis is implemented.
                    </div>
                  </div>
                )}

                {/* History Tab */}
                {activeTab === 'history' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Operation History</h3>

                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Operation
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Progress
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Started
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Duration
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {cleaningOperations.map((operation) => (
                            <tr key={operation.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center space-x-3">
                                  {getOperationIcon(operation.operation_type as any)}
                                  <div>
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                      {operation.name}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                      {operation.description}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center space-x-2">
                                  {getStatusIcon(operation.status)}
                                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(operation.status)}`}>
                                    {operation.status}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                  <div
                                    className="bg-blue-500 h-2 rounded-full transition-all"
                                    style={{ width: `${operation.progress}%` }}
                                  />
                                </div>
                                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                  {operation.progress}%
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {formatDate(operation.created_at || new Date().toISOString())}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {operation.started_at && operation.completed_at ? `${Math.round((new Date(operation.completed_at).getTime() - new Date(operation.started_at).getTime()) / 1000)}s` : '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end space-x-2">
                                  <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  {operation.status === CleaningOperationStatus.COMPLETED && (
                                    <button className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300">
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
                Data Cleaning Features
              </h4>
              <ul className="mt-2 text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• AI-powered automatic cleaning suggestions</li>
                <li>• Manual cleaning operations with real-time progress</li>
                <li>• Quality score tracking and improvement</li>
                <li>• Support for missing values, duplicates, and outliers</li>
                <li>• Data type conversion and normalization</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
