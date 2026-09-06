# deploy Specification

## Purpose
Estandarizar despliegue reproducible en local y producción con Docker, migraciones y crons, eliminando drift entre dev y prod y permitiendo ingesta programada sin intervención manual.
## Requirements
### Requirement: Dockerfile multistage y compose
El repo SHALL incluir `Dockerfile` multistage (deps → build → runner non-root) y `docker-compose.yml` con servicios `web` (Next), `db` (postgres:15 + postgis), `redis` opcional y `mailpit` (axllent/mailpit, 1025:1025, 8025:8025) para SMTP dev, todos comunicados por red `whiterock`, con healthchecks.

#### Scenario: docker compose up
- **WHEN** se ejecuta `docker compose up --build`
- **THEN** web arranca en 3000, db en 5432 y `GET /api/health` devuelve 200 en <5s

#### Scenario: Mailpit disponible
- **WHEN** se ejecuta `docker compose up`
- **THEN** `http://localhost:8025` muestra UI de Mailpit y magic links aparecen en `GET /api/v1/messages`

### Requirement: Migraciones y seed prod
El contenedor web SHALL ejecutar `prisma migrate deploy` al arrancar (o `entrypoint` que lo hace) y exponer comando `npm run db:seed` idempotente; `DATABASE_URL` SHALL venir de env sin hardcode.

#### Scenario: Deploy con nueva migración
- **WHEN** se hace deploy con nueva migración `add_saved_search`
- **THEN** el contenedor aplica la migración automáticamente y arranca sin error

### Requirement: Crons programados
En Vercel SHALL usarse `vercel.json` con crons `0 3 * * *` y `0 */6 * * *` apuntando a `POST /api/cron/ingest`; en Docker SHALL usarse `node-cron` o `BullMQ` repeatable jobs. El endpoint cron SHALL validar `CRON_SECRET` header.

#### Scenario: Cron invoca ingesta
- **WHEN** Vercel cron hace `POST /api/cron/ingest` con `Authorization: Bearer $CRON_SECRET`
- **THEN** se encola `ingestAll` y devuelve 200 con `jobId`

### Requirement: Health y env prod
El sistema SHALL validar envs requeridos al arrancar (`DATABASE_URL`, `NEXTAUTH_SECRET` si auth habilitado) y fallar fast si faltan, logueando qué falta sin exponer secretos.

#### Scenario: Falta DATABASE_URL
- **WHEN** se arranca sin `DATABASE_URL`
- **THEN** el proceso aborta con mensaje `Missing DATABASE_URL` y exit 1

