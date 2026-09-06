## Why

V2 dejó auth magic link logueado en consola y sin SMTP verificable, sin filtro `pricePerM2`, con hotlink directo de fotos (roto/CORS) y sin release formal. Para cerrar el loop de entrega necesitamos dev SMTP real, métricas de valor (price/m²) y entrega inmutable (tag + changelog).

## What Changes

- **SMTP dev real**: añade servicio `mailpit` en `docker-compose.yml` (UI :8025, SMTP :1025), actualiza `.env.example` con `SMTP_HOST=mailpit` para prod local, verifica `POST /auth/signin` envía mail y link funciona end-to-end (test e2e Playwright abre Mailpit API).
- **pricePerM2**: añade campo derivado `pricePerM2 = price / areaM2` en `Property` (virtual o persistido) y API `GET /api/properties?pricePerM2Min&Max&sort=pricePerM2Asc`, UI filtro y badge en card/ficha; `MOCK` ya tiene `areaM2`.
- **Proxy imágenes**: `GET /api/image?url=` que fetchea hotlink, cachea en memoria 1h, reenvía con `Content-Type` y `Cache-Control: public, max-age=86400`, fallback a placeholder si 404; `next/image` usa `loader` proxy para evitar CORS/rotura; `next.config.ts` mantiene `remotePatterns`.
- **Release v0.1.0**: `git tag v0.1.0`, `CHANGELOG.md` desde `openspec/changes/archive`, `npm run build` + `typecheck` + `test` verdes como gate.

## Capabilities

### New Capabilities
- `mailpit`: Infra dev SMTP con UI y verificación e2e.

### Modified Capabilities
- `property-catalog`: Añade `pricePerM2` derivado, filtros y sort.
- `property-detail`: Muestra `pricePerM2` badge y usa proxy de imágenes.
- `deploy`: Añade servicio `mailpit` en compose y docs SMTP.

## Impact

- **Deps**: ninguna nueva (nodemailer ya, mailpit es contenedor); `pricePerM2` es derivado sin migración; proxy usa fetch nativo.
- **APIs**: `GET /api/image`, `GET /api/properties` nuevos query `pricePerM2*`, `Mailpit` API `:8025/api/v1/messages` solo en dev.
- **Infra**: `docker-compose.yml` +1 servicio, `.env.example` actualizado, `CHANGELOG.md` nuevo.
- **Riesgo**: Mailpit solo dev (prod usa SMTP real); proxy sin auth pero rate-limit implícito por cache.
