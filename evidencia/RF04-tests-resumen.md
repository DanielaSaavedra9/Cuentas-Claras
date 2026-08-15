# RF04 — Evidencia de pruebas automatizadas

Fecha: 2026-08-15
Comando: `npm test`

## Resultado
- Total de suites: 11 (todas las de RF01/RF02/RF03, sin suites nuevas — se ampliaron archivos existentes)
- Total de tests: 80 (73 previos + 7 nuevos de RF04)
- Pasaron: 80
- Fallaron: 0

## Cobertura (nuevos tests de RF04)
- Schema zod del formulario — ya cubierto en RF02 (`components/__tests__/movimiento-form.schema.test.ts`, tests "rechaza gasto compartido con menos de 2 personas" / "acepta gasto compartido con 2 o más personas"). No se duplicó.
- `utils/__tests__/balance.test.ts` (`utils/balance.ts`) — 4 tests nuevos:
  - `calcularBalance` resta solo la porción proporcional de un gasto compartido
  - `calcularBalance` con mezcla de gastos compartidos y no compartidos en el mismo mes
  - `montoEfectivo`: monto total si no es compartido, dividido entre `numeroPersonas` si es compartido, ignora el flag en ingresos, y monto total si `compartido: true` pero falta `numeroPersonas`
- Integración con Firestore mockeado en memoria (`utils/__tests__/balance.integration.test.ts`) — 1 test nuevo: crear un gasto de $10.000 compartido entre 2 → el balance del mes resta $5.000, no $10.000. Se agregó `__resetStore()` al mock para aislar este test del de RF03 en el mismo archivo (compartían el store en memoria).

## Fuera de alcance a propósito
- No se testeó el formato de montos en pantalla (`formatCLP`) — es un detalle de presentación, documentado como convención en `PROJECT_CONTEXT.md`, no lógica de negocio.
- No se testeó el render de `app/(tabs)/index.tsx` ni `app/movimientos-lista.tsx` — mismo criterio que RF01/RF02/RF03, solo se automatiza lógica de servicios y cálculo.
