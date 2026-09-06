# Whiterock — Agregador de inmobiliarias de bancos

> **Idealista pero solo banca.** Agrega en un único mapa y catálogo toda la oferta de servicers bancarios españoles: **Aliseda, Servihabitat, Haya, Altamira/doValue, Solvia, Anticipa, Diglo, Hipoges, BuildingCenter**…

## ¿Qué es?
El comprador/inversor hoy debe recorrer 8-10 portales distintos con buscadores y calidades inconsistentes. Whiterock **normaliza** esa oferta en un modelo canónico, la **geocodifica** y la expone en:

- **Mapa interactivo** con clustering, bbox y sincronización lista ↔ viewport
- **Ficha unificada** con fotos, características, mapa de detalle y enlace al origen
- **Filtros avanzados** (precio, m², habitaciones, tipo, servicer) con URL compartible

Explícitamente **no** indexa Idealista, Fotocasa ni particulares.

## Stack
Next.js 16 (App Router) + TypeScript + Prisma 5.22 + PostgreSQL 15/PostGIS + Redis + BullMQ + Leaflet + Supercluster + Tailwind + Vitest + Playwright

Ver `openspec/project.md` y `openspec/specs/` (8 specs: geo-normalization, property-catalog/detail, servicer-ingestion, map-search, favorites-alerts, observability, deploy, mailpit) para especificación completa.

## OpenSpec

Este repo está gestionado con [OpenSpec](https://github.com/Fission-AI/OpenSpec) (spec-driven).

```bash
npx openspec list
npx openspec status --change whiterock-v2
npx openspec validate --strict
```

**Historial:**
- `2026-09-06-whiterock-aggregator` — MVP v1 archivado (mapa + ficha + mock)
- `2026-09-06-whiterock-v2` — v2 full (Cheerio+Playwright, cluster server, favoritos/alertas magic link, health/metrics, Docker+Vercel)
- `whiterock-v3` — v3 polish (Mailpit SMTP dev, pricePerM2, proxy imágenes, release) — activo

## Desarrollo

```bash
cp .env.example .env        # DATABASE_URL, REDIS_URL, NEXTAUTH_SECRET, CRON_SECRET
npm install
npx prisma migrate dev      # o prisma db push para dev sin migración
npx prisma db seed          # 16 fixtures
npm run dev                 # http://localhost:3000
npm run ingest:aliseda      # job manual por servicer
# APIs
curl "http://localhost:3000/api/properties?bbox=-0.5,39.3,-0.2,39.6"
curl http://localhost:3000/api/health
curl http://localhost:3000/api/metrics
curl http://localhost:3000/api/servicers
```

## Deploy

**Local con Docker (incl. Mailpit para magic link):**
```bash
docker compose up --build   # web:3000 + db:5432 + redis:6379 + mailpit:8025/1025
# ver magic links en http://localhost:8025 (Mailpit UI)
# env: SMTP_HOST=mailpit SMTP_PORT=1025 (ver .env.example)
# healthcheck: http://localhost:3000/api/health
```

**Vercel prod:**
```bash
vercel --prod
# envs: DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, CRON_SECRET, ADMIN_EMAILS, SLACK_WEBHOOK_URL, SMTP_HOST, SMTP_FROM
# crons en vercel.json: 0 3 * * * y 0 */6 * * * → POST /api/cron/ingest
```

## Auth (magic link sin Google)

```bash
# dev sin SMTP: link se loguea en logs (docker logs web o npm run dev)
# prod con SMTP real: configura SMTP_HOST/PORT/USER/PASS en .env
# visita /auth/signin → introduce email → magic link
```

## Tests

```bash
npm run test                # 52 vitest (incl. pricePerM2 + image proxy)
npm run test:coverage       # v8 ~65%
npm run e2e                 # playwright 3/3 (mapa→ficha, bbox, empty) + mailpit e2e opcional
npm run typecheck && npm run build  # 16 routes (incl. /admin/ingest, /saved-searches, /api/clusters/image, /auth/signin)
curl "http://localhost:3000/api/properties?pricePerM2Max=1000&sort=pricePerM2Asc"
curl "http://localhost:3000/api/image?url=https://picsum.photos/seed/wh1/800/600" --output /tmp/img.jpg
```

## Estructura prevista

```
src/
  app/
    api/properties/         # GET /api/properties, /:id
    api/servicers/          # GET /api/servicers, POST /api/ingest/:servicer
    properties/[id]/        # ficha unificada
    (map)/                  # vista mapa + lista
  server/
    adapters/               # AlisedaAdapter, ServihabitatAdapter, ...
    services/geocode.ts
    repositories/property.ts
  components/map/           # Map, Cluster, Filters
prisma/schema.prisma
openspec/
```

## Roadmap
- **v1**: ingesta + catálogo + mapa + ficha (este change)
- **v2**: favoritos, alertas por zona/precio, auth, proxy de imágenes, Playwright para servicers JS-heavy

## Legal
Scraping sujeto a ToS de cada servicer. Cada adapter tiene flag `enabled` y rate limit. Priorizar APIs públicas si existen y respetar robots.txt.
