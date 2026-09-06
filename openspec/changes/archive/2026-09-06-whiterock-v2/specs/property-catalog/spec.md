## MODIFIED Requirements

### Requirement: Modelo canónico Property
El sistema SHALL persistir `Property` con al menos: `id`, `externalId`, `servicer`, `title`, `description`, `price` (cents), `propertyType`, `status`, `address`, `province`, `municipality`, `postalCode`, `latitude`, `longitude`, `areaM2`, `rooms`, `bathrooms`, `yearBuilt`, `energyCert`, `photos[]`, `sourceUrl`, `createdAt`, `updatedAt`, `lastSeenAt`. En v2 `price` SHALL almacenarse siempre en cents (`euros*100`) y la API SHALL seguir exponiendo euros para compatibilidad.

#### Scenario: Persistencia mínima válida
- **WHEN** se ingesta un piso con solo precio, dirección y fotos
- **THEN** el registro se crea con opcionales en null y coordenadas pendientes de geocodificación

#### Scenario: Validación de tipos
- **WHEN** se intenta guardar `propertyType` no permitido
- **THEN** la API rechaza con 400 y mensaje de enum inválido

## ADDED Requirements

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
