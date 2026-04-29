import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { 
  Download, 
  FileText, 
  Database, 
  Settings, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Filter,
  Columns,
  SortAsc,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { ExportJob as ExportJobType } from '@/types';

export interface ExportOptions {
  format: string;
  includeHeaders: boolean;
  selectedColumns: string[];
  filters: Record<string, any>;
  sorting: Record<string, 'asc' | 'desc'>;
  limitRows?: number;
  tableName?: string;
}

export interface DataExportProps {
  datasetId: string;
  datasetName: string;
  availableColumns: string[];
  totalRows: number;
  onExport: (options: ExportOptions) => Promise<void>;
  onDownload: (jobId: string) => Promise<void>;
  className?: string;
}

const DataExport: React.FC<DataExportProps> = ({
  datasetId,
  datasetName,
  availableColumns,
  totalRows,
  onExport,
  onDownload,
  className,
}) => {
  const [exportJobs, setExportJobs] = useState<ExportJobType[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    includeHeaders: true,
    selectedColumns: availableColumns,
    filters: {},
    sorting: {},
  });
  const [isLoading, setIsLoading] = useState(false);

  const exportFormats = [
    { value: 'csv', label: 'CSV (Comma Separated Values)' },
    { value: 'json', label: 'JSON (JavaScript Object Notation)' },
    { value: 'xml', label: 'XML (Extensible Markup Language)' },
    { value: 'xlsx', label: 'Excel (.xlsx)' },
    { value: 'parquet', label: 'Parquet (Columnar Format)' },
    { value: 'sql', label: 'SQL (Database Schema)' },
  ];

  const handleStartExport = async () => {
    try {
      setIsLoading(true);
      // Start export via backend
      await api.startExportJob({
        dataset_id: Number(datasetId),
        export_format: exportOptions.format,
        include_headers: exportOptions.includeHeaders ? exportOptions.selectedColumns : undefined,
        exclude_headers: exportOptions.includeHeaders ? undefined : exportOptions.selectedColumns,
        filters: exportOptions.filters,
        sorting: exportOptions.sorting,
        limit_rows: exportOptions.limitRows,
      });
      toast.success('Export job started');
      setIsModalOpen(false);
      // Refresh jobs
      await refreshJobs();
    } catch (error) {
      toast.error('Failed to start export job');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshJobs = async () => {
    try {
      const jobs = await api.getExportJobs(Number(datasetId) || undefined);
      setExportJobs(jobs || []);
    } catch {
      setExportJobs([]);
    }
  };

  useEffect(() => {
    refreshJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasetId]);

  const handleDownload = async (jobId: string) => {
    try {
      await onDownload(jobId);
      toast.success('Download started');
    } catch (error) {
      toast.error('Failed to download file');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <Download className="h-4 w-4 text-blue-500 animate-pulse" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'success' as const,
      failed: 'error' as const,
      processing: 'primary' as const,
      pending: 'secondary' as const,
    };
    
    return <Badge variant={variants[status as keyof typeof variants]}>{status}</Badge>;
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'csv':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'json':
        return <Database className="h-4 w-4 text-green-500" />;
      case 'xml':
        return <FileText className="h-4 w-4 text-orange-500" />;
      case 'xlsx':
        return <FileText className="h-4 w-4 text-green-600" />;
      case 'parquet':
        return <Database className="h-4 w-4 text-purple-500" />;
      case 'sql':
        return <Database className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Quick Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-blue-500" />
            Quick Export
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exportFormats.slice(0, 6).map((format) => (
              <Button
                key={format.value}
                variant="outline"
                className="h-20 flex flex-col items-center justify-center gap-2"
                onClick={() => {
                  setExportOptions(prev => ({ ...prev, format: format.value }));
                  setIsModalOpen(true);
                }}
              >
                {getFormatIcon(format.value)}
                <span className="text-sm font-medium">{format.label.split(' ')[0]}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Advanced Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-500" />
            Advanced Export Options
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Configure Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Export Jobs */}
      {exportJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-blue-500" />
              Export Jobs ({exportJobs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {exportJobs.map((job) => (
                <div
                  key={job.id}
                  className="border rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(job.status)}
                      <div>
                        <h4 className="font-medium text-gray-900">{job.name || `${datasetName} - ${String(job.export_format).toUpperCase()}`}</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          {getFormatIcon(String(job.export_format))}
                          <span>{String(job.export_format).toUpperCase()}</span>
                          <span>•</span>
                          <span>Started {new Date(job.created_at).toLocaleTimeString()}</span>
                          {job.rows_exported && (
                            <>
                              <span>•</span>
                              <span>{job.rows_exported.toLocaleString()} rows</span>
                            </>
                          )}
                          {job.file_size && (
                            <>
                              <span>•</span>
                              <span>{formatFileSize(job.file_size)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(job.status)}
            {job.status === 'completed' && (
                        <Button
                          size="sm"
              onClick={() => handleDownload(String(job.id))}
                          className="flex items-center gap-1"
                        >
                          <Download className="h-3 w-3" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <Progress
                    value={job.progress || 0}
                    max={100}
                    size="sm"
                    variant={job.status === 'failed' ? 'error' : 'default'}
                    showLabel
                  />
                  
                  {job.error_message && (
                    <p className="text-sm text-red-600 mt-2">{job.error_message}</p>
                  )}
                  
                  {job.completed_at && (
                    <p className="text-sm text-gray-500 mt-2">
                      Completed at {new Date(job.completed_at).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Configuration Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Configure Export"
        size="xl"
      >
        <ModalBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Settings */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Basic Settings</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Export Format
                </label>
                <Select
                  options={exportFormats}
                  value={exportOptions.format}
                  onChange={(value) => setExportOptions(prev => ({ ...prev, format: value }))}
                  placeholder="Select format"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Table Name (for SQL export)
                </label>
                <Input
                  value={exportOptions.tableName || ''}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, tableName: e.target.value }))}
                  placeholder="Enter table name"
                  disabled={exportOptions.format !== 'sql'}
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="include-headers"
                  checked={exportOptions.includeHeaders}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, includeHeaders: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="include-headers" className="ml-2 text-sm text-gray-700">
                  Include column headers
                </label>
              </div>
            </div>

            {/* Column Selection */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Column Selection</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Columns
                </label>
                <div className="max-h-40 overflow-y-auto border rounded-md p-2">
                  {availableColumns.map((column) => (
                    <div key={column} className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        id={`column-${column}`}
                        checked={exportOptions.selectedColumns.includes(column)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setExportOptions(prev => ({
                              ...prev,
                              selectedColumns: [...prev.selectedColumns, column]
                            }));
                          } else {
                            setExportOptions(prev => ({
                              ...prev,
                              selectedColumns: prev.selectedColumns.filter(c => c !== column)
                            }));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor={`column-${column}`} className="ml-2 text-sm text-gray-700">
                        {column}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Row Limit (optional)
                </label>
                <Input
                  type="number"
                  value={exportOptions.limitRows || ''}
                  onChange={(e) => setExportOptions(prev => ({ 
                    ...prev, 
                    limitRows: e.target.value ? parseInt(e.target.value) : undefined 
                  }))}
                  placeholder="Leave empty for all rows"
                  min="1"
                  max={totalRows}
                />
              </div>
            </div>
          </div>
        </ModalBody>
        
        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => setIsModalOpen(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleStartExport}
            disabled={isLoading || exportOptions.selectedColumns.length === 0}
            loading={isLoading}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Start Export
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default DataExport;
