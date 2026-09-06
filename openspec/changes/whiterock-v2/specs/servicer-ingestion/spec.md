## MODIFIED Requirements

### Requirement: Adapter por servicer desacoplado
El sistema SHALL proveer un `ServicerAdapter` por cada fuente (ej. `AlisedaAdapter`, `ServihabitatAdapter`) que exponga interfaz común `fetchListings() → RawListing[]` y `fetchDetail(id)`, aislando scraping/API específico. En v2 los adapters de Aliseda/Servihabitat SHALL usar scraping real (Cheerio sobre HTML o Playwright cuando JS-heavy), Haya/Altamira/Solvia SHALL intentar API JSON primero y fallback a HTML; todos SHALL incluir snapshot HTML/JSON para tests de contrato que fallan si cambia DOM.

#### Scenario: Añadir nuevo servicer sin tocar otros
- **WHEN** se registra un nuevo adapter implementando la interfaz común
- **THEN** el orquestador lo detecta y lo ejecuta sin modificar adapters existentes

#### Scenario: Fallo aislado de un servicer
- **WHEN** un adapter falla (timeout, 403, cambio de DOM)
- **THEN** el sistema registra el error con servicer + timestamp y continúa con los demás, marcando el job como `partial_failure`

#### Scenario: Snapshot detecta cambio de DOM
- **WHEN** el HTML de Aliseda cambia y el selector `price` ya no matchea
- **THEN** el test de contrato falla y el adapter cae en `partial_failure` sin romper otras fuentes

### Requirement: Orquestación programada y reintentable
El sistema SHALL ejecutar ingestas completas diarias y parciales cada 6h mediante jobs en cola, con reintentos exponenciales (3 intentos) y dead-letter queue. En v2 el scheduler SHALL producir métrica `ingested==0` como alerta y exponer WAF detection (403/captcha) con pausa automática del servicer.

#### Scenario: Ingesta diaria completa
- **WHEN** el cron diario dispara a las 03:00 Europe/Madrid
- **THEN** se encolan jobs por servicer y se procesan en paralelo con límite de concurrencia

#### Scenario: Reintento tras 429
- **WHEN** un adapter recibe 429 Too Many Requests
- **THEN** el job se reencola con backoff y respeta el header `Retry-After` si existe

#### Scenario: WAF pausa automática
- **WHEN** un adapter recibe 403 con body que contiene captcha
- **THEN** marca el servicer como `enabled=false` temporal y alerta vía `observability`

## ADDED Requirements

### Requirement: Scraping real con Playwright bajo demanda
El sistema SHALL intentar Cheerio primero; si el listado requiere JS (0 resultados o selector vacío), SHALL reintentar con Playwright headless con headers realistas y timeout 15s, registrando el modo usado en `IngestJob`.

#### Scenario: Fallback a Playwright
- **WHEN** Cheerio no extrae listings pero Playwright sí
- **THEN** el adapter persiste los listings y marca `usedPlaywright=true` en el job
