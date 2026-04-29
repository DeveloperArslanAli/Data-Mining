/**
 * Data Mining Platform - Main Dashboard
 */

import React, { useState, useEffect } from 'react';
import DashboardStats from '@/components/dashboard/DashboardStats';
import DatasetUpload from '@/components/datasets/DatasetUpload';
import CleaningOperations from '@/components/cleaning/CleaningOperations';
import DataExport from '@/components/export/DataExport';
import WebCrawler from '@/components/crawling/WebCrawler';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Database, 
  Activity, 
  Download, 
  Globe, 
  Plus, 
  Upload,
  Sparkles,
  TrendingUp,
  Users,
  Clock,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Dataset, CleaningOperation as CleaningOpType, ExportJob as ExportJobType, CrawlingJob as CrawlingJobType } from '@/types';

interface DashboardData {
  stats: {
    totalDatasets: number;
    totalOperations: number;
    totalExports: number;
    totalCrawlingJobs: number;
    activeUsers: number;
    recentActivity: number;
    dataProcessed: number;
    averageProcessingTime: number;
  };
  recentDatasets: Array<{
    id: string;
    name: string;
    format: string;
    size: number;
    status: string;
    createdAt: Date;
  }>;
  recentOperations: Array<{
    id: string;
    name: string;
    type: string;
    status: string;
    progress: number;
    createdAt: Date;
  }>;
}

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'datasets' | 'cleaning' | 'export' | 'crawling' | 'analytics'>('overview');
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    stats: {
      totalDatasets: 0,
      totalOperations: 0,
      totalExports: 0,
      totalCrawlingJobs: 0,
      activeUsers: 0,
      recentActivity: 0,
      dataProcessed: 0,
      averageProcessingTime: 0,
    },
    recentDatasets: [],
    recentOperations: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lastDatasets, setLastDatasets] = useState<Dataset[]>([]);

  useEffect(() => {
    // Load dashboard data from backend
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        const [datasetsList, exportJobs, cleaningOps, crawlingJobs] = await Promise.all([
          api.getDatasets({ page: 1, size: 5 }),
          api.getExportJobs(),
          api.getCleaningOperations(),
          api.getCrawlingJobs(),
        ]);

        setLastDatasets(datasetsList.datasets || []);

  // Active users: avoid admin-only endpoint; show 1 (current user) for now
  const activeUsers = 1;

        const recentDatasets = (datasetsList.datasets || []).map((d) => ({
          id: String(d.id),
          name: d.name,
          format: d.format,
          size: d.file_size,
          status: d.status,
          createdAt: new Date(d.created_at),
        }));

        const recentOperations = (cleaningOps || []).slice(0, 5).map((op: CleaningOpType) => ({
          id: String(op.id),
          name: op.name || op.operation_type,
          type: 'cleaning',
          status: op.status,
          progress: op.progress ?? 0,
          createdAt: new Date(op.created_at),
        }));

        setDashboardData({
          stats: {
            totalDatasets: datasetsList.total || 0,
            totalOperations: (cleaningOps || []).length,
            totalExports: (exportJobs || []).length,
            totalCrawlingJobs: (crawlingJobs || []).length,
            activeUsers,
            recentActivity: recentDatasets.length + recentOperations.length,
            dataProcessed: 0,
            averageProcessingTime: 0,
          },
          recentDatasets,
          recentOperations,
        });
      } catch (error) {
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const handleDatasetUpload = async (file: File, metadata: any) => {
    try {
      const res = await api.uploadDataset(file, metadata.name, metadata.description);
      toast.success(`Dataset "${res.dataset.name}" uploaded successfully`);

      // Update stats and recent datasets
      setDashboardData(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          totalDatasets: prev.stats.totalDatasets + 1,
        },
        recentDatasets: [
          {
            id: String(res.dataset.id),
            name: res.dataset.name,
            format: res.dataset.format,
            size: res.dataset.file_size,
            status: res.dataset.status,
            createdAt: new Date(res.dataset.created_at || Date.now()),
          },
          ...prev.recentDatasets.slice(0, 4),
        ],
      }));
    } catch (error) {
      toast.error('Failed to upload dataset');
    }
  };

  const handleCleaningOperation = async (operation: any) => {
    try {
      const datasetId = lastDatasets[0]?.id;
      if (!datasetId) {
        toast.error('No dataset available to run cleaning operation');
        return;
      }
      const payload = {
        dataset_id: Number(datasetId),
        operation_type: operation.type || 'custom_transformation',
        parameters: operation.parameters || {},
        target_columns: operation.targetColumns || [],
      };
      await api.startCleaningOperation(payload);
      toast.success(`Cleaning operation "${operation.name || payload.operation_type}" started`);
      setDashboardData(prev => ({
        ...prev,
        stats: { ...prev.stats, totalOperations: prev.stats.totalOperations + 1 },
      }));
    } catch (error) {
      toast.error('Failed to start cleaning operation');
    }
  };

  const handleExport = async (options: any) => {
    try {
      const datasetId = lastDatasets[0]?.id;
      if (!datasetId) {
        toast.error('No dataset available to export');
        return;
      }
      await api.startExportJob({
        dataset_id: Number(datasetId),
        export_format: options.format,
        include_headers: options.includeHeaders ? lastDatasets[0]?.column_names : undefined,
        exclude_headers: options.includeHeaders ? undefined : lastDatasets[0]?.column_names,
        filters: options.filters,
        sorting: options.sorting,
        limit_rows: options.limitRows,
      });
      toast.success(`Export to ${options.format.toUpperCase()} started`);
      setDashboardData(prev => ({
        ...prev,
        stats: { ...prev.stats, totalExports: prev.stats.totalExports + 1 },
      }));
    } catch (error) {
      toast.error('Failed to start export');
    }
  };

  const handleCrawling = async (url: string, config: any) => {
    try {
      await api.startCrawlingJob({
        urls: [url],
        max_depth: config.maxDepth,
        max_pages: config.maxPages,
        delay: config.delay,
      });
      toast.success('Web crawling job started');
      setDashboardData(prev => ({
        ...prev,
        stats: { ...prev.stats, totalCrawlingJobs: prev.stats.totalCrawlingJobs + 1 },
      }));
    } catch (error) {
      toast.error('Failed to start crawling job');
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'datasets', label: 'Datasets', icon: Database },
    { id: 'cleaning', label: 'Data Cleaning', icon: Activity },
    { id: 'export', label: 'Export', icon: Download },
    { id: 'crawling', label: 'Web Crawling', icon: Globe },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  const getStatusBadge = (status: string) => {
    const variants = {
      processed: 'success' as const,
      processing: 'primary' as const,
      pending: 'secondary' as const,
      completed: 'success' as const,
      failed: 'error' as const,
      uploaded: 'secondary' as const,
      cleaned: 'success' as const,
      exported: 'info' as const,
      error: 'error' as const,
    } as const;

    const variant = (variants as any)[status] || 'secondary';
    return <Badge variant={variant}>{status}</Badge>;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Data Mining Platform</h1>
            <p className="text-gray-600">Comprehensive data mining and analysis tools</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="info" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {dashboardData.stats.activeUsers} active users
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Last updated: {new Date().toLocaleTimeString()}
            </Badge>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    'flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm',
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <>
              {/* Stats Overview */}
              <DashboardStats stats={dashboardData.stats} />
              
              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Datasets */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5 text-blue-500" />
                      Recent Datasets
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {dashboardData.recentDatasets.map((dataset) => (
                        <div
                          key={dataset.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Database className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{dataset.name}</h4>
                              <p className="text-sm text-gray-500">
                                {dataset.format.toUpperCase()} • {formatFileSize(dataset.size)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(dataset.status)}
                            <span className="text-xs text-gray-400">
                              {dataset.createdAt.toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Operations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-green-500" />
                      Recent Operations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {dashboardData.recentOperations.map((operation) => (
                        <div
                          key={operation.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                              <Activity className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{operation.name}</h4>
                              <p className="text-sm text-gray-500 capitalize">
                                {operation.type} operation
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(operation.status)}
                            <span className="text-xs text-gray-400">
                              {operation.createdAt.toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-500" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Button
                      variant="outline"
                      className="h-20 flex flex-col items-center justify-center gap-2"
                      onClick={() => setActiveTab('datasets')}
                    >
                      <Upload className="h-6 w-6" />
                      <span>Upload Dataset</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-20 flex flex-col items-center justify-center gap-2"
                      onClick={() => setActiveTab('cleaning')}
                    >
                      <Activity className="h-6 w-6" />
                      <span>Clean Data</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-20 flex flex-col items-center justify-center gap-2"
                      onClick={() => setActiveTab('export')}
                    >
                      <Download className="h-6 w-6" />
                      <span>Export Data</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-20 flex flex-col items-center justify-center gap-2"
                      onClick={() => setActiveTab('crawling')}
                    >
                      <Globe className="h-6 w-6" />
                      <span>Web Crawl</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Analytics Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-indigo-500" />
                    Analytics Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">90.9%</div>
                      <div className="text-sm text-blue-600">Data Quality Score</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">156</div>
                      <div className="text-sm text-green-600">Total Operations</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">3.2s</div>
                      <div className="text-sm text-purple-600">Avg Processing Time</div>
                    </div>
                  </div>
                  <div className="mt-4 text-center">
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab('analytics')}
                      className="flex items-center gap-2 mx-auto"
                    >
                      <BarChart3 className="h-4 w-4" />
                      View Full Analytics Dashboard
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {activeTab === 'datasets' && (
            <DatasetUpload
              onUpload={handleDatasetUpload}
              onCancel={() => setActiveTab('overview')}
            />
          )}

          {activeTab === 'cleaning' && (
            <CleaningOperations
              datasetId={String(lastDatasets[0]?.id || '')}
              datasetName={lastDatasets[0]?.name || 'Sample Dataset'}
              onOperationStart={handleCleaningOperation}
              onOperationCancel={async (operationId: string) => {
                // Best effort: call cancel if available (requires operation id)
                const idNum = Number(operationId);
                if (!Number.isNaN(idNum)) {
                  try { await api.cancelCleaningOperation(idNum); } catch {}
                }
              }}
            />
          )}

          {activeTab === 'export' && (
            <DataExport
              datasetId={String(lastDatasets[0]?.id || '')}
              datasetName={lastDatasets[0]?.name || 'Sample Dataset'}
              availableColumns={lastDatasets[0]?.column_names || []}
              totalRows={lastDatasets[0]?.row_count || 0}
              onExport={handleExport}
              onDownload={async (jobId: string) => {
                const idNum = Number(jobId);
                if (Number.isNaN(idNum)) return;
                await api.downloadExportFile(idNum);
              }}
            />
          )}

          {activeTab === 'crawling' && (
            <WebCrawler
              onStartCrawling={handleCrawling}
              onPauseCrawling={async (jobId: string) => { /* no-op in backend MVP */ }}
              onResumeCrawling={async (jobId: string) => { /* no-op in backend MVP */ }}
              onCancelCrawling={async (jobId: string) => {
                try { await api.cancelCrawlingJob(jobId); } catch {}
              }}
              onDownloadData={async (jobId: string) => {
                await api.downloadCrawledDataFile(jobId, 'csv');
              }}
            />
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="text-center py-12">
                <BarChart3 className="h-16 w-16 text-indigo-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Advanced Analytics Dashboard</h3>
                <p className="text-gray-600 mb-6">
                  Access comprehensive analytics, data quality insights, statistical analysis, and export performance metrics.
                </p>
                <Button
                  onClick={() => window.location.href = '/analytics'}
                  className="flex items-center gap-2 mx-auto"
                >
                  <BarChart3 className="h-4 w-4" />
                  Go to Analytics Dashboard
                </Button>
              </div>
            </div>
          )}
        </div>
  </div>
  );
};

export default Dashboard;
