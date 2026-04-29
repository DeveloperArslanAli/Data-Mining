/**
 * Data Mining Platform - Export Section
 *
 * Manages data export configuration and execution with real-time progress tracking.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { 
  Download, 
  Play, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  Settings,
  FileText,
  BarChart3
} from 'lucide-react';
import { ExportJob, ExportJobStatus, Dataset, ExportFormat } from '@/types';
import apiClient from '@/lib/api';

export interface ExportSectionProps {
  dataset: Dataset;
  onComplete: () => void;
  className?: string;
}

const ExportSection: React.FC<ExportSectionProps> = ({
  dataset,
  onComplete,
  className
}) => {
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewExport, setShowNewExport] = useState(false);
  const [newExport, setNewExport] = useState({
    name: '',
    description: '',
    export_format: 'csv',
    include_headers: true,
    exclude_headers: [] as string[],
    filters: {},
    sorting: {},
    limit_rows: undefined as number | undefined
  });

  useEffect(() => {
    loadExportJobs();
  }, [dataset.id]);

  const loadExportJobs = async () => {
    setIsLoading(true);
    try {
      const response: any = await apiClient.getExportJobs(dataset.id);
      const jobs: ExportJob[] = Array.isArray(response)
        ? response
        : Array.isArray(response?.jobs)
          ? response.jobs
          : [];
      setExportJobs(jobs);
    } catch (error) {
      console.error('Failed to load export jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartExport = async () => {
    if (!newExport.name.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await apiClient.startExportJob({
        dataset_id: dataset.id,
  export_format: newExport.export_format as ExportFormat,
        name: newExport.name,
        description: newExport.description,
        include_headers: newExport.include_headers ? Object.keys(dataset.column_names || {}) : [],
        exclude_headers: newExport.exclude_headers,
        filters: newExport.filters,
        sorting: newExport.sorting,
        limit_rows: newExport.limit_rows
      });

      const exportJob: ExportJob = {
        id: response.job_id,
        name: newExport.name,
        description: newExport.description,
  export_format: newExport.export_format as ExportFormat,
        status: ExportJobStatus.PENDING,
        progress: 0,
        dataset_id: dataset.id,
        user_id: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setExportJobs(prev => [...prev, exportJob]);
      setShowNewExport(false);
      setNewExport({
        name: '',
        description: '',
        export_format: 'csv',
        include_headers: true,
        exclude_headers: [],
        filters: {},
        sorting: {},
        limit_rows: undefined
      });

      // Start monitoring the export job
      monitorExportJob(exportJob.id);
      
    } catch (error) {
      console.error('Failed to start export job:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const monitorExportJob = async (jobId: number) => {
    const interval = setInterval(async () => {
      try {
        const job = await apiClient.getExportJob(jobId);
        setExportJobs(prev => prev.map(j => 
          j.id === jobId ? job : j
        ));

        if (job.status === ExportJobStatus.COMPLETED || 
            job.status === ExportJobStatus.FAILED) {
          clearInterval(interval);
        }
      } catch (error) {
        console.error('Failed to monitor export job:', error);
        clearInterval(interval);
      }
    }, 2000);
  };

  const handleDownloadExport = async (jobId: number) => {
    try {
      const job = exportJobs.find(j => j.id === jobId);
      if (!job) return;

  const downloadInfo: any = await apiClient.downloadExport(jobId);
  const url = downloadInfo.download_url || downloadInfo.url || downloadInfo;
  // Create a temporary link to trigger download
  const link = document.createElement('a');
  link.href = url;
  link.download = `${job.name}.${job.export_format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Failed to download export:', error);
    }
  };

  const getStatusIcon = (status: ExportJobStatus) => {
    switch (status) {
      case ExportJobStatus.COMPLETED:
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case ExportJobStatus.PROCESSING:
        return <BarChart3 className="h-4 w-4 text-blue-600 animate-pulse" />;
      case ExportJobStatus.FAILED:
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <RefreshCw className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: ExportJobStatus) => {
    const variants = {
      [ExportJobStatus.COMPLETED]: 'success' as const,
      [ExportJobStatus.PROCESSING]: 'primary' as const,
      [ExportJobStatus.FAILED]: 'error' as const,
      [ExportJobStatus.PENDING]: 'secondary' as const,
    };
    
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const exportFormats = [
    { value: 'csv', label: 'CSV' },
    { value: 'json', label: 'JSON' },
    { value: 'xlsx', label: 'Excel (XLSX)' },
    { value: 'parquet', label: 'Parquet' },
    { value: 'xml', label: 'XML' }
  ];

  const completedJobs = exportJobs.filter(job => 
    job.status === ExportJobStatus.COMPLETED
  );

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-green-600" />
            Export Data
            <Badge variant="secondary" className="ml-2">
              {exportJobs.length} jobs
            </Badge>
          </CardTitle>
          <p className="text-sm text-gray-600">
            Export your cleaned data in various formats
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* New Export Form */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900">New Export Job</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNewExport(!showNewExport)}
              >
                <Settings className="h-4 w-4 mr-2" />
                {showNewExport ? 'Hide' : 'Show'} Form
              </Button>
            </div>

            {showNewExport && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Export Name *
                    </label>
                    <Input
                      value={newExport.name}
                      onChange={(e) => setNewExport(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter export name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Export Format *
                    </label>
                    <Select
                      options={exportFormats}
                      value={newExport.export_format}
                      onChange={(value) => setNewExport(prev => ({ ...prev, export_format: value }))}
                      placeholder="Select format"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <Input
                    value={newExport.description}
                    onChange={(e) => setNewExport(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter export description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Row Limit (Optional)
                    </label>
                    <Input
                      type="number"
                      value={newExport.limit_rows || ''}
                      onChange={(e) => setNewExport(prev => ({ 
                        ...prev, 
                        limit_rows: e.target.value ? parseInt(e.target.value) : undefined 
                      }))}
                      placeholder="Leave empty for all rows"
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newExport.include_headers}
                        onChange={(e) => setNewExport(prev => ({ ...prev, include_headers: e.target.checked }))}
                        className="mr-2"
                      />
                      Include column headers
                    </label>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleStartExport}
                    disabled={isLoading || !newExport.name.trim()}
                    className="min-w-[120px]"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        Starting...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Start Export
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => setShowNewExport(false)}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Active Export Jobs */}
          {exportJobs.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Export Jobs</h4>
              {exportJobs.map((job) => (
                <div
                  key={job.id}
                  className="p-4 border rounded-lg space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(job.status)}
                      <div>
                        <h5 className="font-medium text-gray-900">{job.name}</h5>
                        <p className="text-sm text-gray-500">{job.description}</p>
                        <p className="text-xs text-gray-400">
                          Format: {job.export_format.toUpperCase()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {getStatusBadge(job.status)}
                      {job.status === ExportJobStatus.COMPLETED && (
                        <Button
                          size="sm"
                          onClick={() => handleDownloadExport(job.id)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>

                  {job.status === ExportJobStatus.PROCESSING && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Progress</span>
                        <span>{Math.round(job.progress || 0)}%</span>
                      </div>
                      <Progress value={job.progress || 0} className="h-2" />
                    </div>
                  )}

                  {job.status === ExportJobStatus.COMPLETED && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      Export completed successfully! Ready for download.
                    </div>
                  )}

                  {job.status === ExportJobStatus.FAILED && (
                    <div className="flex items-center gap-2 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      Export failed. Please check logs for details.
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Progress Summary */}
          {exportJobs.length > 0 && (
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                <span className="text-sm text-gray-500">
                  {completedJobs.length} of {exportJobs.length} completed
                </span>
              </div>
              <Progress 
                value={exportJobs.length > 0 ? (completedJobs.length / exportJobs.length) * 100 : 0} 
                className="h-3"
              />
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-gray-500">
              {completedJobs.length} exports completed
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={loadExportJobs}
                disabled={isLoading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              
              <Button
                onClick={onComplete}
                disabled={completedJobs.length === 0}
                className="min-w-[120px]"
              >
                Complete Pipeline
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExportSection;
