const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const url = require('url');
require('dotenv').config();

const movieRoutes = require('./routes/movies');
const genreRoutes = require('./routes/genres');

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(bodyParser.json());

// Deprecated: url.parse
app.use((req, res, next) => {
  const parsed = url.parse(req.url, true);
  req.pathname = parsed.pathname;
  next();
});

app.use('/api/movies', movieRoutes);
app.use('/api/genres', genreRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'catalog', uptime: process.uptime() });
});

app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Catalog service running on port ${PORT}`);
  });
}

module.exports = app;
