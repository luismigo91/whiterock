## Why

MVP whiterock v1 demostró viabilidad con mock data, pero sin scraping real, sin persistencia en prod, sin alertas y sin clustering eficiente no resuelve el job-to-be-done completo: el inversor necesita datos frescos a diario y avisos push. Tras validar 42 tests + 3 e2e, ahora toca pasar a producción real con ingesta auténtica, auth, mapa escalable y operabilidad.

## What Changes

- **Scraping real (servicer-ingestion v2)**: Reemplaza fixtures por `Cheerio`/`Playwright` para Aliseda/Servihabitat (PoC) + `fetch` JSON para Haya/Altamira/Solvia donde API existe; snapshot HTML para tests de contrato; `rawPayloadHash` diff + `delisted` + rate limit 1 req/s + `enabled` flag + respeto `Retry-After`/WAF; fallback a mock si bloqueo.
- **Favoritos/Alertas**: Nuevo dominio `favorites-alerts`: `User` (NextAuth/Prisma), `SavedSearch` (filtros serializados bbox+price+servicer) y `Alert` (notificación al detectar nueva alta o bajada >5%); `GET/POST /api/saved-searches`, `GET /api/alerts`, UI `Mis búsquedas` + toggle `Alertar`.
- **Deploy producción**: `Dockerfile` + `docker-compose` (Next + Postgres 15 + PostGIS + Redis), `.env.production`, `prisma migrate deploy`, seed prod, Vercel (`vercel.json` cron `0 3 * * *` y `0 */6 * * *`) o `Render` + `BullMQ` (fallback `pg-boss` si no Redis); healthcheck `/api/health`.
- **Mapa avanzado (map-search v2)**: Modifica `map-search`: clustering server-side (`Supercluster` + `kdbush`) cuando viewport >500 pins; `GET /api/properties/clusters?bbox&zoom`; `hover` tarjeta↔cluster fino; `postcss` tiles `MapTiler` opcional.
- **Observabilidad**: Nuevo `observability`: `GET /api/metrics` (Prometheus) + `GET /api/health` + logs estructurados por servicer (`ingested/created/updated/delisted/failed/lastIngestAt`) + alerta Slack/webhook si `ingested==0` en ciclo; dashboard `/admin/ingest`.
- **BREAKING**: `Property.price` pasa a `Int cents` consistente en DB (antes mixto euros/cents en mock); API mantiene `price` en euros para compat, mapeo interno `price*100`.

## Capabilities

### New Capabilities
- `favorites-alerts`: Favoritos, búsquedas guardadas y alertas por bajada/nueva alta (auth, persistencia, notificaciones).
- `observability`: Métricas Prometheus, healthcheck, logs por servicer y alertas operacionales.
- `deploy`: Infra Docker/Vercel, migraciones prod, crons y compose.

### Modified Capabilities
- `servicer-ingestion`: Cambia fixtures por scraping real (Cheerio/Playwright) con tests contrato snapshot y WAF handling.
- `map-search`: Añade clustering server-side y endpoint `/clusters`.
- `property-catalog`: Añade `User`/`SavedSearch`/`Favorite`/`Alert` models y `price` cents canonical, expone `includeFavorites` y `GET /api/saved-searches`.

## Impact

- **Nuevas deps**: `cheerio`, `playwright` (optional), `next-auth` (o `auth.js`), `nodemailer`/`@slack/web-api`, `prom-client`, `supercluster` server, `@prisma/adapter` + `pg` para prod.
- **APIs nuevas**: `POST /api/auth/*`, `GET/POST/DELETE /api/saved-searches`, `GET /api/alerts`, `GET /api/properties/clusters`, `GET /api/health`, `GET /api/metrics`.
- **DB**: nuevas tablas `User`, `Session`, `SavedSearch`, `Favorite`, `Alert`; migración `price` → cents; índice GIST ya existe.
- **Infra**: `Dockerfile`, `docker-compose.yml`, `vercel.json` crons, `prisma/migrate` prod, Redis opcional.
- **Riesgo**: scraping sufre WAF/CAPTCHA → mitigado con Playwright bajo demanda + flag `enabled` + snapshot tests; ToS check requerido por servicer.
