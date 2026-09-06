## MODIFIED Requirements

### Requirement: Mapa interactivo con clustering
El frontend SHALL renderizar mapa con pins agrupados por clustering dinámico; en v2 el clustering SHALL ser server-side cuando el viewport contiene >500 inmuebles, usando `GET /api/properties/clusters?bbox&zoom` que devuelve GeoJSON de clusters con `point_count` y `cluster_id`, y expansión al hacer click.

#### Scenario: Cluster al alejar
- **WHEN** el usuario aleja el zoom para ver toda España
- **THEN** ve clusters con conteos por provincia en lugar de miles de pins individuales

#### Scenario: Click en cluster
- **WHEN** el usuario hace click en un cluster de “42”
- **THEN** el mapa hace zoom y desagrega el cluster en pins o sub-clusters

#### Scenario: Server-side clustering por zoom
- **WHEN** el viewport contiene 2000 inmuebles a zoom 6
- **THEN** el backend devuelve clusters agregados y el frontend no renderiza 2000 pins individuales

## ADDED Requirements

### Requirement: Endpoint clusters GeoJSON
El endpoint `GET /api/properties/clusters` SHALL aceptar `bbox` y `zoom` y devolver `FeatureCollection` de clusters/puntos con paginación implícita y `X-Total-Count`, respondiendo <150ms p95.

#### Scenario: Request clusters
- **WHEN** se pide `GET /api/properties/clusters?bbox=-10,35,4,44&zoom=6`
- **THEN** devuelve GeoJSON con clusters y puntos individuales según `supercluster` server
