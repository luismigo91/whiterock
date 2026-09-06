## Context

V2 archivado con 8 specs y auth magic link logueado en consola. V3 es polish sin breaking: SMTP dev verificable, métrica `pricePerM2`, proxy imágenes y release. Ver proposal.md.

## Goals / Non-Goals

**Goals:** Mailpit dev e2e, `pricePerM2` derivado sin migración, proxy cache 1h, tag v0.1.0.
**Non-Goals:** SMTP prod real (sigue via env), persistir `pricePerM2` en DB, CDN externo.

## Decisions

- **Mailpit** `axllent/mailpit` — UI simple, API `/api/v1/messages`, sin auth dev, alternativa `mailhog` descartada (menos activa).
- **pricePerM2** derivado en repo (`price/areaM2` al vuelo) — evita migración, índice no necesario (filtro post-DB para mock, DB puede usar `WHERE price/areaM2` con índice funcional si escala).
- **Proxy** `GET /api/image?url=` con `fetch` + `Map` cache 1h (simple, sin Redis) — alt `next/image` remotePatterns directo deja CORS/rotura; proxy da control y cache header.
- **Release** `git tag v0.1.0` + `CHANGELOG.md` manual desde `openspec/changes/archive`.

## Risks / Trade-offs

- **Mailpit solo dev** → prod debe usar SMTP real; compose lo marca como `profiles: ["dev"]` opcional si se quiere evitar en prod.
- **Proxy sin rate limit** → cache 1h mitiga, pero abuse posible; futuro `rateLimit` por IP si necesario.
- **pricePerM2 null** → UI oculta badge, no error.

## Migration Plan

1. `docker compose up --build` (nuevo servicio mailpit)
2. `npm run build` verifica `/api/image` y `pricePerM2` sort
3. `git tag v0.1.0` + `git push --tags`

## Open Questions

- ¿Persistir `pricePerM2` si volumen >100k? Diferible.
