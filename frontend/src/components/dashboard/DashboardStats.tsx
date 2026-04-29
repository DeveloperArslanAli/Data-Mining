import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { 
  Database, 
  FileText, 
  TrendingUp, 
  Download, 
  Globe, 
  Activity,
  Users,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DashboardStatsProps {
  stats: {
    totalDatasets: number;
    totalOperations: number;
    totalExports: number;
    totalCrawlingJobs: number;
    activeUsers: number;
    recentActivity: number;
    dataProcessed: number;
    averageProcessingTime: number;
  };
  className?: string;
}

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}> = ({ title, value, icon, trend, className }) => {
  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        <div className="h-4 w-4 text-gray-400">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {trend && (
          <p className={cn(
            'text-xs mt-1',
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          )}>
            {trend.isPositive ? '+' : ''}{trend.value}% from last month
          </p>
        )}
      </CardContent>
    </Card>
  );
};

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats, className }) => {
  const formatNumber = (num: number | undefined | null): string => {
    const n = typeof num === 'number' && isFinite(num) ? num : 0;
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
  };

  const formatTime = (minutes: number | undefined | null): string => {
    const m = typeof minutes === 'number' && isFinite(minutes) ? minutes : 0;
    if (m < 60) return `${Math.round(m)}m`;
    const hours = Math.floor(m / 60);
    const remainingMinutes = Math.round(m % 60);
    return `${hours}h ${remainingMinutes}m`;
  };

  const formatDataSize = (bytes: number | undefined | null): string => {
    const b = typeof bytes === 'number' && isFinite(bytes) && bytes > 0 ? bytes : 0;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (b === 0) return '0 B';
    const i = Math.min(Math.floor(Math.log(b) / Math.log(1024)), sizes.length - 1);
    const value = Math.round((b / Math.pow(1024, i)) * 100) / 100;
    return `${value} ${sizes[i]}`;
  };

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4', className)}>
      <StatCard
        title="Total Datasets"
        value={formatNumber(stats.totalDatasets)}
        icon={<Database className="h-4 w-4" />}
        trend={{ value: 12, isPositive: true }}
      />
      
      <StatCard
        title="Cleaning Operations"
        value={formatNumber(stats.totalOperations)}
        icon={<Activity className="h-4 w-4" />}
        trend={{ value: 8, isPositive: true }}
      />
      
      <StatCard
        title="Export Jobs"
        value={formatNumber(stats.totalExports)}
        icon={<Download className="h-4 w-4" />}
        trend={{ value: 15, isPositive: true }}
      />
      
      <StatCard
        title="Crawling Jobs"
        value={formatNumber(stats.totalCrawlingJobs)}
        icon={<Globe className="h-4 w-4" />}
        trend={{ value: 5, isPositive: true }}
      />
      
      <StatCard
        title="Active Users"
        value={formatNumber(stats.activeUsers)}
        icon={<Users className="h-4 w-4" />}
        trend={{ value: 3, isPositive: true }}
      />
      
      <StatCard
        title="Recent Activity"
        value={formatNumber(stats.recentActivity)}
        icon={<Clock className="h-4 w-4" />}
        trend={{ value: 20, isPositive: true }}
      />
      
      <StatCard
        title="Data Processed"
        value={formatDataSize(stats.dataProcessed)}
        icon={<FileText className="h-4 w-4" />}
        trend={{ value: 25, isPositive: true }}
      />
      
      <StatCard
        title="Avg Processing Time"
        value={formatTime(stats.averageProcessingTime)}
        icon={<TrendingUp className="h-4 w-4" />}
        trend={{ value: -10, isPositive: false }}
      />
    </div>
  );
};

export default DashboardStats;
