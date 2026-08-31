# OnaFlix Catalog Service

Movie catalog microservice for the OnaFlix platform. Manages movie data, genres, and recommendations.

## Stack

- **Runtime:** Node.js 20
- **Framework:** Express 5
- **HTTP Client:** Node.js `fetch`
- **Utilities:** lodash

## Setup

```bash
nvm use 20
npm install
npm run dev
```

## API Endpoints

- `GET /api/movies` -- List movies (supports genre, minRating, sort filters)
- `GET /api/movies/:id` -- Get movie by ID
- `GET /api/movies/:id/recommendations` -- Get recommendations
- `GET /api/movies/export/csv` -- Export as CSV
- `POST /api/movies` -- Add a movie
- `GET /api/genres` -- List genres
- `GET /api/genres/:slug` -- Get genre by slug
- `GET /health` -- Health check

## Testing

```bash
npm test
```
