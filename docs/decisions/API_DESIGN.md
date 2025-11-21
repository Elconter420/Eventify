# Decisiones de Diseño API - EventFlow

## Autenticación
- **Método:** JWT Tokens
- **Header:** `Authorization: Bearer <token>`
- **Duración token:** 24 horas

## Formato Fechas
- **Estándar:** ISO 8601 `"2025-12-15T20:00:00Z"`

## Respuestas de Error
```json
{
  "error": "EVENT_FULL",
  "message": "El evento ha alcanzado el límite de asistentes",
  "code": 400
}