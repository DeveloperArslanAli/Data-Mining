import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  ComposedChart,
  Area,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  BarChart3, 
  ScatterChart as ScatterChartIcon,
  Activity,
  AlertTriangle,
  Info,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';
import { 
  StatisticalSummary, 
  CorrelationMatrix, 
  DistributionData, 
  OutlierAnalysis,
  TrendAnalysis 
} from '@/types';
import { cn } from '@/lib/utils';

interface StatisticalAnalysisProps {
  datasetId: number;
  datasetName: string;
  className?: string;
}

const StatSummaryCard: React.FC<{
  title: string;
  value: number;
  unit?: string;
  description?: string;
  className?: string;
}> = ({ title, value, unit = '', description, className }) => {
  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">
          {typeof value === 'number' && value % 1 !== 0 ? value.toFixed(2) : value}{unit}
        </div>
        {description && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};

const CorrelationHeatmap: React.FC<{
  correlationMatrix: CorrelationMatrix;
  className?: string;
}> = ({ correlationMatrix, className }) => {
  const getCorrelationColor = (value: number) => {
    if (value >= 0.7) return '#ef4444'; // Strong positive - red
    if (value >= 0.3) return '#f97316'; // Moderate positive - orange
    if (value >= -0.3) return '#6b7280'; // Weak - gray
    if (value >= -0.7) return '#3b82f6'; // Moderate negative - blue
    return '#1d4ed8'; // Strong negative - dark blue
  };

  const getCorrelationStrength = (value: number) => {
    const absValue = Math.abs(value);
    if (absValue >= 0.7) return 'strong';
    if (absValue >= 0.3) return 'moderate';
    return 'weak';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScatterChartIcon className="h-5 w-5 text-blue-500" />
          Correlation Matrix
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-max">
            <div className="grid gap-1" style={{ 
              gridTemplateColumns: `repeat(${correlationMatrix.columns.length + 1}, minmax(80px, 1fr))` 
            }}>
              {/* Header row */}
              <div className="h-8"></div>
              {correlationMatrix.columns.map((col) => (
                <div key={col} className="h-8 flex items-center justify-center text-xs font-medium text-gray-700 bg-gray-50 px-2 py-1 rounded">
                  {col}
                </div>
              ))}
              
              {/* Data rows */}
              {correlationMatrix.columns.map((col1, i) => (
                <React.Fragment key={col1}>
                  <div className="h-8 flex items-center justify-center text-xs font-medium text-gray-700 bg-gray-50 px-2 py-1 rounded">
                    {col1}
                  </div>
                  {correlationMatrix.columns.map((col2, j) => {
                    const value = correlationMatrix.matrix[i][j];
                    const isDiagonal = i === j;
                    return (
                      <div
                        key={`${col1}-${col2}`}
                        className={cn(
                          "h-8 flex items-center justify-center text-xs font-medium px-2 py-1 rounded cursor-pointer transition-colors",
                          isDiagonal 
                            ? "bg-gray-100 text-gray-500" 
                            : "hover:bg-gray-50"
                        )}
                        style={{
                          backgroundColor: isDiagonal ? '#f3f4f6' : getCorrelationColor(value),
                          color: isDiagonal ? '#6b7280' : 'white'
                        }}
                        title={`${col1} vs ${col2}: ${value.toFixed(3)} (${getCorrelationStrength(value)})`}
                      >
                        {isDiagonal ? '1.00' : value.toFixed(2)}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
        
        {/* Legend */}
        <div className="mt-4 flex items-center justify-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#ef4444' }}></div>
            <span>Strong Positive (≥0.7)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#f97316' }}></div>
            <span>Moderate Positive (≥0.3)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#6b7280' }}></div>
            <span>Weak (±0.3)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#3b82f6' }}></div>
            <span>Moderate Negative (≤-0.3)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#1d4ed8' }}></div>
            <span>Strong Negative (≤-0.7)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const DistributionChart: React.FC<{
  distribution: DistributionData;
  className?: string;
}> = ({ distribution, className }) => {
  const chartData = distribution.data_type === 'numeric' && distribution.bins 
    ? distribution.bins.map(bin => ({
        bin: bin.bin,
        count: bin.count,
        percentage: bin.percentage
      }))
    : distribution.categories?.map(cat => ({
        category: cat.category,
        count: cat.count,
        percentage: cat.percentage
      })) || [];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-green-500" />
          {distribution.column} Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={distribution.data_type === 'numeric' ? 'bin' : 'category'} />
              <YAxis />
              <Tooltip formatter={(value, name) => [value, name === 'count' ? 'Count' : 'Percentage']} />
              <Bar dataKey="count" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Data type indicator */}
        <div className="mt-2 flex items-center justify-center">
          <Badge variant="secondary" className="text-xs">
            {distribution.data_type} data
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

const OutlierAnalysisCard: React.FC<{
  outlierAnalysis: OutlierAnalysis;
  className?: string;
}> = ({ outlierAnalysis, className }) => {
  const getMethodColor = (method: string) => {
    switch (method) {
      case 'z_score': return '#ef4444';
      case 'iqr': return '#f97316';
      case 'isolation_forest': return '#3b82f6';
      case 'local_outlier_factor': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Outlier Analysis - {outlierAnalysis.column}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm font-medium text-gray-700">Total Outliers</p>
            <p className="text-2xl font-bold text-gray-900">{outlierAnalysis.total_outliers}</p>
            <p className="text-xs text-gray-500">{outlierAnalysis.percentage.toFixed(1)}% of data</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Detection Method</p>
            <Badge 
              variant="secondary" 
              className="text-xs mt-1"
            >
              {outlierAnalysis.method.replace('_', ' ')}
            </Badge>
          </div>
        </div>
        
        {/* Outlier distribution chart */}
        {outlierAnalysis.outliers.length > 0 && (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="index" name="Row Index" />
                <YAxis dataKey="value" name="Value" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter 
                  data={outlierAnalysis.outliers} 
                  fill={getMethodColor(outlierAnalysis.method)}
                  name="Outliers"
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const StatisticalAnalysis: React.FC<StatisticalAnalysisProps> = ({ 
  datasetId, 
  datasetName, 
  className 
}) => {
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [analysisType, setAnalysisType] = useState<'overview' | 'correlation' | 'distribution' | 'outliers'>('overview');
  const [statisticalData, setStatisticalData] = useState<{
    summaries: Record<string, StatisticalSummary>;
    correlations: CorrelationMatrix | null;
    distributions: Record<string, DistributionData>;
    outliers: Record<string, OutlierAnalysis>;
    trends: Record<string, TrendAnalysis>;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading statistical data
    const loadStatisticalData = async () => {
      setIsLoading(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock data for demonstration
      const mockSummaries: Record<string, StatisticalSummary> = {
        'age': {
          count: 1000,
          mean: 35.2,
          std: 12.8,
          min: 18,
          max: 75,
          q25: 26,
          q50: 34,
          q75: 44,
          skewness: 0.8,
          kurtosis: 2.1
        },
        'income': {
          count: 1000,
          mean: 65000,
          std: 25000,
          min: 25000,
          max: 150000,
          q25: 45000,
          q50: 60000,
          q75: 80000,
          skewness: 1.2,
          kurtosis: 3.5
        },
        'satisfaction_score': {
          count: 1000,
          mean: 7.8,
          std: 1.5,
          min: 1,
          max: 10,
          q25: 7,
          q50: 8,
          q75: 9,
          skewness: -0.3,
          kurtosis: 2.8
        }
      };

      const mockCorrelations: CorrelationMatrix = {
        columns: ['age', 'income', 'satisfaction_score'],
        matrix: [
          [1.0, 0.45, -0.12],
          [0.45, 1.0, 0.23],
          [-0.12, 0.23, 1.0]
        ],
        significant_correlations: [
          {
            column1: 'age',
            column2: 'income',
            correlation: 0.45,
            p_value: 0.001,
            significance: 'high'
          },
          {
            column1: 'income',
            column2: 'satisfaction_score',
            correlation: 0.23,
            p_value: 0.05,
            significance: 'medium'
          }
        ]
      };

      const mockDistributions: Record<string, DistributionData> = {
        'age': {
          column: 'age',
          data_type: 'numeric',
          bins: [
            { bin: '18-25', count: 150, percentage: 15 },
            { bin: '26-35', count: 300, percentage: 30 },
            { bin: '36-45', count: 250, percentage: 25 },
            { bin: '46-55', count: 200, percentage: 20 },
            { bin: '56+', count: 100, percentage: 10 }
          ]
        },
        'satisfaction_score': {
          column: 'satisfaction_score',
          data_type: 'numeric',
          bins: [
            { bin: '1-3', count: 50, percentage: 5 },
            { bin: '4-6', count: 200, percentage: 20 },
            { bin: '7-8', count: 450, percentage: 45 },
            { bin: '9-10', count: 300, percentage: 30 }
          ]
        }
      };

      const mockOutliers: Record<string, OutlierAnalysis> = {
        'income': {
          column: 'income',
          method: 'z_score',
          outliers: [
            { index: 45, value: 180000, score: 4.6, method: 'z_score' },
            { index: 123, value: 200000, score: 5.4, method: 'z_score' },
            { index: 567, value: 220000, score: 6.2, method: 'z_score' }
          ],
          threshold: 3.0,
          total_outliers: 3,
          percentage: 0.3
        }
      };

      setStatisticalData({
        summaries: mockSummaries,
        correlations: mockCorrelations,
        distributions: mockDistributions,
        outliers: mockOutliers,
        trends: {}
      });
      
      setIsLoading(false);
    };

    loadStatisticalData();
  }, [datasetId]);

  const availableColumns = statisticalData ? Object.keys(statisticalData.summaries) : [];

  if (isLoading) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!statisticalData) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="text-center text-gray-500">No statistical data available</div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Statistical Analysis</h2>
          <p className="text-gray-600">Comprehensive statistical insights and data exploration</p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            options={availableColumns.map(c => ({ value: c, label: c }))}
            value={selectedColumn}
            onChange={(v) => setSelectedColumn(v)}
            placeholder="Select Column"
            size="sm"
          />
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'correlation', label: 'Correlations', icon: ScatterChartIcon },
            { id: 'distribution', label: 'Distributions', icon: TrendingUp },
            { id: 'outliers', label: 'Outliers', icon: AlertTriangle }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setAnalysisType(tab.id as any)}
                className={cn(
                  'flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm',
                  analysisType === tab.id
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
        {analysisType === 'overview' && (
          <>
            {/* Statistical Summaries */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(statisticalData.summaries).map(([column, summary]) => (
                <Card key={column} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 capitalize">
                      {column} Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Count:</span>
                        <span className="ml-2 font-medium">{summary.count.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Mean:</span>
                        <span className="ml-2 font-medium">{summary.mean.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Std Dev:</span>
                        <span className="ml-2 font-medium">{summary.std.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Range:</span>
                        <span className="ml-2 font-medium">{summary.min} - {summary.max}</span>
                      </div>
                    </div>
                    
                    {/* Quartiles */}
                    <div className="pt-2 border-t">
                      <div className="text-xs text-gray-500 mb-1">Quartiles:</div>
                      <div className="grid grid-cols-3 gap-1 text-xs">
                        <div className="text-center">
                          <div className="font-medium">Q1</div>
                          <div className="text-gray-600">{summary.q25}</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">Q2 (Median)</div>
                          <div className="text-gray-600">{summary.q50}</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">Q3</div>
                          <div className="text-gray-600">{summary.q75}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Key Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-500" />
                  Key Statistical Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Strongest Correlations</h4>
                    <div className="space-y-2">
                      {statisticalData.correlations?.significant_correlations
                        .filter(corr => corr.significance === 'high')
                        .slice(0, 3)
                        .map((corr, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">
                              {corr.column1} ↔ {corr.column2}
                            </span>
                            <Badge variant="success" className="text-xs">
                              {corr.correlation.toFixed(2)}
                            </Badge>
                          </div>
                        ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Data Quality Highlights</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Total Columns Analyzed</span>
                        <span className="font-medium">{availableColumns.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Outlier Detection</span>
                        <span className="font-medium">
                          {Object.keys(statisticalData.outliers).length} columns
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Distribution Types</span>
                        <span className="font-medium">
                          {Object.keys(statisticalData.distributions).length} analyzed
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {analysisType === 'correlation' && statisticalData.correlations && (
          <CorrelationHeatmap correlationMatrix={statisticalData.correlations} />
        )}

        {analysisType === 'distribution' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(statisticalData.distributions).map(([column, distribution]) => (
              <DistributionChart key={column} distribution={distribution} />
            ))}
          </div>
        )}

        {analysisType === 'outliers' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(statisticalData.outliers).map(([column, outlierAnalysis]) => (
              <OutlierAnalysisCard key={column} outlierAnalysis={outlierAnalysis} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatisticalAnalysis;
