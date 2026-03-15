## Migration Assessment: Node 14 → Node 20

**Current state:** Node 14 (per `.nvmrc` and `engines` in package.json)
**Module system:** CommonJS (`require()`)
**Test baseline:** 8/8 passing (jest 27)

### Deprecated APIs Found

| File | API | Replacement |
|------|-----|-------------|
| `src/index.js:4,17` | `url.parse()` | `new URL()` |
| `src/routes/movies.js:3,22` | `querystring.parse()` | `URLSearchParams` |
| `src/routes/movies.js:80` | `new Buffer()` | `Buffer.from()` |

### Deprecated Dependencies

| Package | Issue | Replacement |
|---------|-------|-------------|
| `request` | Deprecated, no maintenance | `node-fetch` or built-in `fetch` (Node 18+) |
| `request-promise` | Depends on deprecated `request` | Built-in `fetch` |
| `body-parser` | Bundled in Express 4.16+ as `express.json()` | Remove, use `express.json()` |

### Dependencies Needing Updates

- `jest@27` → `jest@29` (Node 20 support)
- `supertest@6` → `supertest@7` (deprecation warning)
- `redis@3` → `redis@4` (major rewrite, but not actively used in code)
- `nodemon@2` → `nodemon@3`

### ASSUMPTION

- `redis` and `pg` are declared but not imported in any source file — likely placeholders. Will update versions but no code changes needed.
- `request-promise` is used in `movies.js` recommendations endpoint. Will replace with built-in `fetch`.
