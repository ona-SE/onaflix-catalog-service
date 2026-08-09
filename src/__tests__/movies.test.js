const request = require('supertest');
const http = require('http');
const app = require('../index');

describe('Catalog Service', () => {
  describe('GET /health', () => {
    it('returns ok status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.service).toBe('catalog');
    });
  });

  describe('GET /api/movies', () => {
    it('returns all movies', async () => {
      const res = await request(app).get('/api/movies');
      expect(res.status).toBe(200);
      expect(res.body.movies.length).toBeGreaterThan(0);
      expect(res.body.total).toBeDefined();
    });

    it('filters by genre', async () => {
      const res = await request(app).get('/api/movies?genre=Drama');
      expect(res.status).toBe(200);
      res.body.movies.forEach(m => {
        expect(m.genre).toBe('Drama');
      });
    });
  });

  describe('GET /api/movies/:id', () => {
    it('returns a movie by id', async () => {
      const res = await request(app).get('/api/movies/1');
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('The Shawshank Redemption');
    });

    it('returns 404 for missing movie', async () => {
      const res = await request(app).get('/api/movies/999');
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/movies/:id/recommendations', () => {
    it('returns recommendations from the recommendation service', async () => {
      const recommendationServer = http.createServer((req, res) => {
        const requestUrl = new URL(req.url, 'http://localhost');
        expect(requestUrl.pathname).toBe('/api/recommend');
        expect(requestUrl.searchParams.get('genre')).toBe('Drama');
        expect(requestUrl.searchParams.get('excludeId')).toBe('1');
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ recommendations: [{ id: 6, title: 'The Green Mile' }] }));
      });

      await new Promise(resolve => recommendationServer.listen(0, '127.0.0.1', resolve));
      const address = recommendationServer.address();
      process.env.RECOMMENDATION_SERVICE_URL = `http://127.0.0.1:${address.port}`;

      try {
        const res = await request(app).get('/api/movies/1/recommendations');
        expect(res.status).toBe(200);
        expect(res.body.recommendations[0].title).toBe('The Green Mile');
      } finally {
        delete process.env.RECOMMENDATION_SERVICE_URL;
        await new Promise(resolve => recommendationServer.close(resolve));
      }
    });

    it('does not follow recommendation service redirects', async () => {
      let redirectTargetCalled = false;
      const redirectTarget = http.createServer((req, res) => {
        redirectTargetCalled = true;
        res.end(JSON.stringify({ recommendations: [] }));
      });
      await new Promise(resolve => redirectTarget.listen(0, '127.0.0.1', resolve));

      const redirectTargetAddress = redirectTarget.address();
      const recommendationServer = http.createServer((req, res) => {
        res.statusCode = 302;
        res.setHeader('Location', `http://127.0.0.1:${redirectTargetAddress.port}/redirected`);
        res.end();
      });
      await new Promise(resolve => recommendationServer.listen(0, '127.0.0.1', resolve));

      const recommendationAddress = recommendationServer.address();
      process.env.RECOMMENDATION_SERVICE_URL = `http://127.0.0.1:${recommendationAddress.port}`;

      try {
        const res = await request(app).get('/api/movies/1/recommendations');
        expect(res.status).toBe(200);
        expect(redirectTargetCalled).toBe(false);
      } finally {
        delete process.env.RECOMMENDATION_SERVICE_URL;
        await new Promise(resolve => recommendationServer.close(resolve));
        await new Promise(resolve => redirectTarget.close(resolve));
      }
    });
  });

  describe('POST /api/movies', () => {
    it('creates a new movie', async () => {
      const res = await request(app)
        .post('/api/movies')
        .send({ title: 'Test Movie', year: 2024, rating: 7.5, genre: 'Action' });
      expect(res.status).toBe(201);
      expect(res.body.title).toBe('Test Movie');
      expect(res.body.id).toBeDefined();
    });

    it('requires title and year', async () => {
      const res = await request(app)
        .post('/api/movies')
        .send({ rating: 5.0 });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/genres', () => {
    it('returns all genres', async () => {
      const res = await request(app).get('/api/genres');
      expect(res.status).toBe(200);
      expect(res.body.genres.length).toBeGreaterThan(0);
    });
  });
});
