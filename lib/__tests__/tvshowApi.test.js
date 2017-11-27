const assert = require('assert');
const { redisClient, db } = require('../config');
const server = require('../server');
const { requestTimeHist, numRequestsCounter } = require('../omdbsdk');
const request = require('supertest');

describe('api', () => {
  beforeEach(() => {
    requestTimeHist.reset();
    numRequestsCounter.reset();
  });

  it('should search for south park', async () => {
    return request(server)
      .get('/search')
      .query({
        s: 'south park',
        type: 'series',
        r: 'json'
      })
      .expect(200)
      .then(response => {
        assert(response.body.Response === 'True');
        assert.equal(response.body.Search.length, 3);
      });
  });

  it('/get/:id', async () => {
    const imdbID = 'tt0121955';
    return request(server)
      .get(`/get/${imdbID}`)
      .expect(200)
      .then(response => {
        assert.equal(response.body.Type, 'series');
        assert(response.body.Response === 'True');
        assert.equal(response.body.imdbID, imdbID);
      });
  });

  it('should check omdb interceptor metrics', async () => {
    const getValue = () => numRequestsCounter.get().values[0].value;
    assert.equal(getValue(), 0);
    await new Promise(resolve => {
      redisClient.del('south', resolve);
    });
    return request(server)
      .get('/search')
      .query({
        s: 'south'
      })
      .expect(200)
      .then(() => {
        assert.equal(getValue(), 1);
        const values = requestTimeHist.get().values;
        assert.equal(values[values.length - 1].value, 1);
      });
  });

  it('should get popular shows', async () => {
    return request(server)
      .get('/popular')
      .expect(200)
      .then(() => {
        assert(true);
      });
  });

  afterAll(async () => {
    await redisClient.quit();
    await db.end();
  });
});
