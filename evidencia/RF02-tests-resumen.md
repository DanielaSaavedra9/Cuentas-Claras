# RF02 — Evidencia de pruebas automatizadas

Fecha: 2026-08-14
Comando: `npm test`

## Resultado
- Total de suites: 9 (6 de RF01 + 3 nuevas de RF02)
- Total de tests: 56 (29 de RF01 + 27 nuevas de RF02)
- Pasaron: 56
- Fallaron: 0

## Cobertura (nuevos tests de RF02)
- Schema zod del formulario de movimiento (`components/__tests__/movimiento-form.schema.test.ts`) — 14 tests: rechaza monto ≤ 0/vacío, categoría vacía, descripción vacía, fecha vacía/inválida, gasto compartido con menos de 2 personas, gasto previsible sin fecha límite; acepta datos válidos de ingreso y de gasto (simple, compartido, previsible)
- `services/movimientos.ts` con Firestore mockeado (`services/__tests__/movimientos.test.ts`) — 12 tests: `crearMovimiento` (estructura correcta, `generadoAutomaticamente` en ingresos, `numeroPersonas` en compartidos, `previsible.fechaLimite` en previsibles, compartido/esPrevisible forzados a `false` en ingresos), `obtenerMovimiento` (null si no existe, mapeo correcto si existe), `actualizarMovimiento` (actualiza sin crear, limpia campos con `deleteField()` al desactivar un toggle), `eliminarMovimiento` (borra por id)
- Integración crear → editar → eliminar (`services/__tests__/movimientos.integration.test.ts`) — 1 test: con un mock de Firestore en memoria, crea un movimiento, confirma que aparece con la estructura correcta, lo edita y confirma la actualización, lo elimina y confirma que ya no existe

## Fuera de alcance a propósito
- Reglas de Firestore (Bloque 0) sin test de emulador — mismo criterio que RF01, se reserva testing profundo (unitario/integración/E2E) para RF05.
- No se testeó el render de los componentes React (`app/movimiento-nuevo.tsx`, `app/movimiento-detalle.tsx`, `app/movimientos-lista.tsx`) — mismo criterio que RF01, solo se automatizó schema y lógica de servicios.
