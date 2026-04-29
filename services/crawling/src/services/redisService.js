const redis = require('redis');
const { promisify } = require('util');

const client = redis.createClient({
  host: 'redis', // Updated to use Docker container name
  port: 6379,
  retry_strategy: (options) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      return new Error('The server refused the connection');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      return new Error('Retry time exhausted');
    }
    if (options.attempt > 10) {
      return undefined;
    }
    return Math.min(options.attempt * 100, 5000);
  }
});

// Promisify Redis commands
const getAsync = promisify(client.get).bind(client);
const setAsync = promisify(client.set).bind(client);

// Error handling
client.on('error', (err) => {
  console.error('Redis error:', err);
});

module.exports = {
  client,
  getAsync,
  setAsync
};
