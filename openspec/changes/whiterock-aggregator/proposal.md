## Why

No existe un agregador que centralice exclusivamente la oferta de servicers/inmobiliarias de bancos (Aliseda, Servihabitat, Haya, Altamira/doValue, Solvia, Anticipa, Diglo, Hipoges, BuildingCenter). El comprador/inversor debe recorrer 8-10 portales distintos con buscadores, filtros y calidad de datos inconsistentes. Esto fragmenta la oferta REO/bancaria y dificulta el análisis geolocalizado. Whiterock resuelve esa fragmentación con un único catálogo normalizado y experiencia de mapa estilo Idealista pero 100% enfocado en este segmento.

## What Changes

- **Modelo canónico `Property`** que unifica campos heterogéneos de cada servicer (precio, superficie, habitaciones, estado, tipología, ubicación, fotos, referencia original, URL fuente).
- **Ingesta modular por servicer** (`ServicerAdapter`): scrapers/API clients para Aliseda, Servihabitat, Haya, Altamira/doValue, Solvia, Anticipa, Diglo (extensible). Jobs programados + deduplicación por referencia/geo-hash.
- **Geocodificación y normalización** de direcciones a lat/lng + provincia/municipio/barrio + código postal para poder mapear TODO el inventario.
- **Buscador con mapa interactivo**: filtros (precio, m², habitaciones, tipo, estado, servicer), bounding-box, clustering, lista sincronizada con viewport.
- **Ficha de propiedad unificada**: galería, características, mapa, servicer de origen con link, fecha de actualización y etiqueta “banco/servicer”.
- **API + Frontend** (Next.js + Postgres + Prisma) con paginación y búsqueda server-side. Preparado para alertas/favoritos en fase 2.
- **Infra de refresco**: cron de ingesta diaria, diff de altas/bajas/cambios de precio, métricas de cobertura.

## Capabilities

### New Capabilities
- `servicer-ingestion`: Ingesta, scraping/API, orquestación y normalización por servicer hacia el modelo canónico. Incluye adapters, scheduler, deduplicación y trazabilidad de fuente.
- `property-catalog`: Modelo de datos canónico, persistencia (Postgres/Prisma), versionado de cambios, deduplicación y API de catálogo paginada/filtrada.
- `geo-normalization`: Geocodificación, normalización de direcciones y enriquecimiento geográfico (provincia/municipio/CP/lat-lng) para mapeo fiable.
- `map-search`: Experiencia de búsqueda geolocalizada: mapa con clustering, filtros avanzados, sincronización lista ↔ viewport, bounding-box queries y ordenación.
- `property-detail`: Ficha unificada de inmueble con todas las características normalizadas, galería, mapa de detalle, atribución de servicer y enlace a origen.

### Modified Capabilities
<!-- No hay specs previas; proyecto greenfield. -->

## Impact

- **Stack nuevo**: Next.js 15 (App Router) + TypeScript + Prisma + PostgreSQL + job runner (BullMQ / Vercel Cron) + MapLibre/Leaflet o Google Maps.
- **APIs/Contracts**: `GET /api/properties` (filtros + bbox + paginación), `GET /api/properties/:id`, `GET /api/servicers`, jobs internos `POST /api/ingest/:servicer`.
- **Dependencias externas**: Scraping/API de cada servicer (riesgo legal/ToS a validar), servicio de geocoding (Nominatim/Google), hosting imágenes (proxy o CDN).
- **Sistemas afectados**: Nuevo repo greenfield; sin migración. Riesgos: anti-bot, cambios de DOM/APIs de servicers, geocoding incompleto → mitigado con adapters desacoplados y colas reintentables.
