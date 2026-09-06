## MODIFIED Requirements

### Requirement: Dockerfile multistage y compose
El repo SHALL incluir `Dockerfile` multistage (deps → build → runner non-root) y `docker-compose.yml` con servicios `web` (Next), `db` (postgres:15 + postgis), `redis` opcional y `mailpit` (axllent/mailpit, 1025:1025, 8025:8025) para SMTP dev, todos comunicados por red `whiterock`, con healthchecks.

#### Scenario: docker compose up
- **WHEN** se ejecuta `docker compose up --build`
- **THEN** web arranca en 3000, db en 5432 y `GET /api/health` devuelve 200 en <5s

#### Scenario: Mailpit disponible
- **WHEN** se ejecuta `docker compose up`
- **THEN** `http://localhost:8025` muestra UI de Mailpit y magic links aparecen en `GET /api/v1/messages`
