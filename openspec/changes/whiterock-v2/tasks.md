## 1. Infra base y DB

- [x] 1.1 Prisma migrate `v2`: modelos `User`, `Session`, `SavedSearch`, `Favorite`, `Alert` + `priceCents` backfill + índices
- [x] 1.2 Actualizar `prisma/schema.prisma` + `npx prisma generate` + seed idempotente con users demo
- [x] 1.3 Env prod: `.env.example` añadir `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `CRON_SECRET`, `SLACK_WEBHOOK_URL`, `SMTP_*`

## 2. Scraping real (servicer-ingestion v2)

- [x] 2.1 Instalar `cheerio` + snapshots `tests/fixtures/snapshots/{aliseda,servihabitat}/list.html` + helper `loadFixture`
- [x] 2.2 Reimplementar `AlisedaAdapter` con Cheerio (selectors price, areaM2, rooms, photos) + parser robusto + tests contrato snapshot
- [x] 2.3 Reimplementar `ServihabitatAdapter` con Cheerio/JSON API + tests contrato
- [ ] 2.4 Playwright fallback: `playwright-core` + helper `fetchWithPlaywright(url)` con headers + timeout 15s, integration en adapters si Cheerio 0 resultados
- [ ] 2.5 WAF handling: detectar 403/captcha, marcar `enabled=false` temporal, log + métrica, reintento con backoff
- [ ] 2.6 `hashPayload` + diff `priceHistory/statusHistory` + `delisted` ya existente, verificar con ingest real + tests

## 3. Cluster server (map-search v2)

- [x] 3.1 Server `Supercluster` wrapper: `src/server/services/cluster.ts` con `load()`, `getClusters(bbox, zoom)`, `kdbush`
- [x] 3.2 Endpoint `GET /api/properties/clusters?bbox&zoom` → GeoJSON `FeatureCollection`, <150ms p95, `X-Total-Count`
- [ ] 3.3 Frontend: `MapView` usa clusters cuando `total>500` y `zoom<12`, click cluster → `zoomIn`, test e2e
- [ ] 3.4 Tests integración cluster: bbox Madrid zoom 6 → clusters, zoom 12 → points

## 4. Auth + Favoritos/Alertas (favorites-alerts + property-catalog v2)

- [ ] 4.1 Instalar `next-auth@5` + `PrismaAdapter`, config `auth.ts` con email provider + `auth.config`, middleware protegiendo `/api/saved-searches`
- [ ] 4.2 APIs `GET/POST/DELETE /api/saved-searches` + `GET/POST/DELETE /api/favorites` (401 sin sesión, scoping por userId, idempotencia)
- [ ] 4.3 Lógica alertas: hook post-ingest `evaluateAlerts()` → `Alert new_listing` y `price_drop >5%`, `GET /api/alerts` + `PATCH /api/alerts/:id/read`
- [ ] 4.4 UI: header campana con badge no leídas, `/saved-searches` CRUD, botón `Alertar` en Filters, `Favorite` heart en cards/ficha
- [ ] 4.5 Tests: unit `favorites` idempotencia, integration `saved-search` scoping, e2e login→guardar búsqueda→alerta

## 5. Observabilidad

- [x] 5.1 `GET /api/health` (db/redis/version, 503 si db down) + `GET /api/metrics` `prom-client` (ingest, properties, cache)
- [x] 5.2 Logs JSON por servicer + webhook Slack si `ingested==0` + `IngestJob` `partial_failure`
- [x] 5.3 `/admin/ingest` tabla por servicer (lastIngestAt/status) + botón Re-ejecutar (protegido `ADMIN_EMAILS`)
- [ ] 5.4 Tests: health 503 mock, metrics scrape, slack webhook mock

## 6. Deploy

- [x] 6.1 `Dockerfile` multistage + `docker-compose.yml` (web/db/redis + healthchecks + postgis enable)
- [x] 6.2 `vercel.json` crons + `src/app/api/cron/ingest/route.ts` con `CRON_SECRET` Bearer validation
- [x] 6.3 Entrypoint `prisma migrate deploy` + `npm run build` y `db:seed` idempotente, validar `DATABASE_URL` fail fast
- [ ] 6.4 Docs `README` deploy local (`docker compose up`) y prod Vercel + envs

## 7. Calidad y verificación

- [ ] 7.1 `npm run test:coverage` ≥65% + `npx playwright test` 6+ tests (incl. cluster y alertas) + `npx prisma validate`
- [ ] 7.2 `npm run build` y `npx openspec validate whiterock-v2 --strict` verde, archivar
