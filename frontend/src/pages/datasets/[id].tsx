/**
 * Data Mining Platform - Dataset Detail Page
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  Database,
  Download,
  Edit,
  Trash2,
  Eye,
  BarChart3,
  Settings,
  Play,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
  ArrowLeft,
  FileText,
  Calendar,
  Users,
  TrendingUp,
  Activity,
  Copy,
  Share2,
} from 'lucide-react';

// Components
import { Button } from '@/components/ui/Button';

// Hooks
import { useAuthStore } from '@/store/auth';

// Types
import { Dataset, DatasetStatus, DatasetFormat } from '@/types';

// Utils
import { formatFileSize, formatDate, cn, copyToClipboard } from '@/lib/utils';

export default function DatasetDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuthStore();
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'preview' | 'quality' | 'operations'>('overview');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Mock data - replace with API call
  useEffect(() => {
    if (id) {
      const mockDataset: Dataset = {
        id: parseInt(id as string),
        name: 'Customer Analytics 2024',
        description: 'Comprehensive customer behavior and analytics data for Q1 2024, including purchase patterns, demographics, and engagement metrics.',
        status: 'CLEANED',
        format: 'CSV',
        rowCount: 15420,
        columnCount: 12,
        fileSize: 2048576, // 2MB
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-16'),
        ownerId: user?.id || 1,
        qualityScore: 95.2,
        columnNames: ['customer_id', 'name', 'email', 'age', 'gender', 'city', 'purchase_amount', 'purchase_date', 'category', 'rating', 'satisfaction', 'loyalty_score'],
        dataTypes: {
          'customer_id': 'int64',
          'name': 'object',
          'email': 'object',
          'age': 'int64',
          'gender': 'object',
          'city': 'object',
          'purchase_amount': 'float64',
          'purchase_date': 'datetime64[ns]',
          'category': 'object',
          'rating': 'int64',
          'satisfaction': 'int64',
          'loyalty_score': 'float64',
        },
        missingValuesCount: {
          'age': 45,
          'gender': 12,
          'city': 8,
          'rating': 23,
        },
        duplicateRowsCount: 156,
        outlierCount: {
          'purchase_amount': 89,
          'age': 34,
          'loyalty_score': 12,
        },
        sampleData: [
          {
            customer_id: 1001,
            name: 'John Smith',
            email: 'john.smith@email.com',
            age: 32,
            gender: 'Male',
            city: 'New York',
            purchase_amount: 125.50,
            purchase_date: '2024-01-15',
            category: 'Electronics',
            rating: 5,
            satisfaction: 4,
            loyalty_score: 0.85,
          },
          {
            customer_id: 1002,
            name: 'Sarah Johnson',
            email: 'sarah.j@email.com',
            age: 28,
            gender: 'Female',
            city: 'Los Angeles',
            purchase_amount: 89.99,
            purchase_date: '2024-01-14',
            category: 'Clothing',
            rating: 4,
            satisfaction: 4,
            loyalty_score: 0.72,
          },
          {
            customer_id: 1003,
            name: 'Mike Davis',
            email: 'mike.davis@email.com',
            age: 35,
            gender: 'Male',
            city: 'Chicago',
            purchase_amount: 245.00,
            purchase_date: '2024-01-13',
            category: 'Home & Garden',
            rating: 5,
            satisfaction: 5,
            loyalty_score: 0.91,
          },
        ],
      };

      setDataset(mockDataset);
      setLoading(false);
    }
  }, [id, user?.id]);

  const getStatusIcon = (status: DatasetStatus) => {
    switch (status) {
      case 'CLEANED':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'PROCESSING':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'UPLOADED':
        return <Database className="w-5 h-5 text-yellow-500" />;
      case 'ERROR':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Database className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: DatasetStatus) => {
    switch (status) {
      case 'CLEANED':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'PROCESSING':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      case 'UPLOADED':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'ERROR':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getFormatIcon = (format: DatasetFormat) => {
    switch (format) {
      case 'CSV':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'XLSX':
        return <FileText className="w-4 h-4 text-green-500" />;
      case 'JSON':
        return <FileText className="w-4 h-4 text-purple-500" />;
      case 'XML':
        return <FileText className="w-4 h-4 text-orange-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const handleDelete = () => {
    // TODO: Implement delete functionality
    console.log('Deleting dataset:', dataset?.id);
    setShowDeleteModal(false);
    router.push('/datasets');
  };

  const handleCopyId = () => {
    if (dataset) {
      copyToClipboard(dataset.id.toString());
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!dataset) {
    return (
      <div className="text-center py-12">
        <Database className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Dataset not found</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          The dataset you're looking for doesn't exist or has been deleted.
        </p>
        <div className="mt-6">
          <Button onClick={() => router.push('/datasets')}>
            Back to Datasets
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{dataset.name} - Data Mining Platform</title>
        <meta name="description" content={dataset.description} />
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
              onClick={() => router.back()}
            >
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{dataset.name}</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">{dataset.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Copy className="w-4 h-4" />}
              onClick={handleCopyId}
            >
              Copy ID
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Share2 className="w-4 h-4" />}
            >
              Share
            </Button>
            <Button
              href={`/datasets/${dataset.id}/edit`}
              leftIcon={<Edit className="w-4 h-4" />}
            >
              Edit
            </Button>
          </div>
        </div>

        {/* Status Banner */}
        <div className={cn(
          'border rounded-lg p-4',
          getStatusColor(dataset.status)
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getStatusIcon(dataset.status)}
              <div>
                <h3 className="text-sm font-medium">
                  Dataset Status: {dataset.status}
                </h3>
                <p className="text-sm opacity-75">
                  Last updated {formatDate(dataset.updatedAt)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">
                Quality Score: {dataset.qualityScore.toFixed(1)}%
              </span>
              <div className="w-16 bg-white/50 rounded-full h-2">
                <div
                  className={cn(
                    'h-2 rounded-full transition-all',
                    dataset.qualityScore >= 90 ? 'bg-green-500' :
                    dataset.qualityScore >= 70 ? 'bg-yellow-500' :
                    'bg-red-500'
                  )}
                  style={{ width: `${dataset.qualityScore}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', name: 'Overview', icon: Info },
                { id: 'preview', name: 'Data Preview', icon: Eye },
                { id: 'quality', name: 'Quality Report', icon: BarChart3 },
                { id: 'operations', name: 'Operations', icon: Settings },
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center">
                      <Database className="w-8 h-8 text-blue-500" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Rows</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {dataset.rowCount?.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center">
                      <FileText className="w-8 h-8 text-green-500" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Columns</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {dataset.columnCount}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center">
                      <TrendingUp className="w-8 h-8 text-purple-500" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">File Size</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {formatFileSize(dataset.fileSize)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center">
                      <Calendar className="w-8 h-8 text-orange-500" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          {formatDate(dataset.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Dataset Info */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Dataset Information</h3>
                    <dl className="space-y-3">
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Format</dt>
                        <dd className="text-sm text-gray-900 dark:text-white flex items-center">
                          {getFormatIcon(dataset.format)}
                          <span className="ml-2">{dataset.format}</span>
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</dt>
                        <dd className="text-sm">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(dataset.status)}`}>
                            {dataset.status}
                          </span>
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Owner</dt>
                        <dd className="text-sm text-gray-900 dark:text-white">You</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Modified</dt>
                        <dd className="text-sm text-gray-900 dark:text-white">{formatDate(dataset.updatedAt)}</dd>
                      </div>
                    </dl>
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                      <Button
                        className="w-full justify-start"
                        leftIcon={<Download className="w-4 h-4" />}
                      >
                        Download Dataset
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        leftIcon={<Play className="w-4 h-4" />}
                        onClick={() => router.push(`/cleaning?dataset=${dataset.id}`)}
                      >
                        Start Cleaning
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        leftIcon={<BarChart3 className="w-4 h-4" />}
                        onClick={() => router.push(`/export?dataset=${dataset.id}`)}
                      >
                        Export Data
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        leftIcon={<Activity className="w-4 h-4" />}
                        onClick={() => setActiveTab('quality')}
                      >
                        View Quality Report
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Preview Tab */}
            {activeTab === 'preview' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Data Preview</h3>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Showing first 3 rows of {dataset.rowCount?.toLocaleString()} total rows
                  </div>
                </div>

                {dataset.sampleData && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          {dataset.columnNames?.map((column) => (
                            <th
                              key={column}
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                            >
                              {column}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {dataset.sampleData.map((row, index) => (
                          <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            {dataset.columnNames?.map((column) => (
                              <td
                                key={column}
                                className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white"
                              >
                                {row[column as keyof typeof row]?.toString() || '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Info className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Data Preview
                      </h4>
                      <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                        This preview shows the first few rows of your dataset. Use the data cleaning tools to process and analyze your data further.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quality Tab */}
            {activeTab === 'quality' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Data Quality Report</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="flex items-center">
                      <AlertCircle className="w-8 h-8 text-red-500" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-red-800 dark:text-red-200">Missing Values</p>
                        <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                          {Object.values(dataset.missingValuesCount || {}).reduce((a, b) => a + b, 0)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <div className="flex items-center">
                      <AlertCircle className="w-8 h-8 text-yellow-500" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Duplicate Rows</p>
                        <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                          {dataset.duplicateRowsCount || 0}
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
                          {Object.values(dataset.outlierCount || {}).reduce((a, b) => a + b, 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">Column Analysis</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                      <thead className="bg-gray-50 dark:bg-gray-600">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Column
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Data Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Missing Values
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Outliers
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                        {dataset.columnNames?.map((column) => (
                          <tr key={column}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              {column}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {dataset.dataTypes?.[column] || 'Unknown'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {dataset.missingValuesCount?.[column] || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {dataset.outlierCount?.[column] || 0}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Operations Tab */}
            {activeTab === 'operations' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Dataset Operations</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-6">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Data Cleaning</h4>
                    <div className="space-y-3">
                      <Button
                        className="w-full justify-start"
                        leftIcon={<Play className="w-4 h-4" />}
                        onClick={() => router.push(`/cleaning?dataset=${dataset.id}`)}
                      >
                        Start Cleaning Operation
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        leftIcon={<Settings className="w-4 h-4" />}
                        onClick={() => router.push(`/cleaning/auto?dataset=${dataset.id}`)}
                      >
                        Auto-Clean Dataset
                      </Button>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-6">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Export Options</h4>
                    <div className="space-y-3">
                      <Button
                        className="w-full justify-start"
                        leftIcon={<Download className="w-4 h-4" />}
                        onClick={() => router.push(`/export?dataset=${dataset.id}`)}
                      >
                        Export Dataset
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        leftIcon={<BarChart3 className="w-4 h-4" />}
                        onClick={() => router.push(`/export/quick?dataset=${dataset.id}`)}
                      >
                        Quick Export
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-6">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Danger Zone</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-medium text-gray-900 dark:text-white">Delete Dataset</h5>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Permanently delete this dataset and all associated data. This action cannot be undone.
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      leftIcon={<Trash2 className="w-4 h-4" />}
                      onClick={() => setShowDeleteModal(true)}
                    >
                      Delete Dataset
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
              <div className="mt-3 text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-4">
                  Delete Dataset
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Are you sure you want to delete "{dataset.name}"? This action cannot be undone.
                </p>
                <div className="flex items-center justify-center space-x-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
