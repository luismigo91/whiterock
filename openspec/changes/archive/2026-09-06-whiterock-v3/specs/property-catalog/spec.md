## ADDED Requirements

### Requirement: Filtro y sort por pricePerM2
El sistema SHALL calcular `pricePerM2 = price / areaM2` cuando `areaM2` existe y exponer query `pricePerM2Min`, `pricePerM2Max` y `sort=pricePerM2Asc|pricePerM2Desc` en `GET /api/properties`; sin `areaM2` SHALL excluir del filtro (no error).

#### Scenario: Filtrar gangas por m2
- **WHEN** `GET /api/properties?pricePerM2Max=1000`
- **THEN** solo devuelve pisos con `price/areaM2 <=1000`

#### Scenario: Sort por m2
- **WHEN** `GET /api/properties?sort=pricePerM2Asc`
- **THEN** el primero tiene menor `pricePerM2` que el segundo

### Requirement: Campo derivado pricePerM2 en respuesta
Cada `Property` en listado/ficha SHALL incluir `pricePerM2` (number | null) calculado al vuelo.

#### Scenario: Property con area null
- **WHEN** una propiedad tiene `areaM2=null`
- **THEN** `pricePerM2` es `null` y no rompe UI
