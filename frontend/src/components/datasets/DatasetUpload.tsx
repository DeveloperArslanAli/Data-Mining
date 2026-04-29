import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  Upload, 
  FileText, 
  X, 
  CheckCircle, 
  AlertCircle,
  Database,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export interface DatasetUploadProps {
  onUpload: (file: File, metadata: DatasetMetadata) => Promise<void>;
  onCancel?: () => void;
  className?: string;
}

export interface DatasetMetadata {
  name: string;
  description?: string;
  tags?: string[];
}

interface UploadFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress: number;
  error?: string;
}

const DatasetUpload: React.FC<DatasetUploadProps> = ({ 
  onUpload, 
  onCancel, 
  className 
}) => {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [metadata, setMetadata] = useState<DatasetMetadata>({
    name: '',
    description: '',
    tags: []
  });

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

  const handleUpload = async () => {
    if (!metadata.name.trim()) {
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
        toast.error(`${uploadFile.file.name}: ${error}`);
        return;
      }
    }

    // Upload each file
    for (const uploadFile of uploadFiles) {
      try {
        // Update status to uploading
        setUploadFiles(prev => 
          prev.map(f => 
            f.id === uploadFile.id 
              ? { ...f, status: 'uploading', progress: 0 }
              : f
          )
        );

  // Call upload function with progress
  await onUpload(uploadFile.file, metadata);

        // Update status to completed
        setUploadFiles(prev => 
          prev.map(f => 
            f.id === uploadFile.id 
              ? { ...f, status: 'completed', progress: 100 }
              : f
          )
        );

        toast.success(`${uploadFile.file.name} uploaded successfully`);

      } catch (error) {
        // Update status to error
        setUploadFiles(prev => 
          prev.map(f => 
            f.id === uploadFile.id 
              ? { ...f, status: 'error', error: error instanceof Error ? error.message : 'Upload failed' }
              : f
          )
        );

        toast.error(`${uploadFile.file.name}: Upload failed`);
      }
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    
    switch (extension) {
      case '.csv':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case '.json':
        return <Database className="h-5 w-5 text-green-500" />;
      case '.xml':
        return <FileText className="h-5 w-5 text-orange-500" />;
      case '.xlsx':
      case '.xls':
        return <BarChart3 className="h-5 w-5 text-green-600" />;
      case '.parquet':
        return <Database className="h-5 w-5 text-purple-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Metadata Form */}
      <Card>
        <CardHeader>
          <CardTitle>Dataset Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Dataset Name"
            placeholder="Enter dataset name"
            value={metadata.name}
            onChange={(e) => setMetadata(prev => ({ ...prev, name: e.target.value }))}
            required
          />
          
          <Input
            label="Description"
            placeholder="Enter dataset description (optional)"
            value={metadata.description}
            onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
          />
          
          <Input
            label="Tags"
            placeholder="Enter tags separated by commas (optional)"
            value={metadata.tags?.join(', ') || ''}
            onChange={(e) => setMetadata(prev => ({ 
              ...prev, 
              tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
            }))}
          />
        </CardContent>
      </Card>

      {/* File Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Files</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
              isDragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            )}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              or click to select files
            </p>
            <p className="text-xs text-gray-400">
              Supported formats: CSV, JSON, XML, Excel (.xlsx, .xls), Parquet
              <br />
              Maximum file size: 100MB
            </p>
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {uploadFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Selected Files ({uploadFiles.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {uploadFiles.map((uploadFile) => (
                <div
                  key={uploadFile.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {getFileIcon(uploadFile.file.name)}
                    <div>
                      <p className="font-medium text-sm">{uploadFile.file.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(uploadFile.file.size)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {/* Progress Bar */}
                    {uploadFile.status === 'uploading' && (
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadFile.progress}%` }}
                        />
                      </div>
                    )}
                    
                    {/* Status Icon */}
                    {uploadFile.status === 'completed' && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    
                    {uploadFile.status === 'error' && (
                      <span className="group relative" aria-label={uploadFile.error} title={uploadFile.error}>
                        <AlertCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
                        <span className="sr-only">{uploadFile.error}</span>
                      </span>
                    )}
                    
                    {/* Remove Button */}
                    {uploadFile.status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(uploadFile.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        
        <Button
          onClick={handleUpload}
          disabled={uploadFiles.length === 0 || !metadata.name.trim()}
          loading={uploadFiles.some(f => f.status === 'uploading')}
        >
          Upload Dataset{uploadFiles.length > 1 ? 's' : ''}
        </Button>
      </div>
    </div>
  );
};

export default DatasetUpload;
