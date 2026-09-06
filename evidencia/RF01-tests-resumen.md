# RF01 — Evidencia de pruebas automatizadas

Fecha: 2026-08-14
Comando: npm test

## Resultado
- Total de suites: 6
- Total de tests: 29
- Pasaron: 29
- Fallaron: 0

## Cobertura
- Schema zod Registro (`app/__tests__/registro.schema.test.ts`) — 8 tests
- Schema zod Login (`app/__tests__/login.schema.test.ts`) — 4 tests
- Schema zod Recuperar contraseña (`app/__tests__/recuperar-contrasena.schema.test.ts`) — 3 tests
- getAuthErrorMessage() (`utils/__tests__/authErrors.test.ts`) — 6 tests
- services/usuarios.ts, Firestore mockeado (`services/__tests__/usuarios.test.ts`) — 7 tests
- Integración registro → documento → consentimiento (`services/__tests__/registro.integration.test.ts`) — 1 test
