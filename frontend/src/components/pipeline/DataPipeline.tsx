/**
 * Data Mining Platform - Data Pipeline Component
 * 
 * Main orchestration component that coordinates the complete data flow:
 * Upload data OR enter website URL → Preview → Clean → Export
 */

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { 
  Database, 
  Eye, 
  Sparkles, 
  Download, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

// Types
import { 
  Dataset, 
  CleaningOperation, 
  ExportJob, 
  CleaningSuggestion,
  DatasetStatus,
  CleaningOperationStatus,
  ExportJobStatus
} from '@/types';

// Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import DataInputSection from './DataInputSection';
import DataPreviewSection from './DataPreviewSection';
import AISuggestionsPanel from './AISuggestionsPanel';
import CleaningOperationsSection from './CleaningOperationsSection';
import ExportSection from './ExportSection';

// Hooks
import { useAuthStore } from '@/store/auth';

// API
import apiClient from '@/lib/api';

// Pipeline step types
export type PipelineStep = 'input' | 'preview' | 'cleaning' | 'export' | 'complete';

export interface PipelineState {
  currentStep: PipelineStep;
  dataset: Dataset | null;
  cleaningOperations: CleaningOperation[];
  exportJob: ExportJob | null;
  suggestions: CleaningSuggestion[];
  isLoading: boolean;
  error: string | null;
  progress: number;
}

export interface DataPipelineProps {
  className?: string;
  onPipelineComplete?: (result: { dataset: Dataset; exportJob: ExportJob }) => void;
}

const DataPipeline: React.FC<DataPipelineProps> = ({ 
  className,
  onPipelineComplete 
}) => {
  const { user } = useAuthStore();
  
  // Pipeline state
  const [pipelineState, setPipelineState] = useState<PipelineState>({
    currentStep: 'input',
    dataset: null,
    cleaningOperations: [],
    exportJob: null,
    suggestions: [],
    isLoading: false,
    error: null,
    progress: 0
  });

  // Step configuration
  const steps = [
    { id: 'input', label: 'Data Input', icon: Database, description: 'Upload file or enter URL' },
    { id: 'preview', label: 'Data Preview', icon: Eye, description: 'Review and analyze data' },
    { id: 'cleaning', label: 'Data Cleaning', icon: Sparkles, description: 'Clean and transform data' },
    { id: 'export', label: 'Export Data', icon: Download, description: 'Export in desired format' },
    { id: 'complete', label: 'Complete', icon: CheckCircle, description: 'Pipeline finished' }
  ];

  // Update pipeline state
  const updatePipelineState = useCallback((updates: Partial<PipelineState>) => {
    setPipelineState(prev => ({ ...prev, ...updates }));
  }, []);

  // Handle step transitions
  const goToStep = useCallback((step: PipelineStep) => {
    if (step === 'preview' && !pipelineState.dataset) {
      toast.error('Please provide data first');
      return;
    }
    
    if (step === 'cleaning' && !pipelineState.dataset) {
      toast.error('Please preview data first');
      return;
    }
    
    if (step === 'export' && pipelineState.cleaningOperations.length === 0) {
      toast.error('Please perform at least one cleaning operation');
      return;
    }

    updatePipelineState({ currentStep: step });
    updateProgress(step);
  }, [pipelineState.dataset, pipelineState.cleaningOperations, updatePipelineState]);

  // Update progress based on current step
  const updateProgress = useCallback((step: PipelineStep) => {
    const stepIndex = steps.findIndex(s => s.id === step);
    const progress = ((stepIndex + 1) / steps.length) * 100;
    updatePipelineState({ progress });
  }, [steps.length, updatePipelineState]);

  // Handle dataset received from input
  const handleDatasetReceived = useCallback(async (dataset: Dataset) => {
    try {
      updatePipelineState({ 
        isLoading: true, 
        error: null,
        dataset 
      });

      // Get AI suggestions for the dataset
      const suggestionsResponse = await apiClient.getCleaningSuggestions(dataset.id);
      updatePipelineState({ 
        suggestions: suggestionsResponse.suggestions,
        isLoading: false 
      });

      // Move to preview step
      goToStep('preview');
      toast.success('Dataset loaded successfully!');
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to load dataset';
      updatePipelineState({ 
        error: errorMessage, 
        isLoading: false 
      });
      toast.error(errorMessage);
    }
  }, [updatePipelineState, goToStep]);

  // Handle cleaning operation started
  const handleCleaningOperationStarted = useCallback(async (operation: Partial<CleaningOperation>) => {
    try {
      if (!pipelineState.dataset) {
        toast.error('No dataset available');
        return;
      }

      updatePipelineState({ isLoading: true });

      const response = await apiClient.startCleaningOperation({
        dataset_id: pipelineState.dataset.id,
        operation_type: operation.operation_type!,
        parameters: operation.parameters || {},
        target_columns: operation.target_columns || []
      });

      const newOperation: CleaningOperation = {
        id: response.operation_id,
        name: operation.name || 'Cleaning Operation',
        description: operation.description || '',
        operation_type: operation.operation_type!,
        parameters: operation.parameters || {},
        target_columns: operation.target_columns || [],
        status: CleaningOperationStatus.PENDING,
        progress: 0,
        dataset_id: pipelineState.dataset.id,
        user_id: user?.id || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setPipelineState(prev => ({
        ...prev,
        cleaningOperations: [...prev.cleaningOperations, newOperation],
        isLoading: false
      }));

      toast.success('Cleaning operation started successfully!');
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to start cleaning operation';
      updatePipelineState({ 
        error: errorMessage, 
        isLoading: false 
      });
      toast.error(errorMessage);
    }
  }, [pipelineState.dataset, user?.id, updatePipelineState]);

  // Handle export started
  const handleExportStarted = useCallback(async (exportConfig: any) => {
    try {
      if (!pipelineState.dataset) {
        toast.error('No dataset available');
        return;
      }

      updatePipelineState({ isLoading: true });

      const response = await apiClient.startExportJob({
        dataset_id: pipelineState.dataset.id,
        export_format: exportConfig.format,
        name: exportConfig.name || `${pipelineState.dataset.name} - Export`,
        description: exportConfig.description || '',
        include_headers: exportConfig.includeHeaders ? Object.keys(pipelineState.dataset.column_names || {}) : [],
        exclude_headers: exportConfig.excludeHeaders || [],
        filters: exportConfig.filters || {},
        sorting: exportConfig.sorting || {},
        limit_rows: exportConfig.limitRows
      });

      const newExportJob: ExportJob = {
        id: response.job_id,
        name: exportConfig.name || `${pipelineState.dataset.name} - Export`,
        description: exportConfig.description || '',
        export_format: exportConfig.format,
        status: ExportJobStatus.PENDING,
        progress: 0,
        dataset_id: pipelineState.dataset.id,
        user_id: user?.id || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setPipelineState(prev => ({
        ...prev,
        exportJob: newExportJob,
        isLoading: false
      }));

      toast.success('Export job started successfully!');
      
      // Move to complete step
      goToStep('complete');
      
      // Notify parent component
      if (onPipelineComplete && pipelineState.dataset) {
        onPipelineComplete({ 
          dataset: pipelineState.dataset, 
          exportJob: newExportJob 
        });
      }
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to start export job';
      updatePipelineState({ 
        error: errorMessage, 
        isLoading: false 
      });
      toast.error(errorMessage);
    }
  }, [pipelineState.dataset, user?.id, updatePipelineState, goToStep, onPipelineComplete]);

  // Reset pipeline
  const resetPipeline = useCallback(() => {
    setPipelineState({
      currentStep: 'input',
      dataset: null,
      cleaningOperations: [],
      exportJob: null,
      suggestions: [],
      isLoading: false,
      error: null,
      progress: 0
    });
  }, []);

  // Get current step info
  const getCurrentStepInfo = () => {
    return steps.find(step => step.id === pipelineState.currentStep);
  };

  // Get step status
  const getStepStatus = (stepId: string): 'completed' | 'current' | 'pending' => {
    const stepIndex = steps.findIndex(s => s.id === stepId);
    const currentIndex = steps.findIndex(s => s.id === pipelineState.currentStep);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  // Error recovery
  const handleErrorRecovery = useCallback(() => {
    updatePipelineState({ error: null });
  }, [updatePipelineState]);

  // Auto-advance to next step when conditions are met
  useEffect(() => {
    if (pipelineState.currentStep === 'preview' && pipelineState.dataset && pipelineState.suggestions.length > 0) {
      // Auto-advance to cleaning if suggestions are available
      setTimeout(() => {
        goToStep('cleaning');
      }, 2000);
    }
  }, [pipelineState.currentStep, pipelineState.dataset, pipelineState.suggestions.length, goToStep]);

  // Monitor cleaning operations progress
  useEffect(() => {
    if (pipelineState.cleaningOperations.length > 0) {
      const interval = setInterval(async () => {
        try {
          const updatedOperations = await Promise.all(
            pipelineState.cleaningOperations.map(async (op) => {
              if (op.status === CleaningOperationStatus.PENDING || op.status === CleaningOperationStatus.PROCESSING) {
                const updatedOp = await apiClient.getCleaningOperation(op.id);
                return updatedOp;
              }
              return op;
            })
          );

          updatePipelineState({ cleaningOperations: updatedOperations });

          // Check if all operations are completed
          const allCompleted = updatedOperations.every(op => 
            op.status === CleaningOperationStatus.COMPLETED
          );

          if (allCompleted && pipelineState.currentStep === 'cleaning') {
            toast.success('All cleaning operations completed!');
            goToStep('export');
          }
        } catch (error) {
          console.error('Failed to update cleaning operations:', error);
        }
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [pipelineState.cleaningOperations, pipelineState.currentStep, updatePipelineState, goToStep]);

  // Monitor export job progress
  useEffect(() => {
    if (pipelineState.exportJob && pipelineState.exportJob.status === ExportJobStatus.PENDING) {
      const interval = setInterval(async () => {
        try {
          const updatedJob = await apiClient.getExportJob(pipelineState.exportJob!.id);
          updatePipelineState({ exportJob: updatedJob });

          if (updatedJob.status === ExportJobStatus.COMPLETED) {
            toast.success('Export completed successfully!');
            clearInterval(interval);
          } else if (updatedJob.status === ExportJobStatus.FAILED) {
            toast.error('Export failed: ' + (updatedJob.error_message || 'Unknown error'));
            clearInterval(interval);
          }
        } catch (error) {
          console.error('Failed to update export job:', error);
        }
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [pipelineState.exportJob, updatePipelineState]);

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* Pipeline Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Database className="h-6 w-6 text-blue-600" />
              <span>Data Pipeline</span>
            </div>
            {pipelineState.isLoading && (
              <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
            )}
          </CardTitle>
          <p className="text-sm text-gray-600">
            Complete data workflow: Input → Preview → Clean → Export
          </p>
        </CardHeader>
        <CardContent>
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Pipeline Progress
              </span>
              <span className="text-sm text-gray-500">
                {Math.round(pipelineState.progress)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${pipelineState.progress}%` }}
              />
            </div>
          </div>

          {/* Step Indicators */}
          <div className="flex items-center justify-between mb-6">
            {steps.map((step, index) => {
              const status = getStepStatus(step.id);
              const isLast = index === steps.length - 1;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-200
                      ${status === 'completed' 
                        ? 'bg-green-500 border-green-500 text-white' 
                        : status === 'current'
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'bg-gray-100 border-gray-300 text-gray-400'
                      }
                    `}>
                      {status === 'completed' ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <step.icon className="h-5 w-5" />
                      )}
                    </div>
                    <span className={`
                      text-xs mt-2 text-center max-w-20
                      ${status === 'completed' 
                        ? 'text-green-600 font-medium' 
                        : status === 'current'
                        ? 'text-blue-600 font-medium'
                        : 'text-gray-400'
                      }
                    `}>
                      {step.label}
                    </span>
                  </div>
                  {!isLast && (
                    <div className={`
                      w-16 h-0.5 mx-4 transition-all duration-200
                      ${status === 'completed' ? 'bg-green-500' : 'bg-gray-300'}
                    `} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Current Step Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              {(() => { const info = getCurrentStepInfo(); if (!info) return null; const Icon = info.icon; return <Icon className="h-5 w-5 text-blue-600" />; })()}
              <div>
                <h4 className="font-medium text-blue-900">
                  Current Step: {getCurrentStepInfo()?.label}
                </h4>
                <p className="text-sm text-blue-700">
                  {getCurrentStepInfo()?.description}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {pipelineState.error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div className="flex-1">
                <p className="text-red-800 font-medium">Pipeline Error</p>
                <p className="text-red-700 text-sm">{pipelineState.error}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleErrorRecovery}
              >
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pipeline Content */}
      <div className="min-h-[400px]">
        {pipelineState.currentStep === 'input' && (
          <DataInputSection
            onDatasetReceived={handleDatasetReceived}
            onInputComplete={goToStep}
          />
        )}
        
        {pipelineState.currentStep === 'preview' && pipelineState.dataset && (
          <div className="space-y-6">
            <DataPreviewSection
              dataset={pipelineState.dataset}
              onNext={() => goToStep('cleaning')}
            />
            
            <AISuggestionsPanel
              dataset={pipelineState.dataset}
              onSuggestionApplied={handleCleaningOperationStarted}
            />
          </div>
        )}
        
        {pipelineState.currentStep === 'cleaning' && pipelineState.dataset && (
          <CleaningOperationsSection
            dataset={pipelineState.dataset}
            onNext={() => goToStep('export')}
          />
        )}
        
        {pipelineState.currentStep === 'export' && pipelineState.dataset && (
          <ExportSection
            dataset={pipelineState.dataset}
            onComplete={() => goToStep('complete')}
          />
        )}
        
        {pipelineState.currentStep === 'complete' && (
          <div className="text-center text-gray-500 py-20">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <p>Pipeline completed successfully!</p>
            <p className="text-sm">Dataset processed and ready for export</p>
          </div>
        )}
      </div>

      {/* Pipeline Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={resetPipeline}
                disabled={pipelineState.isLoading}
              >
                Reset Pipeline
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              {pipelineState.currentStep !== 'input' && (
                <Button
                  variant="outline"
                  onClick={() => {
                    const currentIndex = steps.findIndex(s => s.id === pipelineState.currentStep);
                    if (currentIndex > 0) {
                      goToStep(steps[currentIndex - 1].id as PipelineStep);
                    }
                  }}
                  disabled={pipelineState.isLoading}
                >
                  Previous
                </Button>
              )}
              
              {pipelineState.currentStep !== 'complete' && (
                <Button
                  onClick={() => {
                    const currentIndex = steps.findIndex(s => s.id === pipelineState.currentStep);
                    if (currentIndex < steps.length - 1) {
                      goToStep(steps[currentIndex + 1].id as PipelineStep);
                    }
                  }}
                  disabled={pipelineState.isLoading}
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataPipeline;
