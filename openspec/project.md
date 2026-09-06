# Whiterock — Project Context

## Domain
Agregador inmobiliario **exclusivo para servicers de banca** (Aliseda, Servihabitat, Haya Real Estate, Altamira/doValue, Solvia, Anticipa, Diglo, Hipoges, BuildingCenter). No indexa Idealista/Fotocasa ni particulares. Objetivo: catálogo unificado mapeable con ficha normalizada y enlace al origen.

## Tech Stack
- Next.js 15 App Router + TypeScript (strict) + Tailwind CSS
- Prisma ORM + PostgreSQL + PostGIS (o GIST fallback) para queries bbox
- BullMQ / pg-boss + Redis (o Vercel Cron) para ingesta programada
- MapLibre GL / Leaflet + Supercluster para mapa + clustering
- Zod para validación, Vitest/Jest + Playwright para tests
- Deploy Vercel o Render, cron diario 03:00 Europe/Madrid + incremental 6h

## Conventions
- Conventional Commits (`feat:`, `fix:`, `chore:`)
- Prisma migrations versionadas, `DATABASE_URL` en `.env`
- Adapter pattern: `src/server/adapters/<servicer>/adapter.ts` con interfaz común
- API: `src/app/api/properties/route.ts`, `src/app/api/servicers/route.ts`
- i18n: castellano por defecto, sin multi-idioma en v1

## Constraints
- Scraping sujeto a ToS: cada adapter debe tener flag `enabled` y respetar rate limit ≤1 req/s + Retry-After
- Geocoding con caché obligatoria; nunca bloquear ingesta por fallo de geocoding
- Fotos en hotlink v1 con `next/image` remotePatterns; proxy en v2 si rotura >5%
- `approximateLocation` visible en UI cuando confianza geocoding es baja
