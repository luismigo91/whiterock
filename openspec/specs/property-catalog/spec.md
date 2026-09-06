# property-catalog Specification

## Purpose
Definir el modelo de datos canónico y la API de catálogo que centraliza todas las propiedades de servicers bancarios, garantizando consistencia, consultas filtradas y paginadas, y evolución histórica de precios y estados.
## Requirements
### Requirement: Modelo canónico Property
El sistema SHALL persistir `Property` con al menos: `id`, `externalId`, `servicer`, `title`, `description`, `price` (cents), `propertyType`, `status`, `address`, `province`, `municipality`, `postalCode`, `latitude`, `longitude`, `areaM2`, `rooms`, `bathrooms`, `yearBuilt`, `energyCert`, `photos[]`, `sourceUrl`, `createdAt`, `updatedAt`, `lastSeenAt`. En v2 `price` SHALL almacenarse siempre en cents (`euros*100`) y la API SHALL seguir exponiendo euros para compatibilidad.

#### Scenario: Persistencia mínima válida
- **WHEN** se ingesta un piso con solo precio, dirección y fotos
- **THEN** el registro se crea con opcionales en null y coordenadas pendientes de geocodificación

#### Scenario: Validación de tipos
- **WHEN** se intenta guardar `propertyType` no permitido
- **THEN** la API rechaza con 400 y mensaje de enum inválido

### Requirement: Listado paginado y filtrado
El endpoint `GET /api/properties` SHALL soportar filtros por `servicer[]`, `propertyType[]`, `province`, `municipality`, `priceMin/Max`, `areaMin/Max`, `roomsMin`, `bathroomsMin`, `status`, `bbox` (minLng,minLat,maxLng,maxLat), `q` (texto), con paginación `page`/`pageSize` (máx. 50) y ordenación `sort` (priceAsc, priceDesc, newest, areaDesc).

#### Scenario: Búsqueda filtrada por precio y provincia
- **WHEN** el cliente pide `GET /api/properties?province=Valencia&priceMax=150000&page=1&pageSize=20`
- **THEN** devuelve 20 resultados máximo, `total` y `totalPages`, solo de Valencia ≤150k

#### Scenario: Paginación fuera de rango
- **WHEN** se solicita `page=999` sin resultados
- **THEN** devuelve `data: []` con `total` y `totalPages` correctos y status 200

### Requirement: Búsqueda textual unificada
El sistema SHALL permitir búsqueda por texto libre sobre `title`, `description`, `municipality`, `province` y `address` con coincidencia insensible a mayúsculas y acentos.

#### Scenario: Búsqueda por municipio sin tilde
- **WHEN** el usuario busca `q=valencia`
- **THEN** encuentra propiedades con `municipality: "València"` y `province: "Valencia"`

### Requirement: Historial de precios y estados
El sistema SHALL mantener `priceHistory: {price, date}[]` y `statusHistory: {status, date}[]` por propiedad, accesibles desde la ficha y la API.

#### Scenario: Consulta historial
- **WHEN** se pide `GET /api/properties/:id`
- **THEN** la respuesta incluye `priceHistory` ordenado cronológicamente

### Requirement: Soft-delete y visibilidad
Las propiedades marcadas `delisted` SHALL no aparecer en listados por defecto, pero permanecer consultables por ID para trazabilidad; un flag `includeDelisted=true` las incluye si se solicita explícitamente.

#### Scenario: Listado excluye delistados por defecto
- **WHEN** se llama `GET /api/properties` sin flags
- **THEN** ninguna propiedad con `status=delisted` aparece en `data`

### Requirement: Consistencia de servicers
El endpoint `GET /api/servicers` SHALL devolver la lista de servicers configurados con `id`, `displayName`, `enabled`, `lastIngestAt`, `totalListings`.

#### Scenario: Listado de servicers
- **WHEN** el frontend carga filtros
- **THEN** obtiene los 7+ servicers con su conteo actualizado para poblar checkboxes

### Requirement: Modelos User, Favorite, SavedSearch y Alert
El sistema SHALL persistir `User` (id, email, name), `Favorite` (userId+propertyId unique), `SavedSearch` (userId, name, filters JSON, createdAt) y `Alert` (userId, savedSearchId, type: new_listing|price_drop, propertyId, createdAt), con FK y cascade.

#### Scenario: Guardar búsqueda
- **WHEN** un usuario guarda filtros `priceMax=100000&province=Valencia`
- **THEN** se crea `SavedSearch` con `filters` JSON y aparece en `GET /api/saved-searches`

#### Scenario: Favorito único
- **WHEN** un usuario marca favorito dos veces la misma propiedad
- **THEN** la segunda petición es idempotente y sigue existiendo un solo `Favorite`

### Requirement: API de búsquedas guardadas y favoritos
Los endpoints `GET/POST/DELETE /api/saved-searches` y `GET/POST/DELETE /api/favorites` SHALL requerir sesión y operar solo sobre datos del usuario autenticado.

#### Scenario: Listado solo del usuario
- **WHEN** usuario A pide `GET /api/saved-searches`
- **THEN** solo ve sus búsquedas, no las de B

