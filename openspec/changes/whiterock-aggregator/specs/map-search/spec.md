## Purpose

Ofrecer una experiencia de búsqueda tipo Idealista centrada en mapa: viewport sincronizado con listado, clustering, filtros avanzados y queries por bounding-box para explorar exclusivamente oferta bancaria.

## ADDED Requirements

### Requirement: Mapa interactivo con clustering
El frontend SHALL renderizar un mapa con pins agrupados por clustering dinámico; el número en cada cluster refleja inmuebles en ese área al zoom actual y al hacer click se hace zoom in.

#### Scenario: Cluster al alejar
- **WHEN** el usuario aleja el zoom para ver toda España
- **THEN** ve clusters con conteos por provincia en lugar de miles de pins individuales

#### Scenario: Click en cluster
- **WHEN** el usuario hace click en un cluster de “42”
- **THEN** el mapa hace zoom y desagrega el cluster en pins o sub-clusters

### Requirement: Sincronización viewport ↔ listado
El listado SHALL mostrar solo propiedades dentro del `bbox` visible del mapa; mover o hacer zoom actualiza el listado, y hacer hover en un item resalta su pin.

#### Scenario: Pan del mapa
- **WHEN** el usuario arrastra el mapa hacia el sur de Madrid
- **THEN** el listado se recarga con inmuebles del nuevo bbox y actualiza `total`

#### Scenario: Hover sincronizado
- **WHEN** el usuario hace hover sobre una tarjeta del listado
- **THEN** el pin correspondiente en el mapa se resalta y abre tooltip con precio y m²

### Requirement: Filtros avanzados combinables
La búsqueda SHALL exponer filtros combinables: rango de precio, superficie, habitaciones, baños, tipología, estado, servicer (multi-select), y texto libre, todos reflejados en URL para deep-linking y back/forward.

#### Scenario: URL compartible con filtros
- **WHEN** el usuario filtra por `priceMax=100000&servicer=aliseda,haya` y copia la URL
- **THEN** al abrirla otro usuario ve idénticos filtros y resultados aplicados

#### Scenario: Filtro sin resultados
- **WHEN** la combinación de filtros no devuelve inmuebles
- **THEN** el mapa muestra mensaje “Sin resultados en esta zona” y sugerencia de ampliar bbox o relajar filtros

### Requirement: Query por bounding-box eficiente
El backend SHALL resolver queries `bbox` usando índice geoespacial (GIST) y responder en <300ms p95 para hasta 50 resultados por página, incluso con 100k+ propiedades indexadas.

#### Scenario: Bbox de ciudad
- **WHEN** el frontend pide `bbox` de Valencia capital con `pageSize=50`
- **THEN** el backend devuelve solo inmuebles dentro de ese rectángulo con paginación y `total`

### Requirement: Vista lista/mapa responsive
El layout SHALL ser responsive: desktop con split mapa/listado (50/50 resizable), móvil con toggle Mapa ↔ Lista y bottom sheet para filtros.

#### Scenario: Móvil toggle
- **WHEN** el usuario en móvil pulsa “Ver mapa”
- **THEN** el listado se oculta y el mapa ocupa toda la pantalla con barra de filtros colapsable
