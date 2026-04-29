/**
 * Data Mining Platform - Sidebar Component
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  BarChart3,
  Database,
  FileText,
  Globe,
  Settings,
  User,
  ChevronLeft,
  ChevronRight,
  Home,
  Upload,
  Download,
  Activity,
  TrendingUp,
  Users,
  Shield,
} from 'lucide-react';

// Hooks
import { useAuthStore } from '@/store/auth';

// Utils
import { cn, getInitials } from '@/lib/utils';
import { UserRole } from '@/types';

interface SidebarProps {
  className?: string;
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  className, 
  isCollapsed = false, 
  onToggle 
}) => {
  const router = useRouter();
  const { user } = useAuthStore();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      description: 'Overview and analytics',
    },
    {
      name: 'Datasets',
      href: '/datasets',
      icon: Database,
      description: 'Manage your datasets',
      children: [
        { name: 'All Datasets', href: '/datasets' },
        { name: 'Upload Dataset', href: '/datasets/upload' },
        { name: 'Dataset Quality', href: '/datasets/quality' },
      ],
    },
    {
      name: 'Data Cleaning',
      href: '/cleaning',
      icon: FileText,
      description: 'Clean and preprocess data',
      children: [
        { name: 'Cleaning Operations', href: '/cleaning' },
        { name: 'Auto Clean', href: '/cleaning/auto' },
        { name: 'Quality Reports', href: '/cleaning/reports' },
      ],
    },
    {
      name: 'Export',
      href: '/export',
      icon: Download,
      description: 'Export data in various formats',
      children: [
        { name: 'Export Jobs', href: '/export' },
        { name: 'Quick Export', href: '/export/quick' },
        { name: 'Export History', href: '/export/history' },
      ],
    },
    {
      name: 'Web Crawling',
      href: '/crawling',
      icon: Globe,
      description: 'Crawl and extract web data',
      children: [
        { name: 'Crawling Jobs', href: '/crawling' },
        { name: 'New Crawl', href: '/crawling/new' },
        { name: 'Crawled Data', href: '/crawling/data' },
      ],
    },
  ];

  const adminNavigation = [
    {
      name: 'Analytics',
      href: '/admin/analytics',
      icon: TrendingUp,
      description: 'Platform analytics',
    },
    {
      name: 'Users',
      href: '/admin/users',
      icon: Users,
      description: 'Manage users',
    },
    {
      name: 'System',
      href: '/admin/system',
      icon: Settings,
      description: 'System settings',
    },
  ];

  const isActiveRoute = (href: string) => {
    return router.pathname === href || router.pathname.startsWith(href + '/');
  };

  const renderNavItem = (item: any, level: number = 0) => {
    const Icon = item.icon;
    const isActive = isActiveRoute(item.href);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.name}>
        <Link
          href={item.href}
          className={cn(
            'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors group',
            level > 0 ? 'ml-4' : '',
            isActive
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
          )}
        >
          <Icon
            className={cn(
              'flex-shrink-0 w-5 h-5 mr-3',
              isActive
                ? 'text-blue-500 dark:text-blue-400'
                : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
            )}
          />
          {!isCollapsed && (
            <>
              <span className="flex-1">{item.name}</span>
              {hasChildren && (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
            </>
          )}
        </Link>
        
        {/* Render children if expanded */}
        {hasChildren && !isCollapsed && (
          <div className="ml-4 mt-1 space-y-1">
            {item.children.map((child: any) => (
              <Link
                key={child.name}
                href={child.href}
                className={cn(
                  'flex items-center px-3 py-2 text-sm rounded-md transition-colors',
                  isActiveRoute(child.href)
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                )}
              >
                <span className="ml-6">{child.name}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Database className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              DataMine
            </span>
          </div>
        )}
        
        <button
          onClick={onToggle}
          className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* User Info */}
      {!isCollapsed && user && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {getInitials((user as any).fullName || user.full_name || user.username)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {(user as any).fullName || user.full_name || user.username}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {user.role?.toLowerCase().replace('_', ' ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {/* Main Navigation */}
        <div className="space-y-1">
          {navigation.map((item) => renderNavItem(item))}
        </div>

        {/* Admin Navigation */}
  {user?.role === UserRole.ADMIN && (
          <>
            <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {!isCollapsed && 'Administration'}
              </div>
            </div>
            <div className="space-y-1">
              {adminNavigation.map((item) => renderNavItem(item))}
            </div>
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        {!isCollapsed ? (
          <div className="space-y-2">
            <Link
              href="/profile"
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <User className="w-5 h-5 mr-3 text-gray-400" />
              Profile
            </Link>
            <Link
              href="/settings"
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <Settings className="w-5 h-5 mr-3 text-gray-400" />
              Settings
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <Link
              href="/profile"
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              title="Profile"
            >
              <User className="w-5 h-5" />
            </Link>
            <Link
              href="/settings"
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
