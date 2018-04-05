'use strict';
const express = require('express');
const cors = require('cors');
const omdb = require('./omdbsdk');
const promBundle = require('express-prom-bundle');
const { redisClient } = require('./config');
const bundle = promBundle();

bundle.promClient.register.registerMetric(omdb.numRequestsCounter);
bundle.promClient.register.registerMetric(omdb.requestTimeHist);

const CACHE_TTL = 60 * 60 * 24 * 30;

// Create subset of valid params so people can't spam a random param to escape cache
const getCacheKey = req => {
  if (Object.keys(req.query).length > 0) {
    return req.query.s;
  } else if (Object.keys(req.params).length > 0) {
    return req.params.id;
  }
  return null;
};

const encodeBody = body => JSON.stringify(body);

const decodeBody = body => JSON.parse(body);

const cacheCounter = new bundle.promClient.Counter({
  name: 'cache_hit',
  help: 'cache_hit'
});

const cacheMissCounter = new bundle.promClient.Counter({
  name: 'cache_miss',
  help: 'cache_miss'
});

const redisMiddleware = async (req, res, next) => {
  if (!redisClient.connected) {
    return next();
  }
  const key = getCacheKey(req);
  if (!key) {
    return next();
  }
  const result = await redisClient.getAsync(key);
  if (result) {
    req.cachedResult = decodeBody(result);
    cacheCounter.inc();
  } else {
    cacheMissCounter.inc();
  }
  const json = res.json.bind(res);
  res.json = async body => {
    var ret = json(body);
    await redisClient.set(getCacheKey(req), encodeBody(body), 'EX', CACHE_TTL);
    return ret;
  };
  return next();
};

const app = express();

app.set('port', process.env.port || 8001);

app.use(bundle);
app.use(cors());
app.use(express.json());

app.get('/search', redisMiddleware, async (req, res) => {
  if (!req.query.s) {
    return res.status(400).send('Search for something, please.');
  }
  if (req.cachedResult) {
    return res.json(req.cachedResult);
  }
  try {
    const result = await omdb.search(req.query);
    return res.json(result);
  } catch (ex) {
    console.error(ex);
    return res.status(500).send('Error');
  }
});

app.get('/get/:id', redisMiddleware, async (req, res) => {
  const { id } = req.params;
  if (id === undefined) {
    return res.status(400).send('Specify a query');
  }
  if (req.cachedResult) {
    return res.json(req.cachedResult);
  }
  try {
    const result = await omdb.getEpisodes(id);
    return res.json(result);
  } catch (ex) {
    console.error(ex);
    return res.status(500).send('Error');
  }
});

app.get('/health', async (req, res) => {
  if (redisClient.connected) {
    return res.send('OK');
  }
  return res.sendStatus(500);
});

app.get('/', (req, res) => res.sendStatus(200));

module.exports = app;
