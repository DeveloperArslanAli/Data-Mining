# Web Crawling Service

The Web Crawling Service is a dedicated microservice for web scraping and data extraction using Puppeteer and Cheerio. It provides comprehensive web crawling capabilities with ethical scraping practices, rate limiting, and job management.

## Features

### 🕷️ Web Crawling
- **Puppeteer-based crawling** with headless browser automation
- **Cheerio HTML parsing** for efficient data extraction
- **Configurable selectors** for targeted data extraction
- **Multi-page crawling** with depth control
- **Link following** with internal/external link detection
- **Image extraction** with metadata

### 🛡️ Ethical Scraping
- **Robots.txt compliance** with automatic parsing and respect
- **Rate limiting** per domain with configurable delays
- **User agent management** with proper identification
- **Crawl delay enforcement** based on robots.txt directives
- **Request throttling** to prevent server overload

### 📊 Job Management
- **Background job processing** with Bull queue
- **Real-time progress tracking** with Redis storage
- **Job status management** (pending, processing, completed, failed)
- **Job cancellation** and cleanup
- **Comprehensive job statistics**

### 🔧 Advanced Features
- **Data validation** with Joi schemas
- **Error handling** with retry logic and exponential backoff
- **Structured logging** with Winston
- **Health monitoring** with detailed status checks
- **Performance optimization** with request interception

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Express API   │    │   Bull Queue    │    │   Redis Cache   │
│                 │    │                 │    │                 │
│ - Job Creation  │◄──►│ - Job Processing│◄──►│ - Job Storage   │
│ - Status Query  │    │ - Progress Track│    │ - Rate Limiting │
│ - Data Retrieval│    │ - Error Handling│    │ - Caching       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Puppeteer      │    │   Cheerio       │    │   Winston       │
│                 │    │                 │    │                 │
│ - Browser Control│    │ - HTML Parsing  │    │ - Logging       │
│ - Page Navigation│    │ - Data Extraction│   │ - Error Tracking│
│ - Screenshots   │    │ - Link Detection │   │ - Performance   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## API Endpoints

### Job Management

#### Start Crawling Job
```http
POST /api/v1/crawling/start
```

**Request Body:**
```json
{
  "urls": ["https://example.com", "https://example.org"],
  "maxDepth": 2,
  "maxPages": 100,
  "delay": 1000,
  "followLinks": true,
  "extractData": true,
  "dataSelectors": {
    "title": "h1, h2, h3",
    "content": "p, div.content",
    "price": ".price"
  },
  "userId": "user123"
}
```

**Response:**
```json
{
  "job_id": "uuid-123",
  "status": "pending",
  "message": "Crawling job started successfully",
  "urls": ["https://example.com", "https://example.org"],
  "maxDepth": 2,
  "maxPages": 100,
  "validationResults": [...]
}
```

#### Get Crawling Jobs
```http
GET /api/v1/crawling/jobs?userId=user123&limit=20&offset=0
```

#### Get Job Details
```http
GET /api/v1/crawling/job/{jobId}?userId=user123
```

#### Cancel Job
```http
POST /api/v1/crawling/job/{jobId}/cancel
```

### Data Retrieval

#### Get Crawled Data
```http
GET /api/v1/crawling/job/{jobId}/data?userId=user123&format=json&limit=100
```

#### Download Data
```http
GET /api/v1/crawling/job/{jobId}/download?userId=user123&format=csv
```

### Configuration

#### Get Default Settings
```http
GET /api/v1/crawling/settings/default
```

#### Validate URL
```http
POST /api/v1/crawling/validate-url
```

**Request Body:**
```json
{
  "url": "https://example.com"
}
```

### Monitoring

#### Get Job Statistics
```http
GET /api/v1/crawling/stats
```

#### Health Check
```http
GET /health
GET /health/detailed
GET /health/ready
```

## Configuration

### Environment Variables

```bash
# Service Configuration
NODE_ENV=development
PORT=3001
LOG_LEVEL=info

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Crawler Configuration
CRAWLER_USER_AGENT=DataMiningBot/1.0 (+https://datamining-platform.com/bot)
CRAWLER_DEFAULT_DELAY=1000
CRAWLER_MAX_RETRIES=3
CRAWLER_TIMEOUT=30000

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3050,http://localhost:8090
```

### Default Settings

```javascript
{
  maxDepth: 2,
  maxPages: 100,
  delay: 1000,
  followLinks: true,
  extractData: true,
  userAgent: 'DataMiningBot/1.0',
  timeout: 30000,
  retryAttempts: 3,
  dataSelectors: {
    title: 'h1, h2, h3',
    content: 'p, div.content, article',
    links: 'a[href]',
    images: 'img[src]'
  }
}
```

## Usage Examples

### Basic Crawling

```javascript
const axios = require('axios');

// Start a crawling job
const response = await axios.post('http://localhost:3001/api/v1/crawling/start', {
  urls: ['https://example.com'],
  maxDepth: 1,
  maxPages: 10,
  delay: 1000,
  followLinks: false,
  extractData: true,
  dataSelectors: {
    title: 'h1',
    content: 'p',
    price: '.price'
  },
  userId: 'user123'
});

const jobId = response.data.job_id;

// Check job status
const jobStatus = await axios.get(`http://localhost:3001/api/v1/crawling/job/${jobId}?userId=user123`);

// Get crawled data
const data = await axios.get(`http://localhost:3001/api/v1/crawling/job/${jobId}/data?userId=user123`);
```

### Advanced Crawling with Depth

```javascript
// Crawl with depth and link following
const response = await axios.post('http://localhost:3001/api/v1/crawling/start', {
  urls: ['https://example.com'],
  maxDepth: 3,
  maxPages: 50,
  delay: 2000,
  followLinks: true,
  extractData: true,
  dataSelectors: {
    title: 'h1, h2, h3',
    content: 'p, div.content',
    links: 'a[href]',
    images: 'img[src]'
  },
  userId: 'user123'
});
```

### URL Validation

```javascript
// Validate URL before crawling
const validation = await axios.post('http://localhost:3001/api/v1/crawling/validate-url', {
  url: 'https://example.com'
});

if (validation.data.is_valid && validation.data.is_allowed) {
  // Proceed with crawling
  console.log(`Crawl delay: ${validation.data.crawl_delay}ms`);
}
```

## Development

### Prerequisites

- Node.js 18+
- Redis 6+
- Docker (optional)

### Local Development

```bash
# Install dependencies
npm install

# Start Redis (if not running)
redis-server

# Start development server
npm run dev

# Run tests
npm test

# Run linting
npm run lint
```

### Docker Development

```bash
# Build and run with Docker Compose
docker-compose up crawling-service

# Or build manually
docker build -f Dockerfile.dev -t crawling-service:dev .
docker run -p 3001:3001 crawling-service:dev
```

### Testing

```bash
# Run comprehensive tests
node test_crawling_service.js

# Test specific functionality
npm run test:watch
```

## Performance Optimization

### Rate Limiting
- Automatic rate limiting per domain (10 requests/minute)
- Configurable delays based on robots.txt
- Redis-based request tracking

### Resource Management
- Request interception to block unnecessary resources
- Automatic browser page cleanup
- Memory-efficient HTML parsing

### Caching
- Robots.txt caching per domain
- Job metadata caching in Redis
- Rate limit data caching

## Error Handling

### Retry Logic
- Exponential backoff for failed requests
- Configurable retry attempts (default: 3)
- Graceful degradation for partial failures

### Error Types
- **ValidationError**: Invalid request parameters
- **RateLimitError**: Rate limit exceeded
- **RobotsError**: Crawling not allowed
- **NetworkError**: Connection issues
- **TimeoutError**: Request timeout

### Error Response Format
```json
{
  "error": "Error Type",
  "message": "Human readable message",
  "details": "Additional error details",
  "timestamp": "2024-01-01T10:00:00Z"
}
```

## Monitoring and Logging

### Health Checks
- Service health status
- Redis connection status
- Puppeteer availability
- Detailed health metrics

### Logging
- Structured JSON logging
- Request/response logging
- Error tracking with context
- Performance metrics

### Metrics
- Job completion rates
- Processing times
- Error rates
- Resource usage

## Security

### Input Validation
- URL validation and sanitization
- Request parameter validation
- SQL injection prevention
- XSS protection

### Access Control
- User-based job isolation
- Job ownership verification
- Rate limiting per user
- CORS configuration

### Ethical Scraping
- Robots.txt compliance
- Respectful crawling delays
- Proper user agent identification
- Server load consideration

## Troubleshooting

### Common Issues

1. **Puppeteer Launch Failures**
   - Ensure system dependencies are installed
   - Check Docker configuration for headless mode
   - Verify sufficient memory allocation

2. **Redis Connection Issues**
   - Verify Redis server is running
   - Check connection URL configuration
   - Ensure network connectivity

3. **Rate Limiting**
   - Check robots.txt for crawl delays
   - Verify rate limit configuration
   - Monitor request frequency

4. **Job Processing Failures**
   - Check job queue status
   - Verify Redis storage
   - Review error logs

### Debug Mode

```bash
# Enable debug logging
LOG_LEVEL=debug npm run dev

# Check service health
curl http://localhost:3001/health/detailed

# Monitor Redis
redis-cli monitor
```

## Contributing

1. Follow the existing code style
2. Add tests for new features
3. Update documentation
4. Ensure ethical scraping practices
5. Test with various websites

## License

MIT License - see LICENSE file for details.
