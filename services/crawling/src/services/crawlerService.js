const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const robotsParser = require('robots-parser');
const axios = require('axios');
const URL = require('url-parse');
const sanitizeHtml = require('sanitize-html');
const { logger } = require('../utils/logger');
const { redisService } = require('./redisService');

class CrawlerService {
  constructor() {
    this.browser = null;
    this.robotsCache = new Map();
    this.rateLimitCache = new Map();
    this.userAgent = process.env.CRAWLER_USER_AGENT || 'DataMiningBot/1.0 (+https://datamining-platform.com/bot)';
    this.defaultDelay = parseInt(process.env.CRAWLER_DEFAULT_DELAY) || 1000;
    this.maxRetries = parseInt(process.env.CRAWLER_MAX_RETRIES) || 3;
    this.timeout = parseInt(process.env.CRAWLER_TIMEOUT) || 30000;
  }

  async initialize() {
    try {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-features=TranslateUI',
          '--disable-ipc-flooding-protection'
        ]
      });

      logger.info('Puppeteer browser initialized successfully');
    } catch (error) {
      logger.logError(error, { context: 'crawler-initialization' });
      throw error;
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      logger.info('Puppeteer browser closed');
    }
  }

  async checkRobotsTxt(url) {
    try {
      const parsedUrl = new URL(url);
      const robotsUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}/robots.txt`;
      
      // Check cache first
      if (this.robotsCache.has(parsedUrl.hostname)) {
        return this.robotsCache.get(parsedUrl.hostname);
      }

      const response = await axios.get(robotsUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': this.userAgent
        }
      });

      const robots = robotsParser(robotsUrl, response.data);
      this.robotsCache.set(parsedUrl.hostname, robots);
      
      return robots;
    } catch (error) {
      logger.logError(error, { context: 'robots-check', url });
      return null;
    }
  }

  async isAllowedToCrawl(url) {
    try {
      const robots = await this.checkRobotsTxt(url);
      if (!robots) {
        return true; // If no robots.txt, assume allowed
      }

      return robots.isAllowed(url, this.userAgent);
    } catch (error) {
      logger.logError(error, { context: 'crawl-permission-check', url });
      return false;
    }
  }

  async getCrawlDelay(url) {
    try {
      const robots = await this.checkRobotsTxt(url);
      if (!robots) {
        return this.defaultDelay;
      }

      const parsedUrl = new URL(url);
      const delay = robots.getCrawlDelay(this.userAgent);
      return delay ? delay * 1000 : this.defaultDelay;
    } catch (error) {
      logger.logError(error, { context: 'crawl-delay-check', url });
      return this.defaultDelay;
    }
  }

  async checkRateLimit(url) {
    try {
      const parsedUrl = new URL(url);
      const hostname = parsedUrl.hostname;
      const now = Date.now();
      const windowMs = 60000; // 1 minute window
      
      const key = `rate_limit:${hostname}`;
      const requests = await redisService.get(key) || [];
      
      // Remove old requests outside the window
      const validRequests = requests.filter(timestamp => now - timestamp < windowMs);
      
      // Check if we're within rate limit (max 10 requests per minute per host)
      const maxRequests = 10;
      if (validRequests.length >= maxRequests) {
        const oldestRequest = Math.min(...validRequests);
        const waitTime = windowMs - (now - oldestRequest);
        throw new Error(`Rate limit exceeded for ${hostname}. Wait ${Math.ceil(waitTime / 1000)} seconds.`);
      }
      
      // Add current request
      validRequests.push(now);
      await redisService.set(key, validRequests, 120); // Cache for 2 minutes
      
      return true;
    } catch (error) {
      logger.logError(error, { context: 'rate-limit-check', url });
      throw error;
    }
  }

  async crawlPage(url, options = {}) {
    const {
      selectors = {},
      extractLinks = true,
      extractImages = false,
      waitForSelector = null,
      waitForTimeout = 5000,
      screenshot = false,
      pdf = false
    } = options;

    let page = null;
    let retries = 0;

    try {
      // Check if allowed to crawl
      const isAllowed = await this.isAllowedToCrawl(url);
      if (!isAllowed) {
        throw new Error(`Crawling not allowed for ${url} according to robots.txt`);
      }

      // Check rate limit
      await this.checkRateLimit(url);

      // Get crawl delay
      const delay = await this.getCrawlDelay(url);
      await this.sleep(delay);

      // Create new page
      page = await this.browser.newPage();
      
      // Set user agent and viewport
      await page.setUserAgent(this.userAgent);
      await page.setViewport({ width: 1920, height: 1080 });

      // Set request interception for better performance
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        const resourceType = req.resourceType();
        if (['stylesheet', 'font', 'image', 'media'].includes(resourceType)) {
          req.abort();
        } else {
          req.continue();
        }
      });

      // Navigate to page
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: this.timeout
      });

      // Wait for specific selector if provided
      if (waitForSelector) {
        await page.waitForSelector(waitForSelector, { timeout: waitForTimeout });
      }

      // Get page content
      const html = await page.content();
      const $ = cheerio.load(html);

      // Extract basic page info
      const pageData = {
        url,
        title: $('title').text().trim(),
        description: $('meta[name="description"]').attr('content') || '',
        keywords: $('meta[name="keywords"]').attr('content') || '',
        language: $('html').attr('lang') || 'en',
        crawledAt: new Date().toISOString(),
        content: this.extractTextContent($),
        extractedData: {}
      };

      // Extract data based on selectors
      if (Object.keys(selectors).length > 0) {
        pageData.extractedData = this.extractDataWithSelectors($, selectors);
      }

      // Extract links if requested
      if (extractLinks) {
        pageData.links = this.extractLinks($, url);
      }

      // Extract images if requested
      if (extractImages) {
        pageData.images = this.extractImages($, url);
      }

      // Take screenshot if requested
      if (screenshot) {
        pageData.screenshot = await page.screenshot({
          type: 'png',
          fullPage: true
        });
      }

      // Generate PDF if requested
      if (pdf) {
        pageData.pdf = await page.pdf({
          format: 'A4',
          printBackground: true
        });
      }

      // Get page metadata
      pageData.metadata = {
        statusCode: 200,
        loadTime: Date.now(),
        contentLength: html.length,
        wordCount: pageData.content.split(/\s+/).length
      };

      logger.info('Page crawled successfully', {
        url,
        title: pageData.title,
        contentLength: pageData.metadata.contentLength,
        wordCount: pageData.metadata.wordCount
      });

      return pageData;

    } catch (error) {
      retries++;
      logger.logError(error, { context: 'page-crawl', url, retry: retries });

      if (retries < this.maxRetries) {
        logger.info(`Retrying crawl for ${url} (attempt ${retries + 1}/${this.maxRetries})`);
        await this.sleep(2000 * retries); // Exponential backoff
        return this.crawlPage(url, options);
      }

      throw error;
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  extractTextContent($) {
    // Remove script and style elements
    $('script, style').remove();
    
    // Get text content and clean it
    let text = $('body').text();
    text = text.replace(/\s+/g, ' ').trim();
    
    return sanitizeHtml(text, {
      allowedTags: [],
      allowedAttributes: {}
    });
  }

  extractDataWithSelectors($, selectors) {
    const extractedData = {};

    for (const [key, selector] of Object.entries(selectors)) {
      try {
        const elements = $(selector);
        if (elements.length === 1) {
          extractedData[key] = elements.text().trim();
        } else if (elements.length > 1) {
          extractedData[key] = elements.map((i, el) => $(el).text().trim()).get();
        } else {
          extractedData[key] = null;
        }
      } catch (error) {
        logger.logError(error, { context: 'selector-extraction', selector, key });
        extractedData[key] = null;
      }
    }

    return extractedData;
  }

  extractLinks($, baseUrl) {
    const links = [];
    const baseUrlObj = new URL(baseUrl);

    $('a[href]').each((i, element) => {
      const href = $(element).attr('href');
      const text = $(element).text().trim();
      
      if (href && text) {
        try {
          const absoluteUrl = new URL(href, baseUrl).href;
          const urlObj = new URL(absoluteUrl);
          
          // Only include HTTP/HTTPS links
          if (['http:', 'https:'].includes(urlObj.protocol)) {
            links.push({
              url: absoluteUrl,
              text: text,
              isInternal: urlObj.hostname === baseUrlObj.hostname,
              isExternal: urlObj.hostname !== baseUrlObj.hostname
            });
          }
        } catch (error) {
          // Skip invalid URLs
        }
      }
    });

    return links;
  }

  extractImages($, baseUrl) {
    const images = [];
    const baseUrlObj = new URL(baseUrl);

    $('img[src]').each((i, element) => {
      const src = $(element).attr('src');
      const alt = $(element).attr('alt') || '';
      const title = $(element).attr('title') || '';
      
      if (src) {
        try {
          const absoluteUrl = new URL(src, baseUrl).href;
          const urlObj = new URL(absoluteUrl);
          
          // Only include HTTP/HTTPS images
          if (['http:', 'https:'].includes(urlObj.protocol)) {
            images.push({
              url: absoluteUrl,
              alt: alt,
              title: title,
              isInternal: urlObj.hostname === baseUrlObj.hostname,
              isExternal: urlObj.hostname !== baseUrlObj.hostname
            });
          }
        } catch (error) {
          // Skip invalid URLs
        }
      }
    });

    return images;
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async crawlMultiplePages(urls, options = {}) {
    const results = [];
    const errors = [];

    for (const url of urls) {
      try {
        const result = await this.crawlPage(url, options);
        results.push(result);
      } catch (error) {
        errors.push({ url, error: error.message });
        logger.logError(error, { context: 'multi-page-crawl', url });
      }
    }

    return {
      results,
      errors,
      totalUrls: urls.length,
      successfulCrawls: results.length,
      failedCrawls: errors.length
    };
  }

  async crawlWithDepth(startUrl, maxDepth = 2, maxPages = 100, options = {}) {
    const visited = new Set();
    const queue = [{ url: startUrl, depth: 0 }];
    const results = [];
    const errors = [];

    while (queue.length > 0 && results.length < maxPages) {
      const { url, depth } = queue.shift();

      if (visited.has(url) || depth > maxDepth) {
        continue;
      }

      visited.add(url);

      try {
        const result = await this.crawlPage(url, options);
        results.push({ ...result, depth });

        // Add links to queue for next depth
        if (depth < maxDepth && result.links) {
          const internalLinks = result.links
            .filter(link => link.isInternal && !visited.has(link.url))
            .slice(0, 10); // Limit links per page

          for (const link of internalLinks) {
            queue.push({ url: link.url, depth: depth + 1 });
          }
        }

      } catch (error) {
        errors.push({ url, depth, error: error.message });
        logger.logError(error, { context: 'depth-crawl', url, depth });
      }
    }

    return {
      results,
      errors,
      totalPages: results.length,
      maxDepth,
      startUrl
    };
  }
}

// Create singleton instance
const crawlerService = new CrawlerService();

// Initialize on module load
crawlerService.initialize().catch(error => {
  logger.logError(error, { context: 'crawler-service-initialization' });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await crawlerService.close();
});

process.on('SIGINT', async () => {
  await crawlerService.close();
});

module.exports = { crawlerService };
