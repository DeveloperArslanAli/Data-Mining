import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ComposedChart
} from 'recharts';
import { 
  TrendingUp, 
  BarChart3, 
  PieChart as PieChartIcon,
  Download,
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  Users,
  Calendar,
  Filter,
  RefreshCw
} from 'lucide-react';
import { ExportAnalytics, PerformanceMetrics } from '@/types';
import { cn } from '@/lib/utils';

interface ExportAnalyticsProps {
  className?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC0CB', '#32CD32'];

const MetricCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'success' | 'warning' | 'error';
  className?: string;
}> = ({ title, value, subtitle, icon, trend, variant = 'default', className }) => {
  const getVariantColors = (variant: string) => {
    switch (variant) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
          <div className={cn('p-2 rounded-lg border', getVariantColors(variant))}>
            {icon}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        )}
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp 
              className={cn(
                'h-3 w-3',
                trend.isPositive ? 'text-green-500' : 'text-red-500'
              )} 
            />
            <span className={cn(
              'text-xs',
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            )}>
              {trend.isPositive ? '+' : ''}{trend.value}% from last month
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const ExportAnalyticsComponent: React.FC<ExportAnalyticsProps> = ({ className }) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [exportAnalytics, setExportAnalytics] = useState<ExportAnalytics | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'performance' | 'users'>('overview');

  useEffect(() => {
    // Simulate loading export analytics data
    const loadExportAnalytics = async () => {
      setIsLoading(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock data for demonstration
      setExportAnalytics({
        total_exports: 1247,
        successful_exports: 1189,
        failed_exports: 58,
        average_processing_time: 2.3,
        format_distribution: {
          'CSV': 45,
          'JSON': 28,
          'XLSX': 18,
          'XML': 6,
          'PARQUET': 3
        },
        size_distribution: [
          { range: '0-1MB', count: 156, percentage: 12.5 },
          { range: '1-10MB', count: 623, percentage: 50.0 },
          { range: '10-100MB', count: 374, percentage: 30.0 },
          { range: '100MB+', count: 94, percentage: 7.5 }
        ],
        user_activity: [
          { user: 'john.doe', exports_count: 45, total_size: 1024 * 1024 * 150 },
          { user: 'jane.smith', exports_count: 38, total_size: 1024 * 1024 * 89 },
          { user: 'mike.johnson', exports_count: 32, total_size: 1024 * 1024 * 67 },
          { user: 'sarah.wilson', exports_count: 28, total_size: 1024 * 1024 * 45 },
          { user: 'david.brown', exports_count: 25, total_size: 1024 * 1024 * 38 }
        ],
        time_series: [
          { date: '2024-01-01', exports_count: 12, average_size: 1024 * 1024 * 25 },
          { date: '2024-01-02', exports_count: 18, average_size: 1024 * 1024 * 32 },
          { date: '2024-01-03', exports_count: 15, average_size: 1024 * 1024 * 28 },
          { date: '2024-01-04', exports_count: 22, average_size: 1024 * 1024 * 35 },
          { date: '2024-01-05', exports_count: 19, average_size: 1024 * 1024 * 30 },
          { date: '2024-01-06', exports_count: 25, average_size: 1024 * 1024 * 42 },
          { date: '2024-01-07', exports_count: 21, average_size: 1024 * 1024 * 38 }
        ]
      });

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

    loadExportAnalytics();
  }, [timeRange]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const successRate = exportAnalytics ? (exportAnalytics.successful_exports / exportAnalytics.total_exports) * 100 : 0;

  if (isLoading) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!exportAnalytics) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="text-center text-gray-500">No export analytics data available</div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Export Analytics</h2>
          <p className="text-gray-600">Comprehensive insights into export performance and trends</p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            options={[
              { value: '7d', label: 'Last 7 days' },
              { value: '30d', label: 'Last 30 days' },
              { value: '90d', label: 'Last 90 days' },
              { value: '1y', label: 'Last year' }
            ]}
            value={timeRange}
            onChange={(value) => setTimeRange(value as any)}
            size="sm"
          />
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'trends', label: 'Trends', icon: TrendingUp },
            { id: 'performance', label: 'Performance', icon: Activity },
            { id: 'users', label: 'User Activity', icon: Users }
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

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Total Exports"
                value={exportAnalytics.total_exports.toLocaleString()}
                subtitle={`Last ${timeRange}`}
                icon={<Download className="h-4 w-4" />}
                trend={{ value: 12, isPositive: true }}
                variant="default"
              />
              <MetricCard
                title="Success Rate"
                value={`${successRate.toFixed(1)}%`}
                subtitle={`${exportAnalytics.successful_exports} successful`}
                icon={<CheckCircle className="h-4 w-4" />}
                trend={{ value: 3, isPositive: true }}
                variant="success"
              />
              <MetricCard
                title="Failed Exports"
                value={exportAnalytics.failed_exports}
                subtitle={`${((exportAnalytics.failed_exports / exportAnalytics.total_exports) * 100).toFixed(1)}% failure rate`}
                icon={<XCircle className="h-4 w-4" />}
                trend={{ value: -8, isPositive: true }}
                variant="error"
              />
              <MetricCard
                title="Avg Processing Time"
                value={`${exportAnalytics.average_processing_time}s`}
                subtitle="Per export job"
                icon={<Clock className="h-4 w-4" />}
                trend={{ value: -15, isPositive: true }}
                variant="warning"
              />
            </div>

            {/* Format Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-500" />
                    Export Format Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={Object.entries(exportAnalytics.format_distribution).map(([format, count]) => ({
                            name: format,
                            value: count
                          }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {Object.entries(exportAnalytics.format_distribution).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-green-500" />
                    File Size Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={exportAnalytics.size_distribution}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="range" />
                        <YAxis />
                        <Tooltip formatter={(value, name) => [value, name === 'count' ? 'Count' : 'Percentage']} />
                        <Bar dataKey="count" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {activeTab === 'trends' && (
          <>
            {/* Time Series Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  Export Trends Over Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={exportAnalytics.time_series}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Area 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="average_size" 
                        fill="#e0f2fe" 
                        stroke="#0284c7"
                        name="Average Size (MB)"
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="exports_count" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        name="Export Count"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Trend Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-purple-500" />
                  Trend Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Export Volume Trends</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Peak Export Day</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Saturday</span>
                          <Badge variant="success" className="text-xs">+25%</Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Lowest Export Day</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Sunday</span>
                          <Badge variant="warning" className="text-xs">-15%</Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Weekly Growth</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">+8.5%</span>
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Size Trends</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Average File Size</span>
                        <span className="font-medium">{formatFileSize(exportAnalytics.time_series.reduce((acc, day) => acc + day.average_size, 0) / exportAnalytics.time_series.length)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Size Growth Trend</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">+12%</span>
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Largest Export</span>
                        <span className="font-medium">2.1 GB</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {activeTab === 'performance' && performanceMetrics && (
          <>
            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <MetricCard
                title="Processing Time"
                value={`${performanceMetrics.processing_time}s`}
                subtitle="Average per export"
                icon={<Clock className="h-4 w-4" />}
                variant="default"
              />
              <MetricCard
                title="Throughput"
                value={`${performanceMetrics.throughput.toLocaleString()}`}
                subtitle="Rows per second"
                icon={<Activity className="h-4 w-4" />}
                variant="success"
              />
              <MetricCard
                title="Cache Hit Rate"
                value={`${performanceMetrics.cache_hit_rate}%`}
                subtitle="Cache efficiency"
                icon={<TrendingUp className="h-4 w-4" />}
                variant="success"
              />
              <MetricCard
                title="Memory Usage"
                value={`${performanceMetrics.memory_usage}%`}
                subtitle="Peak usage"
                icon={<BarChart3 className="h-4 w-4" />}
                variant="warning"
              />
              <MetricCard
                title="CPU Usage"
                value={`${performanceMetrics.cpu_usage}%`}
                subtitle="Average utilization"
                icon={<Activity className="h-4 w-4" />}
                variant="warning"
              />
              <MetricCard
                title="Error Rate"
                value={`${performanceMetrics.error_rate}%`}
                subtitle="Processing errors"
                icon={<AlertTriangle className="h-4 w-4" />}
                variant="error"
              />
            </div>

            {/* Performance Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  Performance Trends
                </CardTitle>
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
                      { time: '24:00', memory: 35, cpu: 18, cache: 78 }
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
          </>
        )}

        {activeTab === 'users' && (
          <>
            {/* Top Users */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-500" />
                  Top Export Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {exportAnalytics.user_activity.map((user, index) => (
                    <div key={user.user} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center text-white font-medium text-sm",
                          index === 0 ? "bg-yellow-500" : 
                          index === 1 ? "bg-gray-400" : 
                          index === 2 ? "bg-orange-500" : "bg-blue-500"
                        )}>
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{user.user}</h4>
                          <p className="text-sm text-gray-500">
                            {user.exports_count} exports • {formatFileSize(user.total_size)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {((user.exports_count / exportAnalytics.total_exports) * 100).toFixed(1)}%
                        </Badge>
                        <span className="text-xs text-gray-400">
                          {formatFileSize(user.total_size / user.exports_count)} avg
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* User Activity Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-green-500" />
                  User Export Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={exportAnalytics.user_activity}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="user" />
                      <YAxis />
                      <Tooltip formatter={(value, name) => [value, name === 'exports_count' ? 'Export Count' : 'Total Size']} />
                      <Bar dataKey="exports_count" fill="#10b981" name="Export Count" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default ExportAnalyticsComponent;
