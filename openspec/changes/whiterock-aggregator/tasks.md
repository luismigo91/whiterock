## 1. Bootstrap del proyecto

- [ ] 1.1 Inicializar Next.js 15 + TypeScript + ESLint + Tailwind + `app/` router
- [ ] 1.2 Configurar Prisma + PostgreSQL (DATABASE_URL) + extensión PostGIS / fallback GIST
- [ ] 1.3 Crear `openspec/project.md` con stack, convenciones y contexto del dominio bancario
- [ ] 1.4 Añadir `.env.example`, scripts `db:migrate`, `db:seed`, `ingest:*`

## 2. Modelo de datos canónico (property-catalog, geo-normalization)

- [ ] 2.1 Prisma schema: `Property`, `PriceHistory`, `StatusHistory`, `GeocodeCache`, `IngestJob`, enum `Servicer`/`PropertyType`/`PropertyStatus`
- [ ] 2.2 Migration inicial + índices (`@@unique([servicer,externalId])`, `price`, `province/municipality`, GIST lat/lng)
- [ ] 2.3 Seed de servicers (Aliseda, Servihabitat, Haya, Altamira/doValue, Solvia, Anticipa, Diglo) + fixtures de Property
- [ ] 2.4 Repositorio `PropertyRepository` con filtros, paginación, bbox y búsqueda textual (insensible a acentos)

## 3. Geocodificación (geo-normalization)

- [ ] 3.1 Servicio `GeocodeService` con provider intercambiable (Nominatim primary, Google fallback)
- [ ] 3.2 Tabla `GeocodeCache` + hash de `normalizedAddress` + TTL y reutilización
- [ ] 3.3 Pipeline de normalización: `province/municipality/postalCode/neighborhood` vía catálogo INE + `geocodeConfidence` + `approximateLocation`
- [ ] 3.4 Job de reintento para `geocodeStatus=pending` y métricas de cobertura (% mapeables)

## 4. Ingesta por servicer (servicer-ingestion)

- [ ] 4.1 Interfaz `ServicerAdapter` + orquestador + factoría/registro de adapters
- [ ] 4.2 Implementar `AlisedaAdapter` y `ServihabitatAdapter` (PoC con fixtures + tests de contrato)
- [ ] 4.3 Implementar `HayaAdapter`, `AltamiraAdapter`, `SolviaAdapter` (+ Anticipa/Diglo stubs)
- [ ] 4.4 Normalizador `RawListing → Property` con validación y `rawPayloadHash`
- [ ] 4.5 Deduplicación `(servicer,externalId)`, diff `priceHistory/statusHistory`, `delisted` tras 2 ciclos ausente
- [ ] 4.6 Cola BullMQ (o pg-boss) con cron diario 03:00 + incremental 6h, retry exponencial, DLQ, rate limit 1 req/s y flag `enabled` por servicer
- [ ] 4.7 Endpoint interno `POST /api/ingest/:servicer` + `GET /api/servicers` con métricas (ingested/created/updated/delisted/failed, lastIngestAt)

## 5. API de catálogo (property-catalog)

- [ ] 5.1 `GET /api/properties` con filtros (`servicer[]`, `propertyType[]`, `province`, `municipality`, `priceMin/Max`, `areaMin/Max`, `roomsMin`, `bbox`, `q`, `sort`, `page/pageSize` máx 50)
- [ ] 5.2 `GET /api/properties/:id` con `priceHistory`, `statusHistory`, `photos`, `sourceUrl`
- [ ] 5.3 Validación Zod de query params + manejo de errores (400/404) + headers de paginación (`X-Total-Count`)
- [ ] 5.4 Tests de integración para bbox, filtros combinados y paginación con 10k fixtures

## 6. Mapa y búsqueda (map-search)

- [ ] 6.1 Layout responsive: desktop split mapa/lista, móvil toggle + bottom sheet filtros
- [ ] 6.2 Mapa MapLibre/Leaflet con clustering (Supercluster) y conteos por zoom
- [ ] 6.3 Sincronización viewport ↔ listado: `bbox` en URL, fetch al mover/zoom, hover tarjeta↔pin
- [ ] 6.4 Panel de filtros avanzados (precio, m², habitaciones, tipo, estado, servicer multi-select) con deep-linking y estado en URL
- [ ] 6.5 Estados vacíos (“Sin resultados en esta zona”) y loading skeletons + manejo de `total`/`totalPages`

## 7. Ficha de propiedad (property-detail)

- [ ] 7.1 Ruta `app/properties/[id]/page.tsx` con SSR, galería + lightbox, secciones Características/Ubicación/Descripción
- [ ] 7.2 Mini-mapa de detalle con pin + aviso `approximateLocation`, badge servicer + “Ver en origen” + `lastSeenAt`
- [ ] 7.3 SEO: `slug`, meta OG (precio/foto), URL canónica `/properties/:id/:slug`, botón compartir/copy-link
- [ ] 7.4 Placeholders para fotos ausentes y atributos `null` (“No disponible”)

## 8. Calidad, observabilidad y deploy

- [ ] 8.1 Tests unitarios adapters/normalizador + e2e de flujo mapa→ficha
- [ ] 8.2 Logs estructurados por servicer + métricas de ingesta + alerta si `ingested==0`
- [ ] 8.3 CI (lint, typecheck, test) + deploy Vercel/Render + crons configurados + README con instrucciones
