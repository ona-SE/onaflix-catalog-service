const express = require('express');
const _ = require('lodash');

const router = express.Router();

const GENRES = [
  { id: 1, name: 'Action', slug: 'action' },
  { id: 2, name: 'Comedy', slug: 'comedy' },
  { id: 3, name: 'Crime', slug: 'crime' },
  { id: 4, name: 'Drama', slug: 'drama' },
  { id: 5, name: 'Horror', slug: 'horror' },
  { id: 6, name: 'Sci-Fi', slug: 'sci-fi' },
  { id: 7, name: 'Thriller', slug: 'thriller' },
];

router.get('/', (req, res) => {
  res.json({ genres: GENRES });
});

router.get('/:slug', (req, res) => {
  const genre = _.find(GENRES, { slug: req.params.slug });
  if (!genre) {
    return res.status(404).json({ error: 'Genre not found' });
  }
  res.json(genre);
});

module.exports = router;
