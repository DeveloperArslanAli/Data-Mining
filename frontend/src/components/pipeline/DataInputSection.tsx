/**
 * Data Mining Platform - Data Input Section
 * 
 * Unified data input component that supports both file upload and URL input
 * for web crawling, providing a seamless dual-input experience.
 */

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { 
  Upload, 
  Globe, 
  FileText, 
  X, 
  CheckCircle, 
  AlertCircle,
  Database,
  BarChart3,
  Play,
  Settings,
  Target,
  Filter
} from 'lucide-react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

// Types
import { Dataset, DatasetFormat, DatasetStatus } from '@/types';

// API
import apiClient from '@/lib/api';

// Pipeline types
import { PipelineStep } from './DataPipeline';

export interface DataInputSectionProps {
  onDatasetReceived: (dataset: Dataset) => void;
  onInputComplete: (step: PipelineStep) => void;
  className?: string;
}

export interface DatasetMetadata {
  name: string;
  description?: string;
  tags?: string[];
}

export interface CrawlingConfig {
  maxDepth: number;
  maxPages: number;
  delay: number;
  followLinks: boolean;
  extractImages: boolean;
  extractTables: boolean;
  customSelectors: Record<string, string>;
  filters: Record<string, any>;
}

interface UploadFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress: number;
  error?: string;
}

interface CrawlingJob {
  id: string;
  url: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  pagesCrawled: number;
  totalPages: number;
  dataExtracted: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
}

const DataInputSection: React.FC<DataInputSectionProps> = ({ 
  onDatasetReceived,
  onInputComplete,
  className 
}) => {
  // Input method state
  const [activeTab, setActiveTab] = useState<'upload' | 'crawling'>('upload');
  
  // File upload state
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [uploadMetadata, setUploadMetadata] = useState<DatasetMetadata>({
    name: '',
    description: '',
    tags: []
  });
  const [isUploading, setIsUploading] = useState(false);

  // Web crawling state
  const [targetUrl, setTargetUrl] = useState('');
  const [crawlingJobs, setCrawlingJobs] = useState<CrawlingJob[]>([]);
  const [isCrawling, setIsCrawling] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [crawlingConfig, setCrawlingConfig] = useState<CrawlingConfig>({
    maxDepth: 2,
    maxPages: 100,
    delay: 1000,
    followLinks: true,
    extractImages: false,
    extractTables: true,
    customSelectors: {},
    filters: {},
  });

  // File upload handlers
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadFile[] = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending',
      progress: 0
    }));
    
    setUploadFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/json': ['.json'],
      'application/xml': ['.xml'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/octet-stream': ['.parquet']
    },
    multiple: true,
    maxSize: 100 * 1024 * 1024, // 100MB
  });

  const removeFile = (fileId: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > 100 * 1024 * 1024) {
      return 'File size must be less than 100MB';
    }

    // Check file extension
    const allowedExtensions = ['.csv', '.json', '.xml', '.xlsx', '.xls', '.parquet'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!allowedExtensions.includes(fileExtension)) {
      return `File type not supported. Allowed types: ${allowedExtensions.join(', ')}`;
    }

    return null;
  };

  const getFileFormat = (file: File): DatasetFormat => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'csv':
        return DatasetFormat.CSV;
      case 'xlsx':
      case 'xls':
        return DatasetFormat.XLSX;
      case 'json':
        return DatasetFormat.JSON;
      case 'xml':
        return DatasetFormat.XML;
      case 'parquet':
        return DatasetFormat.PARQUET;
      default:
        return DatasetFormat.CSV;
    }
  };

  const handleFileUpload = async () => {
    if (!uploadMetadata.name.trim()) {
      toast.error('Please provide a dataset name');
      return;
    }

    if (uploadFiles.length === 0) {
      toast.error('Please select at least one file to upload');
      return;
    }

    // Validate all files
    for (const uploadFile of uploadFiles) {
      const error = validateFile(uploadFile.file);
      if (error) {
        toast.error(`File ${uploadFile.file.name}: ${error}`);
        return;
      }
    }

    setIsUploading(true);

    try {
      // Upload each file
      for (const uploadFile of uploadFiles) {
        // Update file status to uploading
        setUploadFiles(prev => prev.map(f => 
          f.id === uploadFile.id 
            ? { ...f, status: 'uploading', progress: 0 }
            : f
        ));

        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadFiles(prev => prev.map(f => {
            if (f.id === uploadFile.id && f.progress < 90) {
              return { ...f, progress: f.progress + 10 };
            }
            return f;
          }));
        }, 200);

        // Upload file
        const response = await apiClient.uploadDataset(
          uploadFile.file,
          uploadMetadata.name + (uploadFiles.length > 1 ? ` - ${uploadFile.file.name}` : ''),
          uploadMetadata.description
        );

        clearInterval(progressInterval);

        // Update file status to completed
        setUploadFiles(prev => prev.map(f => 
          f.id === uploadFile.id 
            ? { ...f, status: 'completed', progress: 100 }
            : f
        ));

        // Notify parent component
        onDatasetReceived(response.dataset);
      }

      toast.success('Files uploaded successfully!');
      onInputComplete('preview');
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to upload files';
      toast.error(errorMessage);
      
      // Update failed files
      setUploadFiles(prev => prev.map(f => ({
        ...f,
        status: 'error',
        error: errorMessage
      })));
    } finally {
      setIsUploading(false);
    }
  };

  // Web crawling handlers
  const validateUrl = (url: string): string | null => {
    try {
      new URL(url);
      return null;
    } catch {
      return 'Please enter a valid URL';
    }
  };

  const handleStartCrawling = async () => {
    if (!targetUrl.trim()) {
      toast.error('Please enter a target URL');
      return;
    }

    const urlError = validateUrl(targetUrl);
    if (urlError) {
      toast.error(urlError);
      return;
    }

    setIsCrawling(true);

    try {
      // Create crawling job
      const response = await apiClient.startCrawlingJob({
        urls: [targetUrl],
        max_depth: crawlingConfig.maxDepth,
        max_pages: crawlingConfig.maxPages,
        delay: crawlingConfig.delay
      });

      const newJob: CrawlingJob = {
        id: response.job_id.toString(),
        url: targetUrl,
        status: 'processing',
        progress: 0,
        pagesCrawled: 0,
        totalPages: crawlingConfig.maxPages,
        dataExtracted: 0,
        createdAt: new Date(),
        startedAt: new Date()
      };

      setCrawlingJobs(prev => [...prev, newJob]);

      // Start monitoring the job
      monitorCrawlingJob(newJob.id);

      toast.success('Crawling job started successfully!');
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to start crawling job';
      toast.error(errorMessage);
    } finally {
      setIsCrawling(false);
    }
  };

  const monitorCrawlingJob = async (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const job = await apiClient.getCrawlingJob(parseInt(jobId));
        
        setCrawlingJobs(prev => prev.map(j => {
          if (j.id === jobId) {
            return {
              ...j,
              status: job.status === 'completed' ? 'completed' : 'processing',
              progress: job.pages_crawled / job.max_pages * 100,
              pagesCrawled: job.pages_crawled,
              totalPages: job.max_pages,
              dataExtracted: job.data_extracted ? 1 : 0
            };
          }
          return j;
        }));

        // Check if job is completed
        if (job.status === 'completed') {
          clearInterval(interval);
          
          // Get the crawled data
          const crawledData = await apiClient.getCrawledData(parseInt(jobId), 'json');
          
          // Create a mock dataset from crawled data
          const mockDataset: Dataset = {
            id: parseInt(jobId),
            name: `Crawled Data - ${targetUrl}`,
            description: `Data crawled from ${targetUrl}`,
            filename: `crawled_${jobId}.json`,
            file_path: `/crawled/${jobId}.json`,
            file_size: JSON.stringify(crawledData).length,
            format: DatasetFormat.JSON,
            row_count: Array.isArray(crawledData) ? crawledData.length : 1,
            column_count: Array.isArray(crawledData) && crawledData.length > 0 ? Object.keys(crawledData[0]).length : 0,
            column_names: Array.isArray(crawledData) && crawledData.length > 0 ? Object.keys(crawledData[0]) : [],
            status: DatasetStatus.UPLOADED,
            processing_progress: 100,
            created_at: new Date().toISOString(),
            owner_id: 1
          };

          toast.success('Crawling completed successfully!');
          onDatasetReceived(mockDataset);
          onInputComplete('preview');
        }
      } catch (error) {
        console.error('Failed to monitor crawling job:', error);
        clearInterval(interval);
      }
    }, 3000);
  };

  const removeCrawlingJob = (jobId: string) => {
    setCrawlingJobs(prev => prev.filter(j => j.id !== jobId));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'processing':
        return <BarChart3 className="h-4 w-4 text-blue-600 animate-pulse" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'success' as const,
      processing: 'primary' as const,
      failed: 'error' as const,
      pending: 'secondary' as const,
    };
    
    return <Badge variant={variants[status as keyof typeof variants]}>{status}</Badge>;
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Input Method Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600" />
            Data Input Method
          </CardTitle>
          <p className="text-sm text-gray-600">
            Choose how you want to provide data for processing
          </p>
        </CardHeader>
        <CardContent>
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('upload')}
              className={cn(
                'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors',
                activeTab === 'upload'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <div className="flex items-center justify-center gap-2">
                <Upload className="h-4 w-4" />
                File Upload
              </div>
            </button>
            <button
              onClick={() => setActiveTab('crawling')}
              className={cn(
                'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors',
                activeTab === 'crawling'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <div className="flex items-center justify-center gap-2">
                <Globe className="h-4 w-4" />
                Web Crawling
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* File Upload Tab */}
      {activeTab === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-green-600" />
              Upload Dataset Files
            </CardTitle>
            <p className="text-sm text-gray-600">
              Drag and drop files or click to browse. Supports CSV, JSON, XML, Excel, and Parquet formats.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* File Drop Zone */}
            <div
              {...getRootProps()}
              className={cn(
                'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
                isDragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              )}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
              </p>
              <p className="text-sm text-gray-500 mb-4">
                or click to browse files
              </p>
              <p className="text-xs text-gray-400">
                Supports: CSV, JSON, XML, XLSX, XLS, Parquet (Max: 100MB per file)
              </p>
            </div>

            {/* Selected Files */}
            {uploadFiles.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Selected Files</h4>
                {uploadFiles.map((uploadFile) => (
                  <div
                    key={uploadFile.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {uploadFile.file.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {uploadFile.status === 'uploading' && (
                        <div className="w-24">
                          <Progress value={uploadFile.progress} className="h-2" />
                        </div>
                      )}
                      
                      {uploadFile.status === 'completed' && (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                      
                      {uploadFile.status === 'error' && (
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-5 w-5 text-red-600" />
                          <span className="text-sm text-red-600">{uploadFile.error}</span>
                        </div>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeFile(uploadFile.id)}
                        disabled={uploadFile.status === 'uploading'}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Metadata Form */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Dataset Information</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dataset Name *
                </label>
                <Input
                  value={uploadMetadata.name}
                  onChange={(e) => setUploadMetadata(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter dataset name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <Input
                  value={uploadMetadata.description || ''}
                  onChange={(e) => setUploadMetadata(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter dataset description (optional)"
                />
              </div>
            </div>

            {/* Upload Actions */}
            <div className="flex items-center justify-between pt-4">
              <div className="text-sm text-gray-500">
                {uploadFiles.length} file(s) selected
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setUploadFiles([]);
                    setUploadMetadata({ name: '', description: '', tags: [] });
                  }}
                  disabled={isUploading}
                >
                  Clear All
                </Button>
                
                <Button
                  onClick={handleFileUpload}
                  disabled={isUploading || uploadFiles.length === 0 || !uploadMetadata.name.trim()}
                  className="min-w-[120px]"
                >
                  {isUploading ? (
                    <>
                      <BarChart3 className="h-4 w-4 animate-spin mr-2" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Dataset
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Web Crawling Tab */}
      {activeTab === 'crawling' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-purple-600" />
              Web Data Crawling
            </CardTitle>
            <p className="text-sm text-gray-600">
              Extract data from websites by providing URLs and crawling configuration.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* URL Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Website URL *
              </label>
              <div className="flex gap-3">
                <Input
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="flex-1"
                />
                <Button
                  onClick={handleStartCrawling}
                  disabled={isCrawling || !targetUrl.trim()}
                  className="min-w-[120px]"
                >
                  {isCrawling ? (
                    <>
                      <BarChart3 className="h-4 w-4 animate-spin mr-2" />
                      Crawling...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Start Crawling
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Advanced Options */}
            <div>
              <button
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                <Settings className="h-4 w-4" />
                Advanced Options
                {showAdvancedOptions ? ' (Hide)' : ' (Show)'}
              </button>
              
              {showAdvancedOptions && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Depth
                      </label>
                      <select
                        value={crawlingConfig.maxDepth}
                        onChange={(e) => setCrawlingConfig(prev => ({ ...prev, maxDepth: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={1}>1 level</option>
                        <option value={2}>2 levels</option>
                        <option value={3}>3 levels</option>
                        <option value={4}>4 levels</option>
                        <option value={5}>5 levels</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Pages
                      </label>
                      <select
                        value={crawlingConfig.maxPages}
                        onChange={(e) => setCrawlingConfig(prev => ({ ...prev, maxPages: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={10}>10 pages</option>
                        <option value={50}>50 pages</option>
                        <option value={100}>100 pages</option>
                        <option value={500}>500 pages</option>
                        <option value={1000}>1000 pages</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Delay Between Requests
                      </label>
                      <select
                        value={crawlingConfig.delay}
                        onChange={(e) => setCrawlingConfig(prev => ({ ...prev, delay: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={0}>No delay</option>
                        <option value={500}>500ms</option>
                        <option value={1000}>1 second</option>
                        <option value={2000}>2 seconds</option>
                        <option value={5000}>5 seconds</option>
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Options
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={crawlingConfig.followLinks}
                            onChange={(e) => setCrawlingConfig(prev => ({ ...prev, followLinks: e.target.checked }))}
                            className="mr-2"
                          />
                          Follow internal links
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={crawlingConfig.extractTables}
                            onChange={(e) => setCrawlingConfig(prev => ({ ...prev, extractTables: e.target.checked }))}
                            className="mr-2"
                          />
                          Extract table data
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Active Crawling Jobs */}
            {crawlingJobs.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Active Crawling Jobs</h4>
                {crawlingJobs.map((job) => (
                  <div
                    key={job.id}
                    className="p-4 border rounded-lg space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(job.status)}
                        <div>
                          <p className="font-medium text-gray-900 truncate">
                            {job.url}
                          </p>
                          <p className="text-sm text-gray-500">
                            Started {job.createdAt.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {getStatusBadge(job.status)}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeCrawlingJob(job.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {job.status === 'processing' && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Progress: {job.pagesCrawled} / {job.totalPages} pages</span>
                          <span>{Math.round(job.progress)}%</span>
                        </div>
                        <Progress value={job.progress} className="h-2" />
                      </div>
                    )}
                    
                    {job.status === 'completed' && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        Completed! {job.pagesCrawled} pages crawled, {job.dataExtracted} data points extracted
                      </div>
                    )}
                    
                    {job.status === 'failed' && (
                      <div className="flex items-center gap-2 text-sm text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        Failed: {job.errorMessage || 'Unknown error'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DataInputSection;
