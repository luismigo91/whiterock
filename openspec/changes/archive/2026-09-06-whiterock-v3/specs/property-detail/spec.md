## ADDED Requirements

### Requirement: Badge pricePerM2 en ficha y card
La ficha SHALL mostrar badge `pricePerM2` cuando exista (ej. `1.200 €/m²`) y la card SHALL mostrar `pricePerM2` pequeño bajo precio; si null, ocultar badge sin error.

#### Scenario: Ficha con m2
- **WHEN** propiedad tiene `areaM2=85` y `price=98500`
- **THEN** ficha muestra `1.159 €/m²`

### Requirement: Proxy de imágenes
La UI SHALL cargar fotos vía `GET /api/image?url=` que hace proxy del hotlink con cache 1h y `Cache-Control`, fallback a placeholder si el origen falla.

#### Scenario: Imagen proxificada
- **WHEN** `GET /api/image?url=https://picsum.photos/seed/wh1/800/600`
- **THEN** responde con `Content-Type: image/*` y `Cache-Control: public, max-age=86400`
