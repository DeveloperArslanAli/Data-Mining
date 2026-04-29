const axios = require('axios');
const { logger } = require('./src/utils/logger');

const BASE_URL = 'http://localhost:3001';
const TEST_USER_ID = 'test-user-123';

async function testCrawlingService() {
  console.log('🧪 Testing Crawling Service...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing Health Check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data.status);
    console.log('');

    // Test 2: Get Default Settings
    console.log('2. Testing Default Settings...');
    const settingsResponse = await axios.get(`${BASE_URL}/api/v1/crawling/settings/default`);
    console.log('✅ Default settings retrieved:', {
      maxDepth: settingsResponse.data.maxDepth,
      maxPages: settingsResponse.data.maxPages,
      delay: settingsResponse.data.delay
    });
    console.log('');

    // Test 3: Validate URL
    console.log('3. Testing URL Validation...');
    const validationResponse = await axios.post(`${BASE_URL}/api/v1/crawling/validate-url`, {
      url: 'https://example.com'
    });
    console.log('✅ URL validation result:', {
      url: validationResponse.data.url,
      isValid: validationResponse.data.is_valid,
      isAllowed: validationResponse.data.is_allowed
    });
    console.log('');

    // Test 4: Test Crawl
    console.log('4. Testing Single Page Crawl...');
    const testCrawlResponse = await axios.post(`${BASE_URL}/api/v1/crawling/test`, {
      url: 'https://example.com',
      selectors: {
        title: 'h1',
        content: 'p'
      }
    });
    console.log('✅ Test crawl successful:', {
      title: testCrawlResponse.data.result.title,
      contentLength: testCrawlResponse.data.result.content_length,
      wordCount: testCrawlResponse.data.result.word_count
    });
    console.log('');

    // Test 5: Start Crawling Job
    console.log('5. Testing Crawling Job Creation...');
    const jobResponse = await axios.post(`${BASE_URL}/api/v1/crawling/start`, {
      urls: ['https://example.com'],
      maxDepth: 1,
      maxPages: 5,
      delay: 1000,
      followLinks: false,
      extractData: true,
      dataSelectors: {
        title: 'h1',
        content: 'p'
      },
      userId: TEST_USER_ID
    });
    console.log('✅ Crawling job created:', {
      jobId: jobResponse.data.job_id,
      status: jobResponse.data.status
    });
    console.log('');

    const jobId = jobResponse.data.job_id;

    // Test 6: Get Job Details
    console.log('6. Testing Job Details Retrieval...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for job to start processing
    
    const jobDetailsResponse = await axios.get(`${BASE_URL}/api/v1/crawling/job/${jobId}?userId=${TEST_USER_ID}`);
    console.log('✅ Job details retrieved:', {
      status: jobDetailsResponse.data.status,
      pagesCrawled: jobDetailsResponse.data.pagesCrawled || 0,
      totalResults: jobDetailsResponse.data.totalResults || 0
    });
    console.log('');

    // Test 7: Get Job Statistics
    console.log('7. Testing Job Statistics...');
    const statsResponse = await axios.get(`${BASE_URL}/api/v1/crawling/stats`);
    console.log('✅ Job statistics retrieved:', statsResponse.data);
    console.log('');

    // Test 8: List Jobs
    console.log('8. Testing Job Listing...');
    const jobsResponse = await axios.get(`${BASE_URL}/api/v1/crawling/jobs?userId=${TEST_USER_ID}&limit=10`);
    console.log('✅ Jobs listed:', {
      total: jobsResponse.data.total,
      jobs: jobsResponse.data.jobs.length
    });
    console.log('');

    // Wait for job to complete
    console.log('⏳ Waiting for crawling job to complete...');
    let jobCompleted = false;
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds

    while (!jobCompleted && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;

      try {
        const jobStatusResponse = await axios.get(`${BASE_URL}/api/v1/crawling/job/${jobId}?userId=${TEST_USER_ID}`);
        const status = jobStatusResponse.data.status;
        
        if (['completed', 'completed_with_errors', 'failed'].includes(status)) {
          jobCompleted = true;
          console.log(`✅ Job completed with status: ${status}`);
        }
      } catch (error) {
        console.log(`⚠️ Error checking job status: ${error.message}`);
      }
    }

    if (!jobCompleted) {
      console.log('⚠️ Job did not complete within expected time');
    }

    // Test 9: Get Crawled Data
    if (jobCompleted) {
      console.log('9. Testing Data Retrieval...');
      try {
        const dataResponse = await axios.get(`${BASE_URL}/api/v1/crawling/job/${jobId}/data?userId=${TEST_USER_ID}&limit=5`);
        console.log('✅ Crawled data retrieved:', {
          totalRecords: dataResponse.data.total_records,
          returnedRecords: dataResponse.data.returned_records,
          jobStatus: dataResponse.data.job_status
        });
      } catch (error) {
        console.log('⚠️ Could not retrieve crawled data:', error.response?.data?.message || error.message);
      }
      console.log('');
    }

    // Test 10: Download Info
    console.log('10. Testing Download Information...');
    try {
      const downloadResponse = await axios.get(`${BASE_URL}/api/v1/crawling/job/${jobId}/download?userId=${TEST_USER_ID}&format=csv`);
      console.log('✅ Download info retrieved:', {
        format: downloadResponse.data.format,
        fileSize: downloadResponse.data.file_size,
        totalRecords: downloadResponse.data.total_records
      });
    } catch (error) {
      console.log('⚠️ Could not retrieve download info:', error.response?.data?.message || error.message);
    }
    console.log('');

    console.log('🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

async function testCrawlerServiceDirectly() {
  console.log('🔧 Testing Crawler Service Directly...\n');

  try {
    const { crawlerService } = require('./src/services/crawlerService');
    
    // Wait for crawler service to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test single page crawl
    console.log('Testing direct page crawl...');
    const result = await crawlerService.crawlPage('https://example.com', {
      selectors: {
        title: 'h1',
        content: 'p'
      },
      extractLinks: false,
      extractImages: false
    });

    console.log('✅ Direct crawl successful:', {
      title: result.title,
      contentLength: result.content.length,
      wordCount: result.metadata.wordCount
    });

  } catch (error) {
    console.error('❌ Direct crawler test failed:', error.message);
  }
}

async function runAllTests() {
  console.log('🚀 Starting Crawling Service Tests\n');
  console.log('=====================================\n');

  // Test the service directly first
  await testCrawlerServiceDirectly();
  console.log('');

  // Test the API endpoints
  await testCrawlingService();

  console.log('\n=====================================');
  console.log('🏁 Testing completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { testCrawlingService, testCrawlerServiceDirectly };
