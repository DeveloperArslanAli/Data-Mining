/**
 * Data Mining Platform - Dataset Upload Page
 */

import React, { useState, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useDropzone } from 'react-dropzone';
import {
  Upload,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  Info,
  Database,
  ArrowLeft,
  Settings,
  Eye,
  EyeOff,
} from 'lucide-react';

// Components
import { Button } from '@/components/ui/Button';

// Hooks
import { useAuthStore } from '@/store/auth';

// Types
import { DatasetFormat } from '@/types';

// Utils
import { formatFileSize, cn } from '@/lib/utils';

interface UploadFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  preview?: any;
}

export default function DatasetUploadPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [autoProcess, setAutoProcess] = useState(true);
  const [validateData, setValidateData] = useState(true);
  const [generatePreview, setGeneratePreview] = useState(true);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadFile[] = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending',
      progress: 0,
    }));

    setUploadFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/json': ['.json'],
      'application/xml': ['.xml'],
      'application/octet-stream': ['.parquet'],
    },
    maxSize: 100 * 1024 * 1024, // 100MB
    multiple: true,
  });

  const removeFile = (fileId: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const getFileFormat = (file: File): DatasetFormat => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'csv':
        return 'CSV';
      case 'xlsx':
      case 'xls':
        return 'XLSX';
      case 'json':
        return 'JSON';
      case 'xml':
        return 'XML';
      case 'parquet':
        return 'PARQUET';
      default:
        return 'CSV';
    }
  };

  const validateFile = (file: File): string | null => {
    // File size validation
    if (file.size > 100 * 1024 * 1024) {
      return 'File size exceeds 100MB limit';
    }

    // File type validation
    const allowedTypes = [
      'text/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/json',
      'application/xml',
      'application/octet-stream',
    ];

    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(csv|xlsx|xls|json|xml|parquet)$/i)) {
      return 'File type not supported';
    }

    return null;
  };

  const handleUpload = async () => {
    if (uploadFiles.length === 0) return;

    setIsUploading(true);

    // Simulate upload process
    for (const uploadFile of uploadFiles) {
      if (uploadFile.status === 'pending') {
        // Update status to uploading
        setUploadFiles(prev => 
          prev.map(f => 
            f.id === uploadFile.id 
              ? { ...f, status: 'uploading' }
              : f
          )
        );

        // Simulate progress
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 200));
          setUploadFiles(prev => 
            prev.map(f => 
              f.id === uploadFile.id 
                ? { ...f, progress }
                : f
            )
          );
        }

        // Simulate success
        setUploadFiles(prev => 
          prev.map(f => 
            f.id === uploadFile.id 
              ? { ...f, status: 'success', progress: 100 }
              : f
          )
        );
      }
    }

    setIsUploading(false);

    // Redirect to datasets page after successful upload
    setTimeout(() => {
      router.push('/datasets');
    }, 2000);
  };

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'uploading':
        return <Upload className="w-5 h-5 text-blue-500 animate-pulse" />;
      default:
        return <FileText className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: UploadFile['status']) => {
    switch (status) {
      case 'success':
        return 'border-green-200 bg-green-50 dark:bg-green-900/20';
      case 'error':
        return 'border-red-200 bg-red-50 dark:bg-red-900/20';
      case 'uploading':
        return 'border-blue-200 bg-blue-50 dark:bg-blue-900/20';
      default:
        return 'border-gray-200 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  return (
    <>
      <Head>
        <title>Upload Dataset - Data Mining Platform</title>
        <meta name="description" content="Upload a new dataset" />
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Upload Dataset</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Upload your data files for processing and analysis
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Drop Zone */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div
                {...getRootProps()}
                className={cn(
                  'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
                  isDragActive
                    ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                )}
              >
                <input {...getInputProps()} />
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    or click to select files
                  </p>
                </div>
                <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                  Supported formats: CSV, XLSX, JSON, XML, Parquet (max 100MB each)
                </div>
              </div>
            </div>

            {/* File List */}
            {uploadFiles.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Files to Upload ({uploadFiles.length})
                </h3>
                <div className="space-y-3">
                  {uploadFiles.map((uploadFile) => {
                    const error = validateFile(uploadFile.file);
                    const format = getFileFormat(uploadFile.file);
                    
                    return (
                      <div
                        key={uploadFile.id}
                        className={cn(
                          'border rounded-lg p-4 transition-colors',
                          getStatusColor(uploadFile.status)
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {getStatusIcon(uploadFile.status)}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {uploadFile.file.name}
                              </p>
                              <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                                <span>{formatFileSize(uploadFile.file.size)}</span>
                                <span>{format}</span>
                                {error && (
                                  <span className="text-red-500">{error}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {uploadFile.status === 'uploading' && (
                              <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${uploadFile.progress}%` }}
                                />
                              </div>
                            )}
                            <button
                              onClick={() => removeFile(uploadFile.id)}
                              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Upload Actions */}
            {uploadFiles.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Button
                      onClick={handleUpload}
                      loading={isUploading}
                      disabled={isUploading || uploadFiles.some(f => validateFile(f.file))}
                      leftIcon={<Upload className="w-4 h-4" />}
                    >
                      {isUploading ? 'Uploading...' : 'Upload Files'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setUploadFiles([])}
                      disabled={isUploading}
                    >
                      Clear All
                    </Button>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {uploadFiles.filter(f => !validateFile(f.file)).length} of {uploadFiles.length} files ready
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Settings Panel */}
          <div className="space-y-6">
            {/* Upload Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Upload Settings</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  leftIcon={showAdvanced ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                >
                  {showAdvanced ? 'Hide' : 'Show'} Advanced
                </Button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Auto-process data</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Automatically clean and validate uploaded data
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoProcess}
                    onChange={(e) => setAutoProcess(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>

                {showAdvanced && (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Validate data</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Check for data quality issues
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={validateData}
                        onChange={(e) => setValidateData(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Generate preview</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Create data preview for quick review
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={generatePreview}
                        onChange={(e) => setGeneratePreview(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Upload Guidelines */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Upload Guidelines
                  </h4>
                  <ul className="mt-2 text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• Maximum file size: 100MB per file</li>
                    <li>• Supported formats: CSV, XLSX, JSON, XML, Parquet</li>
                    <li>• Ensure your data has headers</li>
                    <li>• UTF-8 encoding recommended</li>
                    <li>• Large files may take longer to process</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push('/datasets')}
                  leftIcon={<Database className="w-4 h-4" />}
                >
                  View All Datasets
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push('/cleaning')}
                  leftIcon={<Settings className="w-4 h-4" />}
                >
                  Data Cleaning Tools
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
