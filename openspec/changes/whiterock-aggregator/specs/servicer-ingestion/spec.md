## Purpose

Orquestar la ingesta periódica y normalizada de inmuebles desde cada servicer bancario (Aliseda, Servihabitat, Haya, Altamira/doValue, Solvia, etc.) hacia el modelo canónico de Whiterock, con trazabilidad, deduplicación y resiliencia ante cambios de las fuentes.

## ADDED Requirements

### Requirement: Adapter por servicer desacoplado
El sistema SHALL proveer un `ServicerAdapter` por cada fuente (ej. `AlisedaAdapter`, `ServihabitatAdapter`) que exponga una interfaz común `fetchListings()` → `RawListing[]` y `fetchDetail(id)` → `RawListing`, aislando la lógica de scraping/API específica de cada portal.

#### Scenario: Añadir nuevo servicer sin tocar otros
- **WHEN** se registra un nuevo adapter implementando la interfaz común
- **THEN** el orquestador lo detecta y lo ejecuta sin modificar adapters existentes

#### Scenario: Fallo aislado de un servicer
- **WHEN** un adapter falla (timeout, 403, cambio de DOM)
- **THEN** el sistema registra el error con servicer + timestamp y continúa con los demás, marcando el job como `partial_failure`

### Requirement: Normalización a modelo canónico
Cada `RawListing` SHALL ser transformado a `Property` canónico con campos mínimos: `externalId`, `servicer`, `title`, `price`, `propertyType`, `status`, `address`, `lat/lng`, `areaM2`, `rooms`, `bathrooms`, `photos[]`, `sourceUrl`, `lastSeenAt`.

#### Scenario: Mapeo de campos heterogéneos
- **WHEN** Servihabitat devuelve `superficie: "85 m²"` y Aliseda `superficieConstruida: 85`
- **THEN** ambos se normalizan a `areaM2: 85` numérico

#### Scenario: Campos opcionales ausentes
- **WHEN** una fuente no provee habitaciones o año de construcción
- **THEN** el sistema persiste `null` y la ficha muestra “No disponible” sin fallar la ingesta

### Requirement: Orquestación programada y reintentable
El sistema SHALL ejecutar ingestas completas diarias y parciales cada 6h mediante jobs en cola, con reintentos exponenciales (3 intentos) y dead-letter queue para registros fallidos.

#### Scenario: Ingesta diaria completa
- **WHEN** el cron diario dispara a las 03:00 Europe/Madrid
- **THEN** se encolan jobs por servicer y se procesan en paralelo con límite de concurrencia

#### Scenario: Reintento tras 429
- **WHEN** un adapter recibe 429 Too Many Requests
- **THEN** el job se reencola con backoff y respeta el header `Retry-After` si existe

### Requirement: Deduplicación y diff de cambios
El sistema SHALL deduplicar por `(servicer, externalId)` y detectar altas, bajas y cambios (precio, estado, fotos) entre ejecuciones, persistiendo `priceHistory` y `statusHistory`.

#### Scenario: Cambio de precio detectado
- **WHEN** un inmueble existente cambia de 120.000€ a 110.000€
- **THEN** se actualiza `price` y se añade entrada en `priceHistory` con fecha y valor anterior

#### Scenario: Baja de inmueble
- **WHEN** un `externalId` no aparece en 2 ingestas consecutivas
- **THEN** el registro se marca como `delisted` sin borrado físico y deja de aparecer en búsquedas por defecto

### Requirement: Trazabilidad y auditoría de fuente
Cada `Property` SHALL almacenar `sourceUrl`, `servicer`, `rawPayloadHash` y `ingestedAt` para auditoría y enlace directo al origen.

#### Scenario: Ver origen
- **WHEN** un usuario abre la ficha de un inmueble
- **THEN** ve el badge del servicer (ej. “Aliseda”) y un enlace “Ver en origen” a `sourceUrl`

### Requirement: Rate limiting y cumplimiento
Los adapters SHALL respetar rate limiting por servicer (máx. configurable, por defecto ≤ 1 req/s) y exponer flag para pausar una fuente si viola ToS o requiere revisión legal.

#### Scenario: Pausar servicer
- **WHEN** un operador desactiva el adapter de Haya
- **THEN** el scheduler lo omite y el catálogo conserva los últimos datos con etiqueta “actualización pausada”
