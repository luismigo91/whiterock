## Context

V1 está archivado con 5 specs (property-catalog, servicer-ingestion, etc.) y MVP con mock data. V2 debe pasar a prod: scraping real (WAF prone), auth/alertas, clustering escalable, y deploy reproducible. Ver `proposal.md` y deltas `favorites-alerts`, `observability`, `deploy` + modificaciones `servicer-ingestion`/`map-search`/`property-catalog`.

## Goals / Non-Goals

**Goals:**
- Scraping real para 2 servicers PoC con fallback robusto y tests snapshot.
- Favoritos/alertas con Auth.js + SavedSearch/Alert sin reinventar auth.
- Mapa server-cluster <150ms p95, health/metrics + Slack alert.
- Docker+compose + Vercel cron + migraciones prod idempotentes.

**Non-Goals:**
- Scraping masivo de todos los servicers a la vez (solo Aliseda/Servihabitat PoC; resto siguen mock hasta validar PoC).
- Notificaciones push reales email/SMS en v2 (solo `Alert` tabla + UI; email opcional si `SMTP` configurado).
- Multi-tenant orgs, roles complejos, RBAC más allá de `ADMIN_EMAILS`.

## Decisions

### Scraping: Cheerio first, Playwright fallback, snapshot contract
- **Por qué**: Cheerio barato/rápido para HTML estático; Playwright solo cuando selector vacío (JS-heavy). Evita pagar browser siempre.
- **Snapshot**: `tests/fixtures/snapshots/<servicer>/list.html` guardado, test `adapter fetchListings` parsea snapshot → garantiza detector de rotura DOM sin hit live.
- **Alt**: `puppeteer` descartado (Playwright más estable, cross-browser).
- **WAF**: si 403/captcha → `enabled=false` temporal + `observability` webhook.

### Auth: Auth.js (NextAuth) + PrismaAdapter + email magic link
- **Por qué**: integración Next.js sin reinventar, `User`/`Session` en Postgres, magic link evita OAuth complejidad; Google OAuth add-on posterior.
- **Alt**: Clerk/Auth0 descartados (vendor lock, coste).

### DB: añadir `User`, `Session`, `SavedSearch`, `Favorite`, `Alert`; `price` cents
- **Migración**: `ALTER TABLE Property ADD priceCents`, backfill `price*100`, luego `RENAME`. Mantener API en euros (mapping `priceCents/100`).
- **Índices**: `SavedSearch(userId)`, `Alert(userId, isRead)`, `Favorite(userId, propertyId)` unique.

### Mapa clustering server: Supercluster (server) + kdbush
- **Por qué**: `supercluster` es estándar Mapbox, funciona server-side con `load(points)` + `getClusters(bbox, zoom)`. Alternativa `postgis ST_ClusterDBSCAN` requiere PG complejidad.
- **Endpoint**: `GET /api/properties/clusters?bbox&zoom` → `FeatureCollection`. Cliente usa clusters si `zoom<12` y `total>500`, sino pins directos.

### Deploy: Dockerfile multistage + compose (web/db/redis) + Vercel crons
- **Dockerfile**: `node:22-alpine` deps → `prisma generate` → `next build` → `node:22-alpine` runner `next start` non-root, `ENTRYPOINT` hace `prisma migrate deploy`.
- **Compose**: `postgres:15` con `postgis` extension enable script, `redis:7` opcional (BullMQ); si no Redis fallback `pg-boss` o `node-cron`.
- **Crons**: Vercel `vercel.json` crons → `POST /api/cron/ingest` con `CRON_SECRET` Bearer. Docker usa `BullMQ` repeatable.

### Observabilidad: `prom-client` + `/api/metrics` + `/api/health` + Slack
- **Por qué**: `prom-client` simple, no sidecar. `/metrics` texto Prometheus scrapeable.
- **Logs**: `pino` o `console.log` JSON con `servicer, ingested...`.

## Risks / Trade-offs

- **Scraping bloqueado/WAF** → Mitigación: Playwright + headers + `enabled` flag + snapshot test que avisa antes que prod.
- **ToS legal scraping** → Mitigación: `enabled` por servicer, respetar robots, priorizar API JSON donde exista; disclaimer legal.
- **Playwright peso en Docker** → Mitigación: target `mcr.microsoft.com/playwright` solo para adapters que lo requieren; o usar `chromium` headless separado.
- **Price cents migración** → Mitigación: backfill + dual read (si `priceCents` null usa `price` legacy) hasta migración completa.
- **Redis no disponible** → Mitigación: fallback `pg-boss` / `node-cron` sin Redis, documentado en `deploy` spec.
- **Auth email deliverability** → Mitigación: `nodemailer` con `SMTP` opcional; si no configurado, log token en dev.

## Migration Plan

1. Prisma migrate `add_v2_models` (User/SavedSearch/Favorite/Alert) + `priceCents`.
2. `docker compose build && up` + `npm run db:seed` idempotente.
3. Vercel env `DATABASE_URL`, `NEXTAUTH_SECRET`, `CRON_SECRET`, `SLACK_WEBHOOK_URL`.
4. Deploy `vercel --prod`, verificar `/api/health` 200.
5. Rollback: `prisma migrate resolve --rolled-back` + revert `git revert` (migrations additive, rollback safe).

## Open Questions

- ¿OAuth Google además de magic link? Diferible; spec lo permite añadir provider sin cambiar otros.
- ¿Email real vs solo `Alert` tabla? Si `SMTP` no configurado, solo UI campana.
