const request = require('supertest');
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
    const originalFetch = global.fetch;

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('returns recommendations from the recommendation service', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ recommendations: [{ id: 3 }] }),
      });

      const res = await request(app).get('/api/movies/1/recommendations');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ recommendations: [{ id: 3 }] });
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3005/api/recommend?genre=Drama&excludeId=1'
      );
    });
  });

  describe('GET /api/movies/export/csv', () => {
    it('exports the catalog as CSV', async () => {
      const res = await request(app).get('/api/movies/export/csv');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/csv/);
      expect(res.text).toContain('id,title,year,rating,genre,director');
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
