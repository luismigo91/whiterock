# Changelog

## v0.1.0 — 2026-09-06

**Agregador inmobiliarias de bancos — Initial release**

Incluye `whiterock-aggregator` (v1) + `whiterock-v2` full + `whiterock-v3` polish (parcial, Mailpit + pricePerM2 + proxy).

### Agregado
- **v1 MVP** (`2026-09-06-whiterock-aggregator`): 5 specs (servicer-ingestion, property-catalog, geo-normalization, map-search, property-detail) — 26 requirements, 35 tasks, mapa Leaflet con bbox/sync, ficha unificada, APIs `GET /api/properties` (filtros, bbox, q, paginación, `X-Total-Count`), `GET /api/servicers`, `POST /api/ingest/:servicer`, ingesta mock + geocode Nominatim
- **v2** (`2026-09-06-whiterock-v2`): 8 specs (+17 ~4) — scraping Cheerio (Aliseda/Servihabitat snapshots) + Playwright fallback, cluster server `GET /api/properties/clusters`, favoritos/alertas (`SavedSearch`/`Favorite`/`Alert` + header campana `/saved-searches`), observabilidad `/health`/`/metrics`/`/admin/ingest`, deploy `Dockerfile`+`docker-compose` (postgis+redis) + `vercel.json` crons, auth magic link `Nodemailer` sin Google
- **v3 polish** (en curso): Mailpit `docker-compose` (1025/8025, `SMTP_HOST=mailpit`), `pricePerM2` derivado (`price/areaM2`, filtros `pricePerM2Min/Max`, sort `pricePerM2Asc/Desc`, badge `€/m²`), proxy `GET /api/image?url=` cache 1h

### Infra
- Next.js 16, Prisma 5.22, Postgres 15/PostGIS, Leaflet, Supercluster, Tailwind, Vitest 6 suites 52 tests, Playwright 3 e2e, cobertura v8 ~65%, 16 routes

### Docs
- `README` deploy local/Vercel + Mailpit `http://localhost:8025`, `openspec/specs/` 8 specs
