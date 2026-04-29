const Bull = require('bull');
const { v4: uuidv4 } = require('uuid');
const { logger } = require('../utils/logger');
const { redisService } = require('./redisService');
const { crawlerService } = require('./crawlerService');

class JobService {
  constructor() {
    this.crawlingQueue = new Bull('crawling-jobs', {
      redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      }
    });

    this.setupQueueHandlers();
  }

  setupQueueHandlers() {
    // Process jobs
    this.crawlingQueue.process(async (job) => {
      return await this.processCrawlingJob(job);
    });

    // Job completion
    this.crawlingQueue.on('completed', (job, result) => {
      logger.info('Crawling job completed', {
        jobId: job.id,
        result: result
      });
    });

    // Job failure
    this.crawlingQueue.on('failed', (job, err) => {
      logger.logError(err, {
        context: 'crawling-job-failed',
        jobId: job.id,
        data: job.data
      });
    });

    // Job progress
    this.crawlingQueue.on('progress', (job, progress) => {
      logger.info('Crawling job progress', {
        jobId: job.id,
        progress: progress
      });
    });
  }

  async createJob(jobData) {
    try {
      const jobId = uuidv4();
      const job = {
        id: jobId,
        status: 'pending',
        createdAt: new Date().toISOString(),
        ...jobData
      };

      // Store job metadata in Redis
      await redisService.setHash(`crawling_job:${jobId}`, 'metadata', job);
      await redisService.expire(`crawling_job:${jobId}`, 86400); // 24 hours

      // Add to queue
      const queueJob = await this.crawlingQueue.add(jobData.type || 'crawl', {
        jobId,
        ...jobData
      }, {
        jobId: jobId,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      });

      logger.info('Crawling job created', {
        jobId,
        queueJobId: queueJob.id,
        type: jobData.type
      });

      return job;
    } catch (error) {
      logger.logError(error, { context: 'create-job' });
      throw error;
    }
  }

  async getJob(jobId) {
    try {
      const metadata = await redisService.getHash(`crawling_job:${jobId}`, 'metadata');
      const progress = await redisService.getHash(`crawling_job:${jobId}`, 'progress');
      const results = await redisService.getHash(`crawling_job:${jobId}`, 'results');
      const errors = await redisService.getHash(`crawling_job:${jobId}`, 'errors');

      if (!metadata) {
        return null;
      }

      return {
        ...metadata,
        progress: progress || {},
        results: results || [],
        errors: errors || []
      };
    } catch (error) {
      logger.logError(error, { context: 'get-job', jobId });
      return null;
    }
  }

  async updateJobStatus(jobId, status, details = {}) {
    try {
      const metadata = await redisService.getHash(`crawling_job:${jobId}`, 'metadata');
      if (!metadata) {
        throw new Error('Job not found');
      }

      const updatedMetadata = {
        ...metadata,
        status,
        updatedAt: new Date().toISOString(),
        ...details
      };

      await redisService.setHash(`crawling_job:${jobId}`, 'metadata', updatedMetadata);

      logger.info('Job status updated', {
        jobId,
        status,
        details
      });

      return updatedMetadata;
    } catch (error) {
      logger.logError(error, { context: 'update-job-status', jobId, status });
      throw error;
    }
  }

  async updateJobProgress(jobId, progress) {
    try {
      await redisService.setHash(`crawling_job:${jobId}`, 'progress', progress);
    } catch (error) {
      logger.logError(error, { context: 'update-job-progress', jobId, progress });
    }
  }

  async addJobResults(jobId, results) {
    try {
      const existingResults = await redisService.getHash(`crawling_job:${jobId}`, 'results') || [];
      const updatedResults = [...existingResults, ...results];
      
      await redisService.setHash(`crawling_job:${jobId}`, 'results', updatedResults);
    } catch (error) {
      logger.logError(error, { context: 'add-job-results', jobId });
    }
  }

  async addJobError(jobId, error) {
    try {
      const existingErrors = await redisService.getHash(`crawling_job:${jobId}`, 'errors') || [];
      const updatedErrors = [...existingErrors, {
        message: error.message,
        timestamp: new Date().toISOString(),
        url: error.url || null,
        details: error.details || {}
      }];
      
      await redisService.setHash(`crawling_job:${jobId}`, 'errors', updatedErrors);
    } catch (error) {
      logger.logError(error, { context: 'add-job-error', jobId });
    }
  }

  async cancelJob(jobId) {
    try {
      // Update job status
      await this.updateJobStatus(jobId, 'cancelled', {
        cancelledAt: new Date().toISOString()
      });

      // Remove from queue if still pending
      const queueJob = await this.crawlingQueue.getJob(jobId);
      if (queueJob && queueJob.data.status === 'waiting') {
        await queueJob.remove();
      }

      logger.info('Job cancelled', { jobId });
      return true;
    } catch (error) {
      logger.logError(error, { context: 'cancel-job', jobId });
      return false;
    }
  }

  async listJobs(userId, limit = 20, offset = 0) {
    try {
      const pattern = `crawling_job:*`;
      const keys = await redisService.keys(pattern);
      
      const jobs = [];
      for (const key of keys) {
        const metadata = await redisService.getHash(key, 'metadata');
        if (metadata && metadata.userId === userId) {
          jobs.push(metadata);
        }
      }

      // Sort by creation date (newest first)
      jobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return {
        jobs: jobs.slice(offset, offset + limit),
        total: jobs.length,
        page: Math.floor(offset / limit) + 1,
        pages: Math.ceil(jobs.length / limit)
      };
    } catch (error) {
      logger.logError(error, { context: 'list-jobs', userId });
      return { jobs: [], total: 0, page: 1, pages: 0 };
    }
  }

  async processCrawlingJob(job) {
    const { jobId, urls, maxDepth, maxPages, delay, followLinks, extractData, dataSelectors } = job.data;
    
    try {
      logger.info('Starting crawling job processing', { jobId, urls });

      // Update job status to processing
      await this.updateJobStatus(jobId, 'processing', {
        startedAt: new Date().toISOString()
      });

      const results = [];
      const errors = [];
      let pagesCrawled = 0;

      // Process each URL
      for (const url of urls) {
        if (pagesCrawled >= maxPages) {
          break;
        }

        try {
          // Update progress
          const progress = {
            currentUrl: url,
            pagesCrawled,
            totalUrls: urls.length,
            percentage: Math.round((pagesCrawled / urls.length) * 100)
          };
          await this.updateJobProgress(jobId, progress);

          // Crawl the page
          const crawlOptions = {
            selectors: dataSelectors || {},
            extractLinks: followLinks,
            extractImages: false
          };

          let pageResult;
          if (maxDepth > 1 && followLinks) {
            pageResult = await crawlerService.crawlWithDepth(url, maxDepth, maxPages - pagesCrawled, crawlOptions);
            results.push(...pageResult.results);
            errors.push(...pageResult.errors);
            pagesCrawled += pageResult.results.length;
          } else {
            pageResult = await crawlerService.crawlPage(url, crawlOptions);
            results.push(pageResult);
            pagesCrawled++;
          }

          // Add results to job
          await this.addJobResults(jobId, Array.isArray(pageResult) ? pageResult : [pageResult]);

          // Update job progress
          await job.progress(Math.round((pagesCrawled / maxPages) * 100));

          // Respect delay
          if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
          }

        } catch (error) {
          const errorInfo = {
            url,
            message: error.message,
            details: error.stack
          };
          errors.push(errorInfo);
          await this.addJobError(jobId, errorInfo);
          logger.logError(error, { context: 'crawl-url', jobId, url });
        }
      }

      // Update final status
      const finalStatus = errors.length === 0 ? 'completed' : 'completed_with_errors';
      await this.updateJobStatus(jobId, finalStatus, {
        completedAt: new Date().toISOString(),
        pagesCrawled,
        totalResults: results.length,
        totalErrors: errors.length
      });

      logger.info('Crawling job completed', {
        jobId,
        pagesCrawled,
        totalResults: results.length,
        totalErrors: errors.length
      });

      return {
        jobId,
        status: finalStatus,
        pagesCrawled,
        totalResults: results.length,
        totalErrors: errors.length
      };

    } catch (error) {
      logger.logError(error, { context: 'process-crawling-job', jobId });
      
      await this.updateJobStatus(jobId, 'failed', {
        failedAt: new Date().toISOString(),
        error: error.message
      });

      throw error;
    }
  }

  async getJobStats() {
    try {
      const waiting = await this.crawlingQueue.getWaiting();
      const active = await this.crawlingQueue.getActive();
      const completed = await this.crawlingQueue.getCompleted();
      const failed = await this.crawlingQueue.getFailed();

      return {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        total: waiting.length + active.length + completed.length + failed.length
      };
    } catch (error) {
      logger.logError(error, { context: 'get-job-stats' });
      return { waiting: 0, active: 0, completed: 0, failed: 0, total: 0 };
    }
  }

  async cleanupOldJobs(daysOld = 7) {
    try {
      const pattern = `crawling_job:*`;
      const keys = await redisService.keys(pattern);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      let cleanedCount = 0;
      for (const key of keys) {
        const metadata = await redisService.getHash(key, 'metadata');
        if (metadata && new Date(metadata.createdAt) < cutoffDate) {
          await redisService.delete(key);
          cleanedCount++;
        }
      }

      logger.info('Cleaned up old jobs', { cleanedCount, daysOld });
      return cleanedCount;
    } catch (error) {
      logger.logError(error, { context: 'cleanup-old-jobs' });
      return 0;
    }
  }
}

// Create singleton instance
const jobService = new JobService();

module.exports = { jobService };
