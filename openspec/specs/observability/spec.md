# observability Specification

## Purpose
Proveer observabilidad operativa mínima viable para operar la ingesta en producción sin blind spots: métricas ingest, healthchecks y alertas proactivas.
## Requirements
### Requirement: Healthcheck
El endpoint `GET /api/health` SHALL devolver 200 con `{status:"ok", db:"up|down", redis:"up|down", version}` y 503 si DB está down, sin requerir auth.

#### Scenario: DB down
- **WHEN** Prisma no alcanza Postgres
- **THEN** `GET /api/health` devuelve 503 con `db:"down"`

### Requirement: Métricas Prometheus
El endpoint `GET /api/metrics` SHALL exponer texto Prometheus con `whiterock_ingest_total{servicer,status}`, `whiterock_properties_total{servicer}` y `whiterock_geocode_cache_hit_total`, accesible sin auth pero opcionalmente protegido por token.

#### Scenario: Scrape Prometheus
- **WHEN** Prometheus hace GET `/api/metrics`
- **THEN** recibe `whiterock_ingest_total{servicer="aliseda",status="success"} 123`

### Requirement: Logs estructurados y alertas ingest
Cada ingesta SHALL loguear JSON con `servicer, ingested, created, updated, delisted, failed, durationMs`; si `ingested==0` tras ciclo completo SHALL disparar webhook Slack (si `SLACK_WEBHOOK_URL` configurado) y marcar `IngestJob.status=partial_failure`.

#### Scenario: Ingest vacío alerta
- **WHEN** Aliseda devuelve 0 listings
- **THEN** el log contiene `ingested:0` y se dispara POST a Slack con `servicer=aliseda`

### Requirement: Dashboard admin ingest
La ruta `/admin/ingest` (solo admin por env `ADMIN_EMAILS`) SHALL mostrar tabla por servicer con `lastIngestAt`, `ingested`, `failed`, `status` y botón `Re-ejecutar`.

#### Scenario: Admin ve últimos jobs
- **WHEN** admin autenticado visita `/admin/ingest`
- **THEN** ve 8 filas con métricas y estado del último `IngestJob` por servicer

