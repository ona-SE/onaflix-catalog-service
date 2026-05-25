const express = require('express');
const cors = require('cors');
require('dotenv').config();

const movieRoutes = require('./routes/movies');
const genreRoutes = require('./routes/genres');

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  const { pathname } = new URL(req.url, `http://${req.headers.host}`);
  req.pathname = pathname;
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
