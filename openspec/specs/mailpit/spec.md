# mailpit Specification

## Purpose
Proveer SMTP de desarrollo verificable sin depender de proveedor externo, permitiendo probar magic link end-to-end con UI de inbox.
## Requirements
### Requirement: Servicio Mailpit en compose
El compose SHALL incluir servicio `mailpit` con imagen `axllent/mailpit`, puertos `1025:1025` (SMTP) y `8025:8025` (UI), healthcheck HTTP a `/api/v1/messages`, y web SHALL usarlo cuando `SMTP_HOST=mailpit`.

#### Scenario: docker compose up con mailpit
- **WHEN** `docker compose up --build`
- **THEN** `http://localhost:8025` muestra UI de Mailpit y `GET http://mailpit:1025` acepta SMTP

#### Scenario: Magic link llega a Mailpit
- **WHEN** usuario pide magic link con `SMTP_HOST=mailpit`
- **THEN** el mail aparece en `GET http://localhost:8025/api/v1/messages` con URL de verificación

### Requirement: E2E que verifica mail
Un test Playwright SHALL pedir magic link y luego poll a Mailpit API hasta encontrar el mail y extraer la URL, verificando que contiene `/api/auth/callback/email`.

#### Scenario: E2E mailpit
- **WHEN** Playwright hace `POST /api/auth/signin` con email `test@whiterock.es`
- **THEN** en <5s Mailpit devuelve un mensaje con ese `to` y `text` con link

