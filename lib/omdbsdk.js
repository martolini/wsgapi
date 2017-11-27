'use strict';
const axios = require('axios');
const { range } = require('lodash');
const Promise = require('bluebird');
const prom = require('prom-client');

const instance = axios.create({
  baseURL: `http://www.omdbapi.com/`,
  timeout: 2000
});

instance.defaults.params = {
  apiKey: process.env.OMDB_API_KEY,
  r: 'json',
  plot: 'short',
  type: 'series'
};

const numRequestsCounter = new prom.Counter({
  name: 'omdb_requests_count',
  help: 'omdb_requests_count'
});

const requestTimeHist = new prom.Histogram({
  name: 'omdb_request_duration_seconds',
  help: 'duration histogram of omdb requests',
  buckets: [0.003, 0.03, 0.1, 0.3, 1.5, 10]
});

instance.interceptors.request.use(config => {
  config.endTimer = requestTimeHist.startTimer();
  return config;
});

instance.interceptors.response.use(response => {
  numRequestsCounter.inc();
  response.config.endTimer();
  return response;
});

function configure(opts) {
  instance.defaults.params = {
    ...instance.defaults.params,
    ...opts
  };
  return instance.defaults.params;
}

async function search(params) {
  const result = await instance({
    method: 'get',
    params
  });
  return result.data;
}

async function getEpisodes(imdbID) {
  const result = await instance({
    method: 'get',
    params: {
      i: imdbID
    }
  });
  const show = result.data;
  const nSeasons = show.totalSeasons;
  const seasons = await Promise.map(range(nSeasons), async (s, i) => {
    const res = await instance({
      method: 'get',
      params: {
        i: imdbID,
        Season: i + 1
      }
    });
    return res.data.Episodes;
  });
  const episodes = [];
  seasons.forEach((season, i) => {
    season.forEach((episode, j) => {
      episodes.push({
        ...episode,
        imdbRating: Number(episode.imdbRating),
        season: i + 1,
        episode: j + 1
      });
    });
  });
  return {
    ...show,
    episodes
  };
}

module.exports = {
  search,
  getEpisodes,
  configure,
  requestTimeHist,
  numRequestsCounter
};
