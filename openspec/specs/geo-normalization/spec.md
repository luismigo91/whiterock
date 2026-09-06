# geo-normalization Specification

## Purpose
Garantizar que cada propiedad tenga coordenadas y división administrativa normalizada para que el 100% del catálogo sea mapeable y filtrable por territorio, incluso cuando las fuentes proveen direcciones incompletas o inconsistentes.
## Requirements
### Requirement: Geocodificación obligatoria con fallback
Toda `Property` SHALL tener `latitude` y `longitude`; si la fuente no los provee, el sistema SHALL geocodificar `address` mediante proveedor configurable (Nominatim/Google) y persistir `geocodeConfidence` y `geocodeProvider`.

#### Scenario: Dirección completa geocodificada
- **WHEN** se ingesta una propiedad con `address: "C/ Colón 12, Valencia"`
- **THEN** el sistema obtiene lat/lng y los persiste con `geocodeConfidence: high`

#### Scenario: Geocoding falla
- **WHEN** la dirección es irreconocible o el proveedor no responde
- **THEN** la propiedad queda con `geocodeStatus: pending` y se reintenta en el siguiente job, sin bloquear la ingesta

### Requirement: Normalización administrativa
El sistema SHALL normalizar y persistir `province`, `municipality`, `postalCode` y `neighborhood` a partir de la respuesta de geocoding o de la fuente, usando catálogo INE como referencia y sin tildes inconsistentes.

#### Scenario: Normalización de provincia
- **WHEN** la fuente envía `provincia: "valència"` y el geocoder devuelve `Valencia`
- **THEN** se persiste `province: "Valencia"` canónica

### Requirement: Caché y deduplicación de geocoding
El sistema SHALL cachear resultados de geocoding por `normalizedAddress` hash para no re-consultar la misma dirección y respetar quotas.

#### Scenario: Dos pisos misma calle
- **WHEN** dos propiedades comparten `normalizedAddress`
- **THEN** la segunda reutiliza la caché y no consume petición al proveedor

### Requirement: Bounding-box y centroide derivado
El sistema SHALL derivar `bbox` por municipio/provincia cuando no hay coordenadas exactas, permitiendo igualmente su visualización aproximada en el mapa.

#### Scenario: Solo municipio disponible
- **WHEN** solo se conoce `municipality: "Sevilla"` sin calle
- **THEN** se asigna centroide municipal con `geocodeConfidence: low` y flag `approximateLocation: true`

