import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { 
  Activity, 
  Sparkles, 
  Settings, 
  Play, 
  Pause, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Target,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export interface CleaningOperation {
  id: string;
  name: string;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  targetColumns?: string[];
  parameters?: Record<string, any>;
  createdAt: Date;
  completedAt?: Date;
  errorMessage?: string;
}

export interface CleaningSuggestion {
  type: string;
  operation: string;
  description: string;
  columns?: string[];
  priority: 'high' | 'medium' | 'low';
  estimatedImpact: 'high' | 'medium' | 'low';
}

export interface CleaningOperationsProps {
  datasetId: string;
  datasetName: string;
  onOperationStart: (operation: Partial<CleaningOperation>) => Promise<void>;
  onOperationCancel: (operationId: string) => Promise<void>;
  className?: string;
}

const CleaningOperations: React.FC<CleaningOperationsProps> = ({
  datasetId,
  datasetName,
  onOperationStart,
  onOperationCancel,
  className,
}) => {
  const [operations, setOperations] = useState<CleaningOperation[]>([]);
  const [suggestions, setSuggestions] = useState<CleaningSuggestion[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<Partial<CleaningOperation> | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const operationTypes = [
    { value: 'remove_duplicates', label: 'Remove Duplicates' },
    { value: 'handle_missing_values', label: 'Handle Missing Values' },
    { value: 'remove_outliers', label: 'Remove Outliers' },
    { value: 'data_type_conversion', label: 'Data Type Conversion' },
    { value: 'string_cleaning', label: 'String Cleaning' },
    { value: 'normalization', label: 'Normalization' },
    { value: 'encoding', label: 'Encoding' },
    { value: 'custom_transformation', label: 'Custom Transformation' },
  ];

  const missingValueStrategies = [
    { value: 'drop', label: 'Drop rows with missing values' },
    { value: 'fill_mean', label: 'Fill with mean (numeric)' },
    { value: 'fill_median', label: 'Fill with median (numeric)' },
    { value: 'fill_mode', label: 'Fill with mode (categorical)' },
    { value: 'fill_forward', label: 'Forward fill' },
    { value: 'fill_backward', label: 'Backward fill' },
    { value: 'interpolate', label: 'Interpolate' },
  ];

  const outlierMethods = [
    { value: 'iqr', label: 'IQR Method' },
    { value: 'zscore', label: 'Z-Score Method' },
    { value: 'isolation_forest', label: 'Isolation Forest' },
    { value: 'local_outlier_factor', label: 'Local Outlier Factor' },
  ];

  useEffect(() => {
    // Load mock suggestions for demonstration
    setSuggestions([
      {
        type: 'missing_values',
        operation: 'handle_missing_values',
        description: 'Handle missing values in 3 columns',
        columns: ['age', 'income', 'education'],
        priority: 'high',
        estimatedImpact: 'high',
      },
      {
        type: 'duplicates',
        operation: 'remove_duplicates',
        description: 'Remove 15 duplicate rows',
        priority: 'medium',
        estimatedImpact: 'medium',
      },
      {
        type: 'outliers',
        operation: 'remove_outliers',
        description: 'Handle outliers in 2 numeric columns',
        columns: ['age', 'income'],
        priority: 'low',
        estimatedImpact: 'medium',
      },
    ]);
  }, []);

  const handleStartOperation = async (operation: Partial<CleaningOperation>) => {
    try {
      setIsLoading(true);
      await onOperationStart(operation);
      
      const newOperation: CleaningOperation = {
        id: Math.random().toString(36).substr(2, 9),
        name: operation.name || 'Cleaning Operation',
        type: operation.type || 'custom',
        status: 'processing',
        progress: 0,
        targetColumns: operation.targetColumns,
        parameters: operation.parameters,
        createdAt: new Date(),
      };
      
      setOperations(prev => [...prev, newOperation]);
      setIsModalOpen(false);
      setSelectedOperation(null);
      
      toast.success('Cleaning operation started successfully');
      
      // Simulate progress updates
      simulateProgress(newOperation.id);
      
    } catch (error) {
      toast.error('Failed to start cleaning operation');
    } finally {
      setIsLoading(false);
    }
  };

  const simulateProgress = (operationId: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        setOperations(prev => 
          prev.map(op => 
            op.id === operationId 
              ? { ...op, status: 'completed', progress: 100, completedAt: new Date() }
              : op
          )
        );
        
        toast.success('Cleaning operation completed');
      } else {
        setOperations(prev => 
          prev.map(op => 
            op.id === operationId 
              ? { ...op, progress: Math.round(progress) }
              : op
          )
        );
      }
    }, 1000);
  };

  const handleCancelOperation = async (operationId: string) => {
    try {
      await onOperationCancel(operationId);
      setOperations(prev => 
        prev.map(op => 
          op.id === operationId 
            ? { ...op, status: 'failed', errorMessage: 'Operation cancelled by user' }
            : op
        )
      );
      toast.success('Operation cancelled');
    } catch (error) {
      toast.error('Failed to cancel operation');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
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

  return (
    <div className={cn('space-y-6', className)}>
      {/* AI Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            AI-Powered Cleaning Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{suggestion.description}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="info" size="sm">{suggestion.operation}</Badge>
                    <Badge 
                      variant={suggestion.priority === 'high' ? 'error' : suggestion.priority === 'medium' ? 'warning' : 'default'} 
                      size="sm"
                    >
                      {suggestion.priority} priority
                    </Badge>
                    {suggestion.columns && (
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Target className="h-3 w-3" />
                        {suggestion.columns.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedOperation({
                      type: suggestion.operation,
                      name: `Auto: ${suggestion.description}`,
                      targetColumns: suggestion.columns,
                    });
                    setIsModalOpen(true);
                  }}
                >
                  Apply
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Manual Operations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-500" />
            Manual Cleaning Operations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button
              onClick={() => {
                setSelectedOperation({});
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Start New Operation
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Operations */}
      {operations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              Active Operations ({operations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {operations.map((operation) => (
                <div
                  key={operation.id}
                  className="border rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(operation.status)}
                      <div>
                        <h4 className="font-medium text-gray-900">{operation.name}</h4>
                        <p className="text-sm text-gray-500">
                          {operation.type} • Started {operation.createdAt.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(operation.status)}
                      {operation.status === 'processing' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelOperation(operation.id)}
                        >
                          <Pause className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <Progress
                    value={operation.progress}
                    max={100}
                    size="sm"
                    variant={operation.status === 'failed' ? 'error' : 'default'}
                    showLabel
                  />
                  
                  {operation.errorMessage && (
                    <p className="text-sm text-red-600 mt-2">{operation.errorMessage}</p>
                  )}
                  
                  {operation.completedAt && (
                    <p className="text-sm text-gray-500 mt-2">
                      Completed at {operation.completedAt.toLocaleTimeString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Operation Configuration Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedOperation(null);
        }}
        title="Configure Cleaning Operation"
        size="lg"
      >
        <ModalBody>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Operation Name
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={selectedOperation?.name || ''}
                onChange={(e) => setSelectedOperation(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter operation name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Operation Type
              </label>
              <Select
                options={operationTypes}
                value={selectedOperation?.type || ''}
                onChange={(value) => setSelectedOperation(prev => ({ ...prev, type: value }))}
                placeholder="Select operation type"
              />
            </div>
            
            {selectedOperation?.type === 'handle_missing_values' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Strategy
                </label>
                <Select
                  options={missingValueStrategies}
                  value={selectedOperation?.parameters?.strategy || ''}
                  onChange={(value) => setSelectedOperation(prev => ({ 
                    ...prev, 
                    parameters: { ...prev?.parameters, strategy: value }
                  }))}
                  placeholder="Select strategy"
                />
              </div>
            )}
            
            {selectedOperation?.type === 'remove_outliers' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Method
                </label>
                <Select
                  options={outlierMethods}
                  value={selectedOperation?.parameters?.method || ''}
                  onChange={(value) => setSelectedOperation(prev => ({ 
                    ...prev, 
                    parameters: { ...prev?.parameters, method: value }
                  }))}
                  placeholder="Select method"
                />
              </div>
            )}
          </div>
        </ModalBody>
        
        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => {
              setIsModalOpen(false);
              setSelectedOperation(null);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => selectedOperation && handleStartOperation(selectedOperation)}
            disabled={!selectedOperation?.name || !selectedOperation?.type || isLoading}
            loading={isLoading}
          >
            Start Operation
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default CleaningOperations;
