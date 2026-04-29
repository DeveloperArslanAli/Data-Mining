const express = require('express');
const Joi = require('joi');
const { logger } = require('../utils/logger');
const { jobService } = require('../services/jobService');
const { crawlerService } = require('../services/crawlerService');
const { redisService } = require('../services/redisService');

const router = express.Router();

// Validation schemas
const startCrawlingSchema = Joi.object({
  urls: Joi.array().items(Joi.string().uri()).min(1).max(10).required(),
  maxDepth: Joi.number().integer().min(1).max(5).default(2),
  maxPages: Joi.number().integer().min(1).max(1000).default(100),
  delay: Joi.number().integer().min(0).max(10000).default(1000),
  followLinks: Joi.boolean().default(true),
  extractData: Joi.boolean().default(true),
  dataSelectors: Joi.object().default({}),
  userId: Joi.string().required()
});

const validateUrlSchema = Joi.object({
  url: Joi.string().uri().required()
});

// Start a crawling job
router.post('/start', async (req, res) => {
  try {
    // Validate request body
    const { error, value } = startCrawlingSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.details.map(d => d.message)
      });
    }

    const {
      urls,
      maxDepth,
      maxPages,
      delay,
      followLinks,
      extractData,
      dataSelectors,
      userId
    } = value;

    // Validate URLs for crawling permissions
    const validationResults = [];
    for (const url of urls) {
      try {
        const isAllowed = await crawlerService.isAllowedToCrawl(url);
        validationResults.push({ url, isAllowed });
      } catch (error) {
        validationResults.push({ url, isAllowed: false, error: error.message });
      }
    }

    const blockedUrls = validationResults.filter(r => !r.isAllowed);
    if (blockedUrls.length > 0) {
      return res.status(400).json({
        error: 'Some URLs are not allowed to be crawled',
        blockedUrls
      });
    }

    // Create crawling job
    const job = await jobService.createJob({
      type: 'crawl',
      urls,
      maxDepth,
      maxPages,
      delay,
      followLinks,
      extractData,
      dataSelectors,
      userId
    });

    logger.info('Crawling job started', {
      jobId: job.id,
      urls,
      userId
    });

    res.status(201).json({
      job_id: job.id,
      status: job.status,
      message: 'Crawling job started successfully',
      urls,
      maxDepth,
      maxPages,
      delay,
      followLinks,
      extractData,
      validationResults
    });

  } catch (error) {
    logger.logError(error, { context: 'start-crawling-job' });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to start crawling job'
    });
  }
});

// Get crawling jobs
router.get('/jobs', async (req, res) => {
  try {
    const { userId } = req.query;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    if (!userId) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'userId is required'
      });
    }

    const jobs = await jobService.listJobs(userId, limit, offset);

    res.json(jobs);

  } catch (error) {
    logger.logError(error, { context: 'get-crawling-jobs' });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve crawling jobs'
    });
  }
});

// Get specific crawling job
router.get('/job/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'userId is required'
      });
    }

    const job = await jobService.getJob(jobId);

    if (!job) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Crawling job not found'
      });
    }

    // Check if user owns this job
    if (job.userId !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied to this crawling job'
      });
    }

    res.json(job);

  } catch (error) {
    logger.logError(error, { context: 'get-crawling-job', jobId: req.params.jobId });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve crawling job'
    });
  }
});

// Cancel a crawling job
router.post('/job/:jobId/cancel', async (req, res) => {
  try {
    const { jobId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'userId is required'
      });
    }

    const job = await jobService.getJob(jobId);

    if (!job) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Crawling job not found'
      });
    }

    // Check if user owns this job
    if (job.userId !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied to this crawling job'
      });
    }

    const cancelled = await jobService.cancelJob(jobId);

    if (cancelled) {
      res.json({
        job_id: jobId,
        status: 'cancelled',
        message: 'Crawling job cancelled successfully'
      });
    } else {
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to cancel crawling job'
      });
    }

  } catch (error) {
    logger.logError(error, { context: 'cancel-crawling-job', jobId: req.params.jobId });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to cancel crawling job'
    });
  }
});

// Get crawled data from a job
router.get('/job/:jobId/data', async (req, res) => {
  try {
    const { jobId } = req.params;
    const { userId, format = 'json', limit = 100 } = req.query;

    if (!userId) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'userId is required'
      });
    }

    const job = await jobService.getJob(jobId);

    if (!job) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Crawling job not found'
      });
    }

    // Check if user owns this job
    if (job.userId !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied to this crawling job'
      });
    }

    // Check if job is completed
    if (!['completed', 'completed_with_errors'].includes(job.status)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Crawling job is not completed yet'
      });
    }

    const results = job.results || [];
    const limitedResults = results.slice(0, parseInt(limit));

    res.json({
      job_id: jobId,
      format,
      data: limitedResults,
      total_records: results.length,
      returned_records: limitedResults.length,
      job_status: job.status,
      pages_crawled: job.pagesCrawled || 0,
      total_errors: job.totalErrors || 0
    });

  } catch (error) {
    logger.logError(error, { context: 'get-crawled-data', jobId: req.params.jobId });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve crawled data'
    });
  }
});

// Download crawled data
router.get('/job/:jobId/download', async (req, res) => {
  try {
    const { jobId } = req.params;
    const { userId, format = 'csv' } = req.query;

    if (!userId) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'userId is required'
      });
    }

    const job = await jobService.getJob(jobId);

    if (!job) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Crawling job not found'
      });
    }

    // Check if user owns this job
    if (job.userId !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied to this crawling job'
      });
    }

    // Check if job is completed
    if (!['completed', 'completed_with_errors'].includes(job.status)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Crawling job is not completed yet'
      });
    }

    // Generate download URL (in a real implementation, this would create a file)
    const downloadInfo = {
      job_id: jobId,
      format,
      file_url: `/api/v1/crawling/job/${jobId}/file`,
      file_size: 1024 * 50, // Mock size
      download_expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      total_records: job.results?.length || 0
    };

    res.json(downloadInfo);

  } catch (error) {
    logger.logError(error, { context: 'download-crawled-data', jobId: req.params.jobId });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get download information'
    });
  }
});

// Get default crawling settings
router.get('/settings/default', (req, res) => {
  res.json({
    maxDepth: 2,
    maxPages: 100,
    delay: 1000,
    followLinks: true,
    extractData: true,
    userAgent: process.env.CRAWLER_USER_AGENT || 'DataMiningBot/1.0',
    timeout: parseInt(process.env.CRAWLER_TIMEOUT) || 30000,
    retryAttempts: parseInt(process.env.CRAWLER_MAX_RETRIES) || 3,
    dataSelectors: {
      title: 'h1, h2, h3',
      content: 'p, div.content, article',
      links: 'a[href]',
      images: 'img[src]'
    }
  });
});

// Validate URL for crawling
router.post('/validate-url', async (req, res) => {
  try {
    const { error, value } = validateUrlSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.details.map(d => d.message)
      });
    }

    const { url } = value;

    // Check if URL is valid
    const isValid = /^https?:\/\/.+/.test(url);

    if (!isValid) {
      return res.json({
        url,
        is_valid: false,
        message: 'URL format is invalid'
      });
    }

    // Check robots.txt
    const isAllowed = await crawlerService.isAllowedToCrawl(url);
    const crawlDelay = await crawlerService.getCrawlDelay(url);

    res.json({
      url,
      is_valid: true,
      is_allowed: isAllowed,
      crawl_delay: crawlDelay,
      message: isAllowed ? 'URL is valid and allowed for crawling' : 'URL is valid but not allowed for crawling'
    });

  } catch (error) {
    logger.logError(error, { context: 'validate-url', url: req.body.url });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to validate URL'
    });
  }
});

// Get job statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await jobService.getJobStats();
    res.json(stats);
  } catch (error) {
    logger.logError(error, { context: 'get-job-stats' });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get job statistics'
    });
  }
});

// Cleanup old jobs
router.post('/cleanup', async (req, res) => {
  try {
    const { daysOld = 7 } = req.body;
    const cleanedCount = await jobService.cleanupOldJobs(daysOld);

    res.json({
      message: 'Cleanup completed',
      cleaned_count: cleanedCount,
      days_old: daysOld
    });
  } catch (error) {
    logger.logError(error, { context: 'cleanup-old-jobs' });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to cleanup old jobs'
    });
  }
});

// Test crawling endpoint
router.post('/test', async (req, res) => {
  try {
    const { url, selectors = {} } = req.body;

    if (!url) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'URL is required'
      });
    }

    // Validate URL
    const isValid = /^https?:\/\/.+/.test(url);
    if (!isValid) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid URL format'
      });
    }

    // Test crawl the URL
    const result = await crawlerService.crawlPage(url, {
      selectors,
      extractLinks: false,
      extractImages: false
    });

    res.json({
      success: true,
      url,
      result: {
        title: result.title,
        description: result.description,
        content_length: result.content.length,
        word_count: result.metadata.wordCount,
        extracted_data: result.extractedData
      }
    });

  } catch (error) {
    logger.logError(error, { context: 'test-crawl', url: req.body.url });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to test crawl',
      details: error.message
    });
  }
});

module.exports = router;
