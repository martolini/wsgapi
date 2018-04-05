if (process.env.NODE_ENV !== 'production') {
  require('dotenv').load();
}
const redis = require('redis');
const Promise = require('bluebird');
Promise.promisifyAll(redis.RedisClient.prototype);

const redisClient = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT
});

redisClient.on('error', err => {
  console.error(err);
});

module.exports = {
  redisClient
};
