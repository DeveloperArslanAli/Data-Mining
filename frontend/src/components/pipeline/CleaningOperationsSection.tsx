/**
 * Data Mining Platform - Cleaning Operations Section
 *
 * Manages data cleaning operations with real-time progress tracking
 * and integration with the ML Engine service.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { 
  Sparkles, 
  Play, 
  Pause, 
  StopCircle, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  Settings,
  BarChart3
} from 'lucide-react';
import { CleaningOperation, CleaningOperationStatus, Dataset, CleaningOperationType } from '@/types';
import apiClient from '@/lib/api';

export interface CleaningOperationsSectionProps {
  dataset: Dataset;
  onNext: () => void;
  className?: string;
}

const CleaningOperationsSection: React.FC<CleaningOperationsSectionProps> = ({
  dataset,
  onNext,
  className
}) => {
  const [operations, setOperations] = useState<CleaningOperation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewOperation, setShowNewOperation] = useState(false);
  const [newOperation, setNewOperation] = useState({
    name: '',
    description: '',
    operation_type: 'remove_duplicates',
    parameters: {},
    target_columns: []
  });

  useEffect(() => {
    loadOperations();
  }, [dataset.id]);

  const loadOperations = async () => {
    setIsLoading(true);
    try {
      const response: any = await apiClient.getCleaningOperations(dataset.id);
      const ops: CleaningOperation[] = Array.isArray(response)
        ? response
        : Array.isArray(response?.operations)
          ? response.operations
          : [];
      setOperations(ops as CleaningOperation[]);
    } catch (error) {
      console.error('Failed to load operations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartOperation = async () => {
    if (!newOperation.name.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await apiClient.startCleaningOperation({
        dataset_id: dataset.id,
  operation_type: newOperation.operation_type as CleaningOperationType,
        parameters: newOperation.parameters,
        target_columns: newOperation.target_columns
      });

      const operation: CleaningOperation = {
        id: response.operation_id,
        name: newOperation.name,
        description: newOperation.description,
  operation_type: newOperation.operation_type as CleaningOperationType,
        parameters: newOperation.parameters,
        target_columns: newOperation.target_columns,
        status: CleaningOperationStatus.PENDING,
        progress: 0,
        dataset_id: dataset.id,
        user_id: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setOperations(prev => [...prev, operation]);
      setShowNewOperation(false);
      setNewOperation({
        name: '',
        description: '',
        operation_type: 'remove_duplicates',
        parameters: {},
        target_columns: []
      });

      // Start monitoring the operation
      monitorOperation(operation.id);
      
    } catch (error) {
      console.error('Failed to start operation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const monitorOperation = async (operationId: number) => {
    const interval = setInterval(async () => {
      try {
        const operation = await apiClient.getCleaningOperation(operationId);
        setOperations(prev => prev.map(op => 
          op.id === operationId ? operation : op
        ));

        if (operation.status === CleaningOperationStatus.COMPLETED || 
            operation.status === CleaningOperationStatus.FAILED) {
          clearInterval(interval);
        }
      } catch (error) {
        console.error('Failed to monitor operation:', error);
        clearInterval(interval);
      }
    }, 2000);
  };

  const handleCancelOperation = async (operationId: number) => {
    try {
      await apiClient.cancelCleaningOperation(operationId);
      setOperations(prev => prev.map(op => 
        op.id === operationId 
          ? { ...op, status: CleaningOperationStatus.CANCELLED }
          : op
      ));
    } catch (error) {
      console.error('Failed to cancel operation:', error);
    }
  };

  const getStatusIcon = (status: CleaningOperationStatus) => {
    switch (status) {
      case CleaningOperationStatus.COMPLETED:
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case CleaningOperationStatus.PROCESSING:
        return <BarChart3 className="h-4 w-4 text-blue-600 animate-pulse" />;
      case CleaningOperationStatus.FAILED:
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case CleaningOperationStatus.CANCELLED:
        return <StopCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <RefreshCw className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: CleaningOperationStatus) => {
    const variants = {
      [CleaningOperationStatus.COMPLETED]: 'success' as const,
      [CleaningOperationStatus.PROCESSING]: 'primary' as const,
      [CleaningOperationStatus.FAILED]: 'error' as const,
      [CleaningOperationStatus.CANCELLED]: 'secondary' as const,
      [CleaningOperationStatus.PENDING]: 'secondary' as const,
    };
    
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const operationTypes = [
    { value: 'remove_duplicates', label: 'Remove Duplicates' },
    { value: 'handle_missing_values', label: 'Handle Missing Values' },
    { value: 'remove_outliers', label: 'Remove Outliers' },
    { value: 'normalization', label: 'Normalization' },
    { value: 'encoding', label: 'Encode Categorical' },
    { value: 'data_type_conversion', label: 'Data Type Conversion' }
  ];

  const completedOperations = operations.filter(op => 
    op.status === CleaningOperationStatus.COMPLETED
  );

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Data Cleaning Operations
            <Badge variant="secondary" className="ml-2">
              {operations.length} operations
            </Badge>
          </CardTitle>
          <p className="text-sm text-gray-600">
            Clean and transform your data using various operations
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* New Operation Form */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900">New Cleaning Operation</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNewOperation(!showNewOperation)}
              >
                <Settings className="h-4 w-4 mr-2" />
                {showNewOperation ? 'Hide' : 'Show'} Form
              </Button>
            </div>

            {showNewOperation && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Operation Name *
                    </label>
                    <Input
                      value={newOperation.name}
                      onChange={(e) => setNewOperation(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter operation name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Operation Type *
                    </label>
                    <Select
                      options={operationTypes}
                      value={newOperation.operation_type}
                      onChange={(value) => setNewOperation(prev => ({ ...prev, operation_type: value }))}
                      placeholder="Select operation type"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <Input
                    value={newOperation.description}
                    onChange={(e) => setNewOperation(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter operation description"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleStartOperation}
                    disabled={isLoading || !newOperation.name.trim()}
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
                        Start Operation
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => setShowNewOperation(false)}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Active Operations */}
          {operations.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Active Operations</h4>
              {operations.map((operation) => (
                <div
                  key={operation.id}
                  className="p-4 border rounded-lg space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(operation.status)}
                      <div>
                        <h5 className="font-medium text-gray-900">{operation.name}</h5>
                        <p className="text-sm text-gray-500">{operation.description}</p>
                        <p className="text-xs text-gray-400">
                          Type: {operation.operation_type.replace(/_/g, ' ')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {getStatusBadge(operation.status)}
                      {operation.status === CleaningOperationStatus.PROCESSING && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelOperation(operation.id)}
                        >
                          <StopCircle className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>

                  {operation.status === CleaningOperationStatus.PROCESSING && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Progress</span>
                        <span>{Math.round(operation.progress || 0)}%</span>
                      </div>
                      <Progress value={operation.progress || 0} className="h-2" />
                    </div>
                  )}

                  {operation.status === CleaningOperationStatus.COMPLETED && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      Operation completed successfully!
                    </div>
                  )}

                  {operation.status === CleaningOperationStatus.FAILED && (
                    <div className="flex items-center gap-2 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      Operation failed. Please check logs for details.
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Progress Summary */}
          {operations.length > 0 && (
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                <span className="text-sm text-gray-500">
                  {completedOperations.length} of {operations.length} completed
                </span>
              </div>
              <Progress 
                value={operations.length > 0 ? (completedOperations.length / operations.length) * 100 : 0} 
                className="h-3"
              />
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-gray-500">
              {completedOperations.length} operations completed
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={loadOperations}
                disabled={isLoading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              
              <Button
                onClick={onNext}
                disabled={completedOperations.length === 0}
                className="min-w-[120px]"
              >
                Proceed to Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CleaningOperationsSection;
