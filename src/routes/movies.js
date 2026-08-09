const express = require('express');
const _ = require('lodash');
const querystring = require('querystring');
const http = require('http');
const https = require('https');
const { URL } = require('url');

const router = express.Router();

// Minimal JSON GET helper (replaces deprecated request-promise, CVE-2023-28155).
// Rejects on non-2xx to preserve the previous simple:true behavior so callers
// keep their existing fallback path.
function getJson(baseUrl, query) {
  const target = new URL(baseUrl);
  for (const [key, value] of Object.entries(query || {})) {
    target.searchParams.set(key, value);
  }

  const client = target.protocol === 'https:' ? https : http;

  return new Promise((resolve, reject) => {
    const request = client.get(target, { headers: { Accept: 'application/json' } }, response => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', chunk => {
        body += chunk;
      });
      response.on('end', () => {
        if (response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error(`Recommendation service returned ${response.statusCode}`));
          return;
        }

        try {
          resolve(body ? JSON.parse(body) : {});
        } catch (err) {
          reject(err);
        }
      });
    });

    request.setTimeout(5000, () => {
      request.destroy(new Error('Recommendation service request timed out'));
    });
    request.on('error', reject);
  });
}

// In-memory movie store (demo)
let movies = [
  { id: 1, title: 'The Shawshank Redemption', year: 1994, rating: 9.3, genre: 'Drama', director: 'Frank Darabont' },
  { id: 2, title: 'The Godfather', year: 1972, rating: 9.2, genre: 'Crime', director: 'Francis Ford Coppola' },
  { id: 3, title: 'The Dark Knight', year: 2008, rating: 9.0, genre: 'Action', director: 'Christopher Nolan' },
  { id: 4, title: 'Pulp Fiction', year: 1994, rating: 8.9, genre: 'Crime', director: 'Quentin Tarantino' },
  { id: 5, title: 'Fight Club', year: 1999, rating: 8.8, genre: 'Drama', director: 'David Fincher' },
];

router.get('/', (req, res) => {
  let result = [...movies];

  // Deprecated: querystring.parse
  const filters = querystring.parse(req.query);

  if (req.query.genre) {
    result = _.filter(result, { genre: req.query.genre });
  }

  if (req.query.minRating) {
    result = result.filter(m => m.rating >= parseFloat(req.query.minRating));
  }

  if (req.query.sort) {
    result = _.sortBy(result, req.query.sort);
    if (req.query.order === 'desc') {
      result = _.reverse(result);
    }
  }

  res.json({
    movies: result,
    total: result.length,
  });
});

router.get('/:id', (req, res) => {
  const movie = _.find(movies, { id: parseInt(req.params.id) });
  if (!movie) {
    return res.status(404).json({ error: 'Movie not found' });
  }
  res.json(movie);
});

router.get('/:id/recommendations', async (req, res) => {
  const movie = _.find(movies, { id: parseInt(req.params.id) });
  if (!movie) {
    return res.status(404).json({ error: 'Movie not found' });
  }

  try {
    const recommendationServiceUrl = process.env.RECOMMENDATION_SERVICE_URL || 'http://localhost:3005';
    const recommendationUrl = `${recommendationServiceUrl.replace(/\/$/, '')}/api/recommend`;
    const recommendations = await getJson(recommendationUrl, {
      genre: movie.genre,
      excludeId: movie.id,
    });
    res.json(recommendations);
  } catch (err) {
    // Fallback: return same-genre movies
    const sameGenre = movies.filter(m => m.genre === movie.genre && m.id !== movie.id);
    res.json({ recommendations: sameGenre });
  }
});

router.post('/', (req, res) => {
  const { title, year, rating, genre, director } = req.body;
  if (!title || !year) {
    return res.status(400).json({ error: 'Title and year are required' });
  }

  const newMovie = {
    id: movies.length > 0 ? _.maxBy(movies, 'id').id + 1 : 1,
    title,
    year: parseInt(year),
    rating: parseFloat(rating) || 0,
    genre: genre || 'Unknown',
    director: director || 'Unknown',
  };

  movies.push(newMovie);
  res.status(201).json(newMovie);
});

// Deprecated: Buffer constructor
router.get('/export/csv', (req, res) => {
  const header = 'id,title,year,rating,genre,director\n';
  const rows = movies.map(m =>
    `${m.id},"${m.title}",${m.year},${m.rating},"${m.genre}","${m.director}"`
  ).join('\n');

  const csvBuffer = new Buffer(header + rows);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=movies.csv');
  res.send(csvBuffer);
});

module.exports = router;
