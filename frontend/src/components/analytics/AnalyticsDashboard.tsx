import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { 
  BarChart3, 
  TrendingUp, 
  Activity, 
  Database, 
  Download, 
  Globe,
  Users,
  Clock,
  Filter,
  RefreshCw,
  Settings,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2
} from 'lucide-react';
import DataQualityDashboard from './DataQualityDashboard';
import StatisticalAnalysis from './StatisticalAnalysis';
import ExportAnalyticsComponent from './ExportAnalytics';
import { cn } from '@/lib/utils';

interface AnalyticsDashboardProps {
  className?: string;
}

interface AnalyticsOverview {
  totalDatasets: number;
  totalOperations: number;
  totalExports: number;
  totalCrawlingJobs: number;
  dataQualityScore: number;
  averageProcessingTime: number;
  activeUsers: number;
  systemHealth: 'excellent' | 'good' | 'warning' | 'critical';
}

const SystemHealthCard: React.FC<{
  health: string;
  className?: string;
}> = ({ health, className }) => {
  const getHealthConfig = (health: string) => {
    switch (health) {
      case 'excellent':
        return { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', label: 'Excellent' };
      case 'good':
        return { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', label: 'Good' };
      case 'warning':
        return { color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', label: 'Warning' };
      case 'critical':
        return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'Critical' };
      default:
        return { color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', label: 'Unknown' };
    }
  };

  const config = getHealthConfig(health);

  return (
    <Card className={cn('border-l-4', config.border, className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">System Health</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-lg', config.bg)}>
            <Activity className={cn('h-6 w-6', config.color)} />
          </div>
          <div>
            <div className={cn('text-xl font-bold', config.color)}>{config.label}</div>
            <p className="text-xs text-gray-500">Overall system status</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ className }) => {
  const [selectedDataset, setSelectedDataset] = useState<string>('');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [activeSection, setActiveSection] = useState<'overview' | 'quality' | 'statistics' | 'export' | 'crawling'>('overview');
  const [overviewData, setOverviewData] = useState<AnalyticsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']));

  useEffect(() => {
    // Simulate loading analytics overview data
    const loadAnalyticsOverview = async () => {
      setIsLoading(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data for demonstration
      setOverviewData({
        totalDatasets: 24,
        totalOperations: 156,
        totalExports: 89,
        totalCrawlingJobs: 12,
        dataQualityScore: 90.9,
        averageProcessingTime: 3.2,
        activeUsers: 8,
        systemHealth: 'good'
      });
      
      setIsLoading(false);
    };

    loadAnalyticsOverview();
  }, [timeRange]);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const isSectionExpanded = (section: string) => expandedSections.has(section);

  if (isLoading) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!overviewData) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="text-center text-gray-500">No analytics data available</div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive data mining analytics and insights</p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            options={[
              { value: '7d', label: 'Last 7 days' },
              { value: '30d', label: 'Last 30 days' },
              { value: '90d', label: 'Last 90 days' },
              { value: '1y', label: 'Last year' },
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
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Overview Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              Analytics Overview
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleSection('overview')}
            >
              {isSectionExpanded('overview') ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        {isSectionExpanded('overview') && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
                    Total Datasets
                    <Database className="h-4 w-4 text-blue-500" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{overviewData.totalDatasets}</div>
                  <p className="text-xs text-gray-500 mt-1">Active datasets</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
                    Data Quality Score
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{overviewData.dataQualityScore}%</div>
                  <p className="text-xs text-gray-500 mt-1">Overall quality</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
                    Avg Processing Time
                    <Clock className="h-4 w-4 text-orange-500" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{overviewData.averageProcessingTime}s</div>
                  <p className="text-xs text-gray-500 mt-1">Per operation</p>
                </CardContent>
              </Card>

              <SystemHealthCard health={overviewData.systemHealth} />
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-gray-700">Operations</span>
                </div>
                <Badge variant="secondary">{overviewData.totalOperations}</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-700">Exports</span>
                </div>
                <Badge variant="secondary">{overviewData.totalExports}</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium text-gray-700">Crawling Jobs</span>
                </div>
                <Badge variant="secondary">{overviewData.totalCrawlingJobs}</Badge>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Data Quality Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Data Quality Analytics
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleSection('quality')}
            >
              {isSectionExpanded('quality') ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        {isSectionExpanded('quality') && (
          <CardContent>
            <DataQualityDashboard
              datasetId={1}
              datasetName="Sample Dataset"
            />
          </CardContent>
        )}
      </Card>

      {/* Statistical Analysis Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              Statistical Analysis
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleSection('statistics')}
            >
              {isSectionExpanded('statistics') ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        {isSectionExpanded('statistics') && (
          <CardContent>
            <StatisticalAnalysis
              datasetId={1}
              datasetName="Sample Dataset"
            />
          </CardContent>
        )}
      </Card>

      {/* Export Analytics Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-orange-500" />
              Export Analytics
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleSection('export')}
            >
              {isSectionExpanded('export') ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        {isSectionExpanded('export') && (
          <CardContent>
            <ExportAnalyticsComponent />
          </CardContent>
        )}
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-indigo-500" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-16 flex flex-col items-center justify-center gap-2"
              onClick={() => setActiveSection('quality')}
            >
              <TrendingUp className="h-6 w-6" />
              <span>Data Quality Report</span>
            </Button>
            <Button
              variant="outline"
              className="h-16 flex flex-col items-center justify-center gap-2"
              onClick={() => setActiveSection('statistics')}
            >
              <BarChart3 className="h-6 w-6" />
              <span>Statistical Analysis</span>
            </Button>
            <Button
              variant="outline"
              className="h-16 flex flex-col items-center justify-center gap-2"
              onClick={() => setActiveSection('export')}
            >
              <Download className="h-6 w-6" />
              <span>Export Analytics</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Footer Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">{overviewData.activeUsers}</div>
          <div className="text-sm text-gray-600">Active Users</div>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">{overviewData.totalDatasets}</div>
          <div className="text-sm text-gray-600">Datasets</div>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">{overviewData.dataQualityScore}%</div>
          <div className="text-sm text-gray-600">Quality Score</div>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">{overviewData.averageProcessingTime}s</div>
          <div className="text-sm text-gray-600">Avg Time</div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
