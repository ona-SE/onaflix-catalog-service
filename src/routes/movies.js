const express = require('express');
const http = require('http');
const https = require('https');
const _ = require('lodash');
const querystring = require('querystring');

const router = express.Router();

const getJson = targetUrl => new Promise((resolve, reject) => {
  const client = targetUrl.protocol === 'https:'
    ? https
    : targetUrl.protocol === 'http:'
      ? http
      : null;

  if (!client) {
    reject(new Error(`Unsupported protocol: ${targetUrl.protocol}`));
    return;
  }

  const outboundRequest = client.get(targetUrl, response => {
    if (response.statusCode >= 300 && response.statusCode < 400) {
      response.resume();
      reject(new Error('Recommendation service redirects are not allowed'));
      return;
    }

    if (response.statusCode < 200 || response.statusCode >= 300) {
      response.resume();
      reject(new Error(`Recommendation service returned ${response.statusCode}`));
      return;
    }

    response.setEncoding('utf8');
    let body = '';
    response.on('data', chunk => {
      body += chunk;
    });
    response.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
  });

  outboundRequest.on('error', reject);
});

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
    const recommendationBaseUrl = process.env.RECOMMENDATION_SERVICE_URL || 'http://localhost:3005';
    const recommendationUrl = new URL('/api/recommend', recommendationBaseUrl);
    recommendationUrl.searchParams.set('genre', movie.genre);
    recommendationUrl.searchParams.set('excludeId', movie.id);
    const recommendations = await getJson(recommendationUrl);
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
