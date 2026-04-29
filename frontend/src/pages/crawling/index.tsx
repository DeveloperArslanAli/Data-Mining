// Web Crawling Dashboard (minimal, aligned with current CrawlingJob type)
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { Info, Globe, CheckCircle, Clock, AlertCircle, Settings, Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/auth';
import { formatDate } from '@/lib/utils';
import { CrawlingJob } from '@/types';

export default function WebCrawlingPage() {
  const { user } = useAuthStore();
  const [jobs, setJobs] = useState<CrawlingJob[]>([]);
  const [loading, setLoading] = useState(true);

  const icon = (s: string) => {
    const n = s.toLowerCase();
    if (n === 'completed') return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (n === 'processing') return <Clock className="w-4 h-4 text-blue-500 animate-pulse" />;
    if (n === 'pending') return <Clock className="w-4 h-4 text-yellow-500" />;
    if (n === 'failed') return <AlertCircle className="w-4 h-4 text-red-500" />;
    return <Settings className="w-4 h-4 text-gray-500" />;
  };

  const badge = (s: string) => {
    const n = s.toLowerCase();
    if (n === 'completed') return 'text-green-700 bg-green-100 dark:bg-green-900/30';
    if (n === 'processing') return 'text-blue-700 bg-blue-100 dark:bg-blue-900/30';
    if (n === 'pending') return 'text-yellow-700 bg-yellow-100 dark:bg-yellow-900/30';
    if (n === 'failed') return 'text-red-700 bg-red-100 dark:bg-red-900/30';
    return 'text-gray-700 bg-gray-100 dark:bg-gray-800';
  };

  useEffect(() => {
    const mock: CrawlingJob[] = [
      { id: 1, status: 'completed', urls: ['https://example.com'], max_depth: 2, max_pages: 100, pages_crawled: 50, data_extracted: true, created_at: new Date().toISOString() },
      { id: 2, status: 'processing', urls: ['https://example.org'], max_depth: 3, max_pages: 150, pages_crawled: 80, data_extracted: true, created_at: new Date().toISOString() },
      { id: 3, status: 'pending', urls: ['https://example.net'], max_depth: 1, max_pages: 60, pages_crawled: 0, data_extracted: false, created_at: new Date().toISOString() }
    ];
    setJobs(mock);
    setLoading(false);
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <>
      <Head><title>Crawling - Data Mining Platform</title></Head>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Web Crawling</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Simplified crawling dashboard</p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" leftIcon={<RefreshCw className="w-4 h-4" />}>Refresh</Button>
            <Button leftIcon={<Plus className="w-4 h-4" />}>New Job</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-center">
            <Globe className="w-8 h-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Total Jobs</p>
              <p className="text-2xl font-bold">{jobs.length}</p>
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">Completed</p>
              <p className="text-2xl font-bold">{jobs.filter(j=>j.status.toLowerCase()==='completed').length}</p>
            </div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-center">
            <Clock className="w-8 h-8 text-yellow-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Processing</p>
              <p className="text-2xl font-bold">{jobs.filter(j=>j.status.toLowerCase()==='processing').length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Jobs</h2>
          <div className="space-y-4">
            {jobs.map(job => (
              <div key={job.id} className="border rounded-lg p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    {icon(job.status)}
                    <span className={`text-xs px-2 py-1 rounded-full ${badge(job.status)}`}>{job.status}</span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {job.pages_crawled} pages • Max Depth {job.max_depth} • Created {formatDate(job.created_at)}
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {job.urls.length} URL{job.urls.length!==1 && 's'}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-500 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">Module Notice</h4>
              <p className="mt-2 text-sm text-blue-800 dark:text-blue-200">
                This simplified view matches the current CrawlingJob type. Advanced analytics will return once API contracts are finalized.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
