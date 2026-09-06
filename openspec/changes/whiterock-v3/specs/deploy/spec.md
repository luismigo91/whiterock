## MODIFIED Requirements

### Requirement: Compose con mailpit
El compose SHALL añadir servicio `mailpit` y documentar en README cómo ver mails en `http://localhost:8025`.

#### Scenario: Docs SMTP
- **WHEN** un dev lee README sección Deploy
- **THEN** ve instrucción `SMTP_HOST=mailpit` y `http://localhost:8025` para magic link
