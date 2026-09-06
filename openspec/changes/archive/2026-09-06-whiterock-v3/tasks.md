## 1. Mailpit SMTP dev

- [x] 1.1 Añadir servicio `mailpit` en `docker-compose.yml` (axllent/mailpit, 1025:1025, 8025:8025, healthcheck) y `SMTP_HOST=mailpit` en `.env.example`
- [x] 1.2 Test Playwright e2e que pide magic link y verifica mail en `http://mailpit:8025/api/v1/messages` (poll 5s)

## 2. pricePerM2

- [x] 2.1 Repo: calcular `pricePerM2` en `listProperties`/`getPropertyById`, añadir filtros `pricePerM2Min/Max` y `sort` `pricePerM2Asc/Desc`
- [x] 2.2 API `GET /api/properties` validar nuevos queries con Zod, `pricePerM2` en respuesta
- [x] 2.3 UI: badge `pricePerM2` en card y ficha, filtros `pricePerM2` en `Filters.tsx` (opcional), tests
- [x] 2.4 Tests: integration `pricePerM2Max` filtra gangas, sort asc

## 3. Proxy imágenes

- [x] 3.1 `GET /api/image?url=` con fetch, cache Map 1h, `Content-Type` + `Cache-Control: public, max-age=86400`, placeholder fallback
- [x] 3.2 `next/image` loader proxy o `src` proxificado en cards/ficha, `next.config.ts` mantiene `remotePatterns`
- [x] 3.3 Test: `GET /api/image?url=https://picsum.photos/seed/wh1/800/600` devuelve image/*

## 4. Release

- [x] 4.1 Actualizar `README` sección Deploy con Mailpit `http://localhost:8025` y `CHANGELOG.md` con v0.1.0 desde archive
- [x] 4.2 `git tag v0.1.0` + `npm run typecheck`/`build`/`test` verdes, `npx openspec validate whiterock-v3 --strict` y archivar
