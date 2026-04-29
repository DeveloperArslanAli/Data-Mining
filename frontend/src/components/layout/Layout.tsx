/**
 * Data Mining Platform - Layout Component
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/store/auth';
import { LoadingSpinner } from '@/components/ui';

// Components
import { Header } from './Header';
import { ThemeToggle } from '@/components/ui';
import { Sidebar } from './Sidebar';

// Types
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
  className?: string;
  showSidebar?: boolean;
  showHeader?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  className,
  showSidebar = true,
  showHeader = true,
}) => {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [globalLoading, setGlobalLoading] = useState(false);

  // Check if current route is auth-related
  const isAuthRoute = router.pathname.startsWith('/auth');

  // Handle authentication redirects
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated && !isAuthRoute) {
        router.push('/auth/login');
      } else if (isAuthenticated && isAuthRoute) {
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, isLoading, isAuthRoute, router]);

  useEffect(() => {
    const handleRouteChange = () => setGlobalLoading(true);
    const handleRouteComplete = () => setGlobalLoading(false);

    router.events.on('routeChangeStart', handleRouteChange);
    router.events.on('routeChangeComplete', handleRouteComplete);
    router.events.on('routeChangeError', handleRouteComplete);

    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
      router.events.off('routeChangeComplete', handleRouteComplete);
      router.events.off('routeChangeError', handleRouteComplete);
    };
  }, [router]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (globalLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // For auth routes, render without layout
  if (isAuthRoute) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        {children}
      </div>
    );
  }

  // For authenticated routes, render with layout
  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <div className={cn(
      "flex flex-col min-h-screen bg-gray-50",
      className
    )}>
      {/* Mobile sidebar overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      {showSidebar && (
        <>
          {/* Mobile sidebar */}
          <div
            className={`
              fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 transform transition-transform duration-300 ease-in-out lg:hidden
              ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}
          >
            <Sidebar
              isCollapsed={false}
              onToggle={() => setIsMobileSidebarOpen(false)}
            />
          </div>

          {/* Desktop sidebar */}
          <div
            className={cn(
              'hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40',
              isSidebarCollapsed ? 'lg:w-16' : 'lg:w-64'
            )}
          >
            <Sidebar
              isCollapsed={isSidebarCollapsed}
              onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            />
          </div>
        </>
      )}

      {/* Main content area */}
      <div
        className={`
          flex flex-col min-h-screen transition-all duration-300
          ${showSidebar ? (isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64') : ''}
        `}
      >
        {/* Header */}
  {showHeader && <Header className="sticky top-0 z-30" />}

        {/* Page content */}
        <main
          className={cn(
            'flex-1 p-4 sm:p-6 lg:p-8',
            className
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
};
