# favorites-alerts Specification

## Purpose
Permitir a usuarios autenticados guardar búsquedas y favoritos y recibir alertas automáticas cuando aparecen nuevos inmuebles o bajan de precio en sus criterios, cerrando el loop de descubrimiento para inversores.
## Requirements
### Requirement: Autenticación con NextAuth
El sistema SHALL usar `Auth.js` (NextAuth) con provider email (o OAuth Google) y adaptar Prisma, exponiendo `GET /api/auth/session` y protegiendo endpoints de favoritos/alertas; sin sesión SHALL devolver 401.

#### Scenario: Acceso sin sesión
- **WHEN** se pide `POST /api/saved-searches` sin cookie de sesión
- **THEN** responde 401 Unauthorized

#### Scenario: Login exitoso
- **WHEN** el usuario completa magic link y vuelve a `/`
- **THEN** ve su email en header y puede guardar búsquedas

### Requirement: Guardar y gestionar búsquedas
El sistema SHALL permitir crear búsquedas con `name` y `filters` (bbox, price, servicer, etc.), listarlas y borrarlas por `id` perteneciente al usuario.

#### Scenario: Crear búsqueda con nombre
- **WHEN** `POST /api/saved-searches {name:"Valencia <100k", filters:{priceMax:100000, province:"Valencia"}}`
- **THEN** crea registro y lo devuelve con `id` y `createdAt`

### Requirement: Favoritos
El usuario SHALL poder marcar/desmarcar favoritos y listarlos con detalle de `Property` enriquecido, con idempotencia y `DELETE` 204.

#### Scenario: Toggle favorito
- **WHEN** `POST /api/favorites {propertyId:"123"}` dos veces
- **THEN** la segunda es no-op y `GET /api/favorites` sigue devolviendo 1 entrada

### Requirement: Alertas por nueva alta y bajada de precio
Tras cada ingesta exitosa, el sistema SHALL evaluar `SavedSearch` de todos los usuarios: si un inmueble nuevo matchea filtros, crea `Alert type=new_listing`; si un `price` existente baja >5% y matchea, crea `Alert type=price_drop`. `GET /api/alerts` SHALL listar no leídas.

#### Scenario: Nueva alta genera alerta
- **WHEN** ingesta inserta piso en Valencia que matchea búsqueda guardada de usuario X
- **THEN** aparece `Alert` para X con `propertyId` y `savedSearchId`

#### Scenario: Bajada 10% genera alerta
- **WHEN** un inmueble baja de 100k a 90k y matchea búsqueda
- **THEN** se crea `Alert price_drop` con `oldPrice`/`newPrice` en payload

### Requirement: UI Mis búsquedas y campana de alertas
El frontend SHALL mostrar en header campana con contador de alertas no leídas y página `/saved-searches` con listado, botón `Alertar` y acceso a resultados filtrados.

#### Scenario: Campana con 2 no leídas
- **WHEN** el usuario tiene 2 `Alert` no leídas
- **THEN** la campana muestra badge `2` y al pulsar lista las alertas con link a ficha

