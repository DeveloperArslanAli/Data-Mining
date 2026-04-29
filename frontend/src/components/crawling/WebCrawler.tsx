import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { 
  Globe, 
  Play, 
  Pause, 
  Settings, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Target,
  Filter,
  Download,
  Eye,
  Search,
  Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export interface CrawlingJob {
  id: string;
  name: string;
  url: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'paused';
  progress: number;
  pagesCrawled: number;
  totalPages: number;
  dataExtracted: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
  config: CrawlingConfig;
}

export interface CrawlingConfig {
  maxDepth: number;
  maxPages: number;
  delay: number;
  followLinks: boolean;
  extractImages: boolean;
  extractTables: boolean;
  customSelectors: Record<string, string>;
  filters: Record<string, any>;
}

export interface WebCrawlerProps {
  onStartCrawling: (url: string, config: CrawlingConfig) => Promise<void>;
  onPauseCrawling: (jobId: string) => Promise<void>;
  onResumeCrawling: (jobId: string) => Promise<void>;
  onCancelCrawling: (jobId: string) => Promise<void>;
  onDownloadData: (jobId: string) => Promise<void>;
  className?: string;
}

const WebCrawler: React.FC<WebCrawlerProps> = ({
  onStartCrawling,
  onPauseCrawling,
  onResumeCrawling,
  onCancelCrawling,
  onDownloadData,
  className,
}) => {
  const [crawlingJobs, setCrawlingJobs] = useState<CrawlingJob[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [crawlingConfig, setCrawlingConfig] = useState<CrawlingConfig>({
    maxDepth: 2,
    maxPages: 100,
    delay: 1000,
    followLinks: true,
    extractImages: false,
    extractTables: true,
    customSelectors: {},
    filters: {},
  });
  const [targetUrl, setTargetUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const delayOptions = [
    { value: '0', label: 'No delay (0ms)' },
    { value: '500', label: 'Fast (500ms)' },
    { value: '1000', label: 'Normal (1s)' },
    { value: '2000', label: 'Slow (2s)' },
    { value: '5000', label: 'Very slow (5s)' },
  ];

  const depthOptions = [
    { value: '1', label: '1 level deep' },
    { value: '2', label: '2 levels deep' },
    { value: '3', label: '3 levels deep' },
    { value: '4', label: '4 levels deep' },
    { value: '5', label: '5 levels deep' },
  ];

  const pageLimitOptions = [
    { value: '10', label: '10 pages' },
    { value: '50', label: '50 pages' },
    { value: '100', label: '100 pages' },
    { value: '500', label: '500 pages' },
    { value: '1000', label: '1000 pages' },
  ];

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleStartCrawling = async () => {
    if (!targetUrl.trim()) {
      toast.error('Please enter a target URL');
      return;
    }

    if (!validateUrl(targetUrl)) {
      toast.error('Please enter a valid URL');
      return;
    }

    try {
  setIsLoading(true);
  await onStartCrawling(targetUrl, crawlingConfig);
      
      const newJob: CrawlingJob = {
        id: Math.random().toString(36).substr(2, 9),
        name: `Crawl: ${new URL(targetUrl).hostname}`,
        url: targetUrl,
        status: 'processing',
        progress: 0,
        pagesCrawled: 0,
        totalPages: crawlingConfig.maxPages,
        dataExtracted: 0,
        createdAt: new Date(),
        startedAt: new Date(),
        config: crawlingConfig,
      };
      
      setCrawlingJobs(prev => [...prev, newJob]);
      setIsModalOpen(false);
      setTargetUrl('');
      
      toast.success('Crawling job started successfully');
      
      // Simulate progress updates
      simulateCrawlingProgress(newJob.id);
      
    } catch (error) {
      toast.error('Failed to start crawling job');
    } finally {
      setIsLoading(false);
    }
  };

  const simulateCrawlingProgress = (jobId: string) => {
    let progress = 0;
    let pagesCrawled = 0;
    const totalPages = crawlingConfig.maxPages;
    
    const interval = setInterval(() => {
      progress += Math.random() * 10;
      pagesCrawled += Math.floor(Math.random() * 3) + 1;
      
      if (progress >= 100 || pagesCrawled >= totalPages) {
        progress = 100;
        pagesCrawled = totalPages;
        clearInterval(interval);
        
        setCrawlingJobs(prev => 
          prev.map(job => 
            job.id === jobId 
              ? { 
                  ...job, 
                  status: 'completed', 
                  progress: 100, 
                  pagesCrawled,
                  dataExtracted: Math.floor(pagesCrawled * 15), // Simulate data extraction
                  completedAt: new Date() 
                }
              : job
          )
        );
        
        toast.success('Crawling completed successfully');
      } else {
        setCrawlingJobs(prev => 
          prev.map(job => 
            job.id === jobId 
              ? { 
                  ...job, 
                  progress: Math.round(progress),
                  pagesCrawled,
                  dataExtracted: Math.floor(pagesCrawled * 15)
                }
              : job
          )
        );
      }
    }, 2000);
  };

  const handlePauseCrawling = async (jobId: string) => {
    try {
      await onPauseCrawling(jobId);
      setCrawlingJobs(prev => 
        prev.map(job => 
          job.id === jobId 
            ? { ...job, status: 'paused' }
            : job
        )
      );
      toast.success('Crawling paused');
    } catch (error) {
      toast.error('Failed to pause crawling');
    }
  };

  const handleResumeCrawling = async (jobId: string) => {
    try {
      await onResumeCrawling(jobId);
      setCrawlingJobs(prev => 
        prev.map(job => 
          job.id === jobId 
            ? { ...job, status: 'processing' }
            : job
        )
      );
      toast.success('Crawling resumed');
    } catch (error) {
      toast.error('Failed to resume crawling');
    }
  };

  const handleCancelCrawling = async (jobId: string) => {
    try {
      await onCancelCrawling(jobId);
      setCrawlingJobs(prev => 
        prev.map(job => 
          job.id === jobId 
            ? { ...job, status: 'failed', errorMessage: 'Cancelled by user' }
            : job
        )
      );
      toast.success('Crawling cancelled');
    } catch (error) {
      toast.error('Failed to cancel crawling');
    }
  };

  const handleDownloadData = async (jobId: string) => {
    try {
      await onDownloadData(jobId);
      toast.success('Data download started');
    } catch (error) {
      toast.error('Failed to download data');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <Globe className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'success' as const,
      failed: 'error' as const,
      processing: 'primary' as const,
      paused: 'warning' as const,
      pending: 'secondary' as const,
    };
    
    return <Badge variant={variants[status as keyof typeof variants]}>{status}</Badge>;
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Quick Start */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-500" />
            Web Crawler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Start New Crawl
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Crawling Jobs */}
      {crawlingJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-500" />
              Active Crawling Jobs ({crawlingJobs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {crawlingJobs.map((job) => (
                <div
                  key={job.id}
                  className="border rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(job.status)}
                      <div>
                        <h4 className="font-medium text-gray-900">{job.name}</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Globe className="h-3 w-3" />
                          <span className="truncate max-w-xs">{job.url}</span>
                          <span>•</span>
                          <span>Started {job.startedAt?.toLocaleTimeString() || job.createdAt.toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(job.status)}
                      {job.status === 'processing' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePauseCrawling(job.id)}
                        >
                          <Pause className="h-4 w-4" />
                        </Button>
                      )}
                      {job.status === 'paused' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResumeCrawling(job.id)}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      {(job.status === 'processing' || job.status === 'paused') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelCrawling(job.id)}
                        >
                          <AlertCircle className="h-4 w-4" />
                        </Button>
                      )}
                      {job.status === 'completed' && (
                        <Button
                          size="sm"
                          onClick={() => handleDownloadData(job.id)}
                          className="flex items-center gap-1"
                        >
                          <Download className="h-3 w-3" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <Progress
                    value={job.progress}
                    max={100}
                    size="sm"
                    variant={job.status === 'failed' ? 'error' : 'default'}
                    showLabel
                  />
                  
                  <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                    <div className="text-center">
                      <div className="font-medium text-gray-900">{job.pagesCrawled}</div>
                      <div className="text-gray-500">Pages Crawled</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-gray-900">{job.totalPages}</div>
                      <div className="text-gray-500">Total Pages</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-gray-900">{job.dataExtracted}</div>
                      <div className="text-gray-500">Data Points</div>
                    </div>
                  </div>
                  
                  {job.errorMessage && (
                    <p className="text-sm text-red-600 mt-2">{job.errorMessage}</p>
                  )}
                  
                  {job.completedAt && (
                    <p className="text-sm text-gray-500 mt-2">
                      Completed at {job.completedAt.toLocaleTimeString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Crawling Configuration Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Configure Web Crawler"
        size="xl"
      >
        <ModalBody>
          <div className="space-y-6">
            {/* Basic Configuration */}
            <div>
              <h3 className="font-medium text-gray-900 mb-4">Basic Configuration</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target URL
                  </label>
                  <Input
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    placeholder="https://example.com"
                    leftIcon={<Globe className="h-4 w-4" />}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Crawl Depth
                    </label>
                    <Select
                      options={depthOptions}
                      value={crawlingConfig.maxDepth.toString()}
                      onChange={(value) => setCrawlingConfig(prev => ({ ...prev, maxDepth: parseInt(value) }))}
                      placeholder="Select depth"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Page Limit
                    </label>
                    <Select
                      options={pageLimitOptions}
                      value={crawlingConfig.maxPages.toString()}
                      onChange={(value) => setCrawlingConfig(prev => ({ ...prev, maxPages: parseInt(value) }))}
                      placeholder="Select limit"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Delay Between Requests
                    </label>
                    <Select
                      options={delayOptions}
                      value={crawlingConfig.delay.toString()}
                      onChange={(value) => setCrawlingConfig(prev => ({ ...prev, delay: parseInt(value) }))}
                      placeholder="Select delay"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Extraction Options */}
            <div>
              <h3 className="font-medium text-gray-900 mb-4">Extraction Options</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="follow-links"
                    checked={crawlingConfig.followLinks}
                    onChange={(e) => setCrawlingConfig(prev => ({ ...prev, followLinks: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="follow-links" className="ml-2 text-sm text-gray-700">
                    Follow internal links
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="extract-images"
                    checked={crawlingConfig.extractImages}
                    onChange={(e) => setCrawlingConfig(prev => ({ ...prev, extractImages: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="extract-images" className="ml-2 text-sm text-gray-700">
                    Extract images and media
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="extract-tables"
                    checked={crawlingConfig.extractTables}
                    onChange={(e) => setCrawlingConfig(prev => ({ ...prev, extractTables: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="extract-tables" className="ml-2 text-sm text-gray-700">
                    Extract table data
                  </label>
                </div>
              </div>
            </div>

            {/* Advanced Options */}
            <div>
              <h3 className="font-medium text-gray-900 mb-4">Advanced Options</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custom CSS Selectors (optional)
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="title: h1&#10;content: .article-content&#10;author: .author-name"
                    value={Object.entries(crawlingConfig.customSelectors)
                      .map(([key, value]) => `${key}: ${value}`)
                      .join('\n')}
                    onChange={(e) => {
                      const selectors: Record<string, string> = {};
                      e.target.value.split('\n').forEach(line => {
                        const [key, value] = line.split(':').map(s => s.trim());
                        if (key && value) {
                          selectors[key] = value;
                        }
                      });
                      setCrawlingConfig(prev => ({ ...prev, customSelectors: selectors }));
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Format: name: css-selector (one per line)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ModalBody>
        
        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => setIsModalOpen(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleStartCrawling}
            disabled={isLoading || !targetUrl.trim()}
            loading={isLoading}
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            Start Crawling
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default WebCrawler;
