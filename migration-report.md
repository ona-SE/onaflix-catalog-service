## Migration Report

**From:** Node 14
**To:** Node 20

### Breaking changes fixed

| Change | File | Detail |
|--------|------|--------|
| `url.parse()` → `new URL()` | `src/index.js` | Replaced deprecated URL parsing |
| `querystring.parse()` → `URLSearchParams` | `src/routes/movies.js` | Replaced deprecated querystring module |
| `new Buffer()` → `Buffer.from()` | `src/routes/movies.js` | Replaced deprecated Buffer constructor |
| `request-promise` → built-in `fetch` | `src/routes/movies.js` | Replaced deprecated HTTP client with Node 18+ native fetch |
| `body-parser` → `express.json()` | `src/index.js` | Removed redundant middleware, using Express built-in |

### Dependencies updated

| Package | From | To | Notes |
|---------|------|----|-------|
| `dotenv` | ^10.0.0 | ^16.3.1 | Major version bump |
| `express` | ^4.17.1 | ^4.18.2 | Patch update |
| `pg` | ^8.7.1 | ^8.12.0 | Minor update |
| `redis` | ^3.1.2 | ^4.6.12 | Major rewrite (not actively used in code) |
| `jest` | ^27.5.1 | ^29.7.0 | Node 20 compatibility |
| `nodemon` | ^2.0.15 | ^3.0.2 | Major update |
| `supertest` | ^6.2.2 | ^7.0.0 | Major update |

### Dependencies removed

| Package | Reason |
|---------|--------|
| `body-parser` | Redundant; `express.json()` used instead |
| `request` | Deprecated, no longer maintained |
| `request-promise` | Depends on deprecated `request`; replaced with native `fetch` |

### Tests

**PASS** — 8/8 tests passing

### Audit

**0 vulnerabilities** (down from 18 on Node 14 dependency set)
