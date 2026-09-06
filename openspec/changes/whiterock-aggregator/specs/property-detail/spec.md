## Purpose

Presentar una ficha unificada y completa por inmueble que normalice todas las características de cualquier servicer, con galería, atributos, mapa de detalle y atribución clara al origen.

## ADDED Requirements

### Requirement: Ficha unificada con atributos normalizados
La vista `GET /properties/:id` SHALL mostrar: precio, m², habitaciones, baños, tipología, estado, año, cert. energético, dirección normalizada, provincia/municipio, descripción, y metadatos (fecha actualización, referencia original, servicer).

#### Scenario: Ficha completa
- **WHEN** el usuario abre un piso con todos los datos disponibles
- **THEN** ve todos los atributos organizados en secciones “Características”, “Ubicación”, “Descripción”

#### Scenario: Atributos faltantes
- **WHEN** la propiedad no tiene `yearBuilt` o `energyCert`
- **THEN** esos campos muestran “No disponible” sin romper el layout

### Requirement: Galería de fotos con fallback
La ficha SHALL mostrar galería con todas las `photos[]`; si no hay fotos, muestra placeholder; al click abre lightbox con navegación.

#### Scenario: Galería con múltiples fotos
- **WHEN** una propiedad tiene 12 fotos
- **THEN** la ficha muestra carrusel + thumbnails y lightbox al ampliar

#### Scenario: Sin fotos
- **WHEN** una propiedad no tiene fotos
- **THEN** se muestra placeholder “Sin imágenes” y no se rompe la galería

### Requirement: Mapa de detalle y entorno
La ficha SHALL incluir mini-mapa centrado en `lat/lng` con pin único y, si `approximateLocation=true`, aviso “Ubicación aproximada”.

#### Scenario: Ubicación exacta
- **WHEN** la propiedad tiene `geocodeConfidence: high`
- **THEN** el mini-mapa muestra pin preciso sin aviso

#### Scenario: Ubicación aproximada
- **WHEN** la propiedad tiene `approximateLocation: true`
- **THEN** el mini-mapa muestra área sombreada y mensaje de aproximación

### Requirement: Atribución y enlace a origen
La ficha SHALL mostrar badge del servicer (logo + nombre) y botón “Ver en {Servicer}” que abre `sourceUrl` en nueva pestaña, además de `lastSeenAt` (“Actualizado hace 2 horas”).

#### Scenario: Enlace a origen
- **WHEN** el usuario pulsa “Ver en Aliseda”
- **THEN** se abre `sourceUrl` en nueva pestaña y se registra evento de click saliente

### Requirement: Compartir y SEO básico
La ficha SHALL tener URL canónica `/properties/:id/:slug` con meta tags OG (título, precio, foto principal) y botón de compartir/copy-link.

#### Scenario: Compartir link
- **WHEN** el usuario copia el link de la ficha
- **THEN** al pegarlo en WhatsApp se ve preview con foto y precio gracias a OG tags
