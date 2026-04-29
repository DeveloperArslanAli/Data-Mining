import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  AlertTriangle,
  CheckCircle,
  Info,
  TrendingUp,
  TrendingDown,
  Activity,
  Database,
  BarChart3,
  PieChart as PieChartIcon,
} from 'lucide-react';
import { DataQualityMetrics, AnalyticsInsight, PerformanceMetrics } from '@/types';
import { cn } from '@/lib/utils';

interface DataQualityDashboardProps {
  datasetId: number;
  datasetName: string;
  className?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const QualityMetricCard: React.FC<{
  title: string;
  value: number;
  maxValue: number;
  unit: string;
  status: 'excellent' | 'good' | 'warning' | 'poor';
  trend?: 'up' | 'down' | 'stable';
  className?: string;
}> = ({ title, value, maxValue, unit, status, trend, className }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-50';
      case 'good': return 'text-blue-600 bg-blue-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'poor': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'stable': return <Activity className="h-4 w-4 text-blue-500" />;
      default: return null;
    }
  };

  const percentage = (value / maxValue) * 100;

  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
          {title}
          {trend && getTrendIcon(trend)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">
          {value.toFixed(1)}{unit}
        </div>
        <div className="mt-2">
          <Progress value={percentage} className="h-2" />
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-gray-500">{percentage.toFixed(1)}%</span>
            <Badge variant={status === 'excellent' || status === 'good' ? 'success' : status === 'warning' ? 'warning' : 'error'}>
              {status}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const InsightCard: React.FC<{
  insight: AnalyticsInsight;
  className?: string;
}> = ({ insight, className }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-200 bg-red-50';
      case 'high': return 'border-orange-200 bg-orange-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      case 'low': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'high': return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'medium': return <Info className="h-5 w-5 text-yellow-500" />;
      case 'low': return <CheckCircle className="h-5 w-5 text-blue-500" />;
      default: return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <Card className={cn('border-l-4', getSeverityColor(insight.severity), className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          {getSeverityIcon(insight.severity)}
          <CardTitle className="text-sm font-medium text-gray-900">
            {insight.title}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {insight.type}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {insight.confidence}% confidence
            </Badge>
          </div>
          <span className="text-xs text-gray-400">
            {new Date(insight.generated_at).toLocaleDateString()}
          </span>
        </div>
        {insight.suggested_actions && insight.suggested_actions.length > 0 && (
          <div className="mt-3">
            <h4 className="text-xs font-medium text-gray-700 mb-2">Suggested Actions:</h4>
            <ul className="space-y-1">
              {insight.suggested_actions.map((action, index) => (
                <li key={index} className="text-xs text-gray-600 flex items-center gap-1">
                  <div className="w-1 h-1 bg-gray-400 rounded-full" />
                  {action}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const DataQualityDashboard: React.FC<DataQualityDashboardProps> = ({
  datasetId,
  datasetName, // kept for future use
  className,
}) => {
  const [qualityMetrics, setQualityMetrics] = useState<DataQualityMetrics | null>(null);
  const [insights, setInsights] = useState<AnalyticsInsight[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'insights' | 'performance'>('overview');

  useEffect(() => {
    // Simulate loading analytics data
    const loadAnalyticsData = async () => {
      setIsLoading(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock data for demonstration
      setQualityMetrics({
        completeness: 94.2,
        accuracy: 87.8,
        consistency: 92.1,
        uniqueness: 89.5,
        validity: 91.3,
        overall_score: 90.9
      });

      setInsights([
        {
          id: '1',
          type: 'quality_issue',
          title: 'High Missing Values in Age Column',
          description: 'The age column has 12% missing values, which may impact demographic analysis.',
          severity: 'medium',
          affected_columns: ['age'],
          suggested_actions: ['Consider imputation strategies', 'Investigate data collection process'],
          confidence: 85,
          generated_at: new Date().toISOString()
        },
        {
          id: '2',
          type: 'data_pattern',
          title: 'Seasonal Pattern Detected in Sales Data',
          description: 'Sales data shows clear quarterly patterns with peaks in Q4.',
          severity: 'low',
          affected_columns: ['sales_amount', 'date'],
          suggested_actions: ['Include seasonality in forecasting models', 'Segment analysis by quarters'],
          confidence: 92,
          generated_at: new Date().toISOString()
        },
        {
          id: '3',
          type: 'anomaly',
          title: 'Unusual Outliers in Price Column',
          description: 'Several extreme values detected in price column that may represent data entry errors.',
          severity: 'high',
          affected_columns: ['price'],
          suggested_actions: ['Review outlier detection thresholds', 'Validate extreme values manually'],
          confidence: 78,
          generated_at: new Date().toISOString()
        }
      ]);

      setPerformanceMetrics({
        processing_time: 2.3,
        memory_usage: 45.2,
        cpu_usage: 23.1,
        throughput: 1250,
        cache_hit_rate: 87.5,
        error_rate: 0.2,
        timestamp: new Date().toISOString()
      });
      
      setIsLoading(false);
    };

    loadAnalyticsData();
  }, [datasetId]);

  const qualityChartData = qualityMetrics ? [
    { name: 'Completeness', value: qualityMetrics.completeness, color: '#0088FE' },
    { name: 'Accuracy', value: qualityMetrics.accuracy, color: '#00C49F' },
    { name: 'Consistency', value: qualityMetrics.consistency, color: '#FFBB28' },
    { name: 'Uniqueness', value: qualityMetrics.uniqueness, color: '#FF8042' },
    { name: 'Validity', value: qualityMetrics.validity, color: '#8884D8' }
  ] : [];

  const performanceChartData = performanceMetrics ? [
    { name: 'Memory Usage', value: performanceMetrics.memory_usage, color: '#0088FE' },
    { name: 'CPU Usage', value: performanceMetrics.cpu_usage, color: '#00C49F' },
    { name: 'Cache Hit Rate', value: performanceMetrics.cache_hit_rate, color: '#FFBB28' }
  ] : [];

  if (isLoading) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Data Quality Dashboard</h2>
          <p className="text-gray-600">Comprehensive analysis of dataset quality and performance</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="info" className="flex items-center gap-1">
            <Database className="h-3 w-3" />
            {datasetId}
          </Badge>
          <Badge variant="success" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            {qualityMetrics?.overall_score.toFixed(1)}% Quality Score
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Quality Overview', icon: BarChart3 },
            { id: 'insights', label: 'AI Insights', icon: Activity },
            { id: 'performance', label: 'Performance', icon: PieChartIcon },
          ].map((tab) => {
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

      {/* Content */}
      {activeTab === 'overview' && qualityMetrics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {([
              { label: 'Completeness', value: qualityMetrics.completeness, trend: 'up' },
              { label: 'Accuracy', value: qualityMetrics.accuracy, trend: 'stable' },
              { label: 'Consistency', value: qualityMetrics.consistency, trend: 'up' },
              { label: 'Uniqueness', value: qualityMetrics.uniqueness, trend: 'down' },
              { label: 'Validity', value: qualityMetrics.validity, trend: 'stable' },
              { label: 'Overall Score', value: qualityMetrics.overall_score, trend: 'up' },
            ] as const).map((m) => (
              <QualityMetricCard
                key={m.label}
                title={m.label}
                value={m.value}
                maxValue={100}
                unit="%"
                status={m.value >= 95 ? 'excellent' : m.value >= 85 ? 'good' : m.value >= 70 ? 'warning' : 'poor'}
                trend={m.trend as any}
              />
            ))}
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                Quality Metrics Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={qualityChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value) => [`${value}%`, 'Quality Score']} />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'insights' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">AI-Powered Insights</h3>
            <Button variant="outline" size="sm">Generate New Analysis</Button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {insights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        </div>
      )}

      {activeTab === 'performance' && performanceMetrics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-600">Processing Time</CardTitle></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{performanceMetrics.processing_time}s</div>
                <p className="text-xs text-gray-500 mt-1">Average processing time</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-600">Throughput</CardTitle></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{performanceMetrics.throughput.toLocaleString()}</div>
                <p className="text-xs text-gray-500 mt-1">Rows per second</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-600">Error Rate</CardTitle></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{performanceMetrics.error_rate}%</div>
                <p className="text-xs text-gray-500 mt-1">Processing errors</p>
              </CardContent>
            </Card>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><PieChartIcon className="h-5 w-5 text-green-500" />Resource Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={performanceChartData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                        {performanceChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-blue-500" />Performance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[
                      { time: '00:00', memory: 30, cpu: 15, cache: 75 },
                      { time: '04:00', memory: 35, cpu: 20, cache: 80 },
                      { time: '08:00', memory: 45, cpu: 25, cache: 85 },
                      { time: '12:00', memory: 50, cpu: 30, cache: 90 },
                      { time: '16:00', memory: 45, cpu: 25, cache: 87 },
                      { time: '20:00', memory: 40, cpu: 20, cache: 82 },
                      { time: '24:00', memory: 35, cpu: 18, cache: 78 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="memory" stroke="#8884d8" name="Memory %" />
                      <Line type="monotone" dataKey="cpu" stroke="#82ca9d" name="CPU %" />
                      <Line type="monotone" dataKey="cache" stroke="#ffc658" name="Cache %" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
export default DataQualityDashboard;
export { DataQualityDashboard };
