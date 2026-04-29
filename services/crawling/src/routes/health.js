const express = require('express');
const { logger } = require('../utils/logger');
const { checkRedisConnection } = require('../services/redisService');

const router = express.Router();

// Basic health check
router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'crawling-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Detailed health check
router.get('/detailed', async (req, res) => {
  try {
    const healthStatus = {
      status: 'healthy',
      service: 'crawling-service',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        redis: 'unknown',
        puppeteer: 'unknown'
      }
    };

    // Check Redis connection
    try {
      await checkRedisConnection();
      healthStatus.checks.redis = 'healthy';
    } catch (error) {
      healthStatus.checks.redis = 'unhealthy';
      healthStatus.status = 'degraded';
      logger.logError(error, { context: 'health-check-redis' });
    }

    // Check Puppeteer availability
    try {
      const puppeteer = require('puppeteer');
      healthStatus.checks.puppeteer = 'healthy';
    } catch (error) {
      healthStatus.checks.puppeteer = 'unhealthy';
      healthStatus.status = 'degraded';
      logger.logError(error, { context: 'health-check-puppeteer' });
    }

    // Determine overall status
    const unhealthyChecks = Object.values(healthStatus.checks).filter(check => check === 'unhealthy');
    if (unhealthyChecks.length > 0) {
      healthStatus.status = 'unhealthy';
    }

    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthStatus);

  } catch (error) {
    logger.logError(error, { context: 'health-check' });
    res.status(503).json({
      status: 'unhealthy',
      service: 'crawling-service',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Readiness check
router.get('/ready', async (req, res) => {
  try {
    // Check if service is ready to handle requests
    const checks = {
      redis: false,
      puppeteer: false
    };

    // Check Redis
    try {
      await checkRedisConnection();
      checks.redis = true;
    } catch (error) {
      logger.logError(error, { context: 'readiness-check-redis' });
    }

    // Check Puppeteer
    try {
      const puppeteer = require('puppeteer');
      checks.puppeteer = true;
    } catch (error) {
      logger.logError(error, { context: 'readiness-check-puppeteer' });
    }

    const isReady = Object.values(checks).every(check => check === true);
    const statusCode = isReady ? 200 : 503;

    res.status(statusCode).json({
      ready: isReady,
      checks,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.logError(error, { context: 'readiness-check' });
    res.status(503).json({
      ready: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
