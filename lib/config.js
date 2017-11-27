if (process.env.NODE_ENV !== 'production') {
  require('dotenv').load();
}
const redis = require('redis');
const Promise = require('bluebird');
const { Pool } = require('pg');
Promise.promisifyAll(redis.RedisClient.prototype);

const redisClient = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT
});

redisClient.on('error', err => {
  console.error(err);
});

const pool = new Pool();

pool.on('error', (err, client) => {
  console.error(err, client);
});

module.exports = {
  redisClient,
  db: pool
};
