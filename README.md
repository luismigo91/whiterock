# Whiterock — Agregador de inmobiliarias de bancos

> **Idealista pero solo banca.** Agrega en un único mapa y catálogo toda la oferta de servicers bancarios españoles: **Aliseda, Servihabitat, Haya, Altamira/doValue, Solvia, Anticipa, Diglo, Hipoges, BuildingCenter**…

## ¿Qué es?
El comprador/inversor hoy debe recorrer 8-10 portales distintos con buscadores y calidades inconsistentes. Whiterock **normaliza** esa oferta en un modelo canónico, la **geocodifica** y la expone en:

- **Mapa interactivo** con clustering, bbox y sincronización lista ↔ viewport
- **Ficha unificada** con fotos, características, mapa de detalle y enlace al origen
- **Filtros avanzados** (precio, m², habitaciones, tipo, servicer) con URL compartible

Explícitamente **no** indexa Idealista, Fotocasa ni particulares.

## Stack
Next.js 15 (App Router) + TypeScript + Prisma + PostgreSQL/PostGIS + BullMQ + MapLibre GL + Tailwind

Ver `openspec/project.md` y `openspec/changes/whiterock-aggregator/` para especificación completa.

## OpenSpec

Este repo está gestionado con [OpenSpec](https://github.com/Fission-AI/OpenSpec) (spec-driven).

```bash
npx openspec list              # ver changes
npx openspec show whiterock-aggregator
npx openspec status --change whiterock-aggregator
```

### Change activo

**`whiterock-aggregator`** — 4/4 artefactos completos ✓

- `proposal.md` — por qué y qué cambia
- `specs/servicer-ingestion`, `property-catalog`, `geo-normalization`, `map-search`, `property-detail` — contratos de comportamiento
- `design.md` — decisiones de arquitectura
- `tasks.md` — 30 tareas en 8 grupos para implementación

Validado: `npx openspec validate whiterock-aggregator --strict` ✓

### Siguiente paso

```bash
# Implementar las tareas del change
/opsx-apply whiterock-aggregator   # en OpenCode
# o
npx openspec instructions tasks --change whiterock-aggregator --json
```

Tras implementar, archivar:

```bash
npx openspec archive whiterock-aggregator
```

## Desarrollo (tras bootstrap)

```bash
cp .env.example .env        # DATABASE_URL, REDIS_URL, GEOCODER, etc.
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev                 # http://localhost:3000
npm run ingest:aliseda      # job manual por servicer
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
