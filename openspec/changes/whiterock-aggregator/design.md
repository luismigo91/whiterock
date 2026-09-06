## Context

Proyecto greenfield sin código existente. Requisito central: unificar 7+ portales heterogéneos (Aliseda, Servihabitat, Haya, Altamira/doValue, Solvia, Anticipa, Diglo) con estructuras, calidad de datos y anti-bot distintos, y exponerlos en UX de mapa + ficha al estilo Idealista pero solo banca. Ver `proposal.md` y specs `servicer-ingestion`, `property-catalog`, `geo-normalization`, `map-search`, `property-detail`.

Restricciones: scraping sujeto a ToS y cambios de DOM frecuentes; geocoding incompleto en muchas fichas; volumen ~50-200k inmuebles; necesidad de refresco diario sin sobrecargar fuentes.

## Goals / Non-Goals

**Goals:**
- Arquitectura modular por servicer que permita añadir/pausar una fuente sin despliegue del resto.
- Modelo canónico sólido (Prisma + Postgres + PostGIS/GIST) que soporte bbox y filtros combinados con p95 <300ms.
- UX mapa-lista sincronizada con deep-linking por URL, clustering y responsive.
- Geocodificación fiable con caché, fallback y trazabilidad.

**Non-Goals:**
- Alertas, favoritos, auth de usuario y notificaciones (fase 2).
- Tasación, financiación o CRM (fuera de alcance).
- Scraping de Idealista/Fotocasa o portales no bancarios (explícitamente excluido).
- App nativa móvil (solo web responsive en v1).

## Decisions

### Stack: Next.js 15 (App Router) + TypeScript + Prisma + PostgreSQL + PostGIS
- **Por qué**: SSR/SEO para fichas, API Routes co-localizadas, Prisma migrations tipadas, PostGIS para índices GIST geoespaciales. Alternativas descartadas: NestJS separado (overhead infra), MongoDB (peor para bbox/filtros relacionales).
- **Alternativa considerada**: Fastify + React SPA → peor SEO de fichas.

### Mapa: MapLibre GL (o Leaflet + clustering) con tiles OSM/Carto
- **Por qué**: sin coste por tile, clustering con Supercluster, control total. Google Maps descartado por coste y vendor lock-in; Mapbox similar.
- **Detalle**: `map-search` usa `bbox` como source of truth en URL; Supercluster en frontend para <5k pins en viewport, paginación server-side para resto.

### Ingesta: Adapter pattern + BullMQ (o Vercel Cron + Queues)
- **Por qué**: cada servicer es un adapter con `fetchListings/fetchDetail/normalize`. BullMQ aporta reintentos, backoff, DLQ, concurrencia limitada. Alternativa `pg-boss` considerada si se quiere evitar Redis.
- **Rate limit**: token bucket por servicer (1 req/s por defecto) + respeto a Retry-After.
- **Anti-bot**: headers realistas, rotación UA, respeto robots, flag para pasar a Playwright solo si es necesario (costoso).

### Geocoding: Nominatim (self-host opcional) con fallback a Google
- **Por qué**: Nominatim gratuito para volumen medio; Google solo para casos `pending` y como fallback de alta precisión. Caché en tabla `geocode_cache(normalized_address_hash → lat/lng/province/municipality)`.
- **Confidence**: `high` (calle+número), `medium` (calle), `low` (municipio) + `approximateLocation`.

### Modelo: `Property` + `PriceHistory` + `GeocodeCache` + `IngestJob`
```prisma
model Property { id, externalId, servicer, title, description, price, propertyType, status, addressRaw, addressNormalized, province, municipality, postalCode, latitude, longitude, geocodeConfidence, approximateLocation, areaM2, rooms, bathrooms, yearBuilt, energyCert, photos Json, sourceUrl, rawPayloadHash, lastSeenAt, createdAt, updatedAt, priceHistory, statusHistory }
```
Índices: `@@unique([servicer, externalId])`, `@@index([province, municipality])`, `@@index([price])`, `GIST(latitude, longitude)` vía extensión PostGIS o índice compuesto btree para bbox rectangular.

### Sync estrategia
- Cron diario 03:00 full, incremental 6h (solo cambios). Diff: comparar `rawPayloadHash`; si cambia → upsert + append history. Ausencia 2 ciclos → `delisted`.
- Métricas: por servicer `ingested/created/updated/delisted/failed` expuestas en `GET /api/servicers` y log estructurado.

## Risks / Trade-offs

- **Cambio de DOM/API del servicer → ingesta rota** → Mitigación: adapters desacoplados + tests de contrato (snapshot de HTML/JSON) + alerta si `ingested==0` en un ciclo.
- **Bloqueo anti-bot (403/WAF)** → Mitigación: backoff, pausar adapter, modo Playwright bajo demanda, proxy rotativo opcional.
- **Geocoding inexacto/incompleto** → Mitigación: caché + fallback + `approximateLocation` visible en UI; no bloquear ingesta por geocoding.
- **ToS/legal scraping** → Mitigación: flag `enabled` por servicer, revisión legal previa, preferir APIs públicas si existen, respetar robots.txt.
- **Coste geocoding Google** → Mitigación: Nominatim primero, Google solo fallback; límite diario configurable.
- **Fotos hotlink vs. proxy** → Trade-off: hotlink es barato pero puede romperse/CORS; proxy/CDN es robusto pero coste ancho de banda. v1 hotlink con `next/image` remotePatterns + fallback placeholder; v2 proxy si tasa de rotura >5%.
- **PostGIS op. infra** → Alternativa si no disponible: índice btree sobre `latitude, longitude` y filtro bbox rectangular (suficiente para MVP, sin radio queries).

## Migration Plan

1. `npx prisma init` + `DATABASE_URL` + habilitar `postgis` (o btree fallback).
2. Migrations iniciales: `Property`, `PriceHistory`, `GeocodeCache`, `IngestJob`.
3. Seed de `Servicer` enum + adapters mock con fixtures.
4. Deploy Vercel/Render con cron `0 3 * * *` y `0 */6 * * *`.
5. Rollback: adapters feature-flagged; desactivar servicer no afecta al resto; DB migrations reversibles (solo additive en v1).

## Open Questions

- ¿Proveedor de tiles definitivo (MapLibre OSM vs. MapTiler) según cuota y estilo deseado? No bloquea specs.
- ¿Necesidad de Playwright para algún servicer con JS-heavy? A validar con PoC por adapter.
- ¿Proxy de imágenes en v1 o v2? Decisión diferible tras medir rotura.
