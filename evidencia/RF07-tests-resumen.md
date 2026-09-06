# RF07 — Evidencia de pruebas automatizadas (Bloque 5)

Fecha: 2026-08-15
Comando: `npm test` (output) / `npx jest --coverage --collectCoverageFrom='utils/creditoConsumo.ts' --collectCoverageFrom='services/escenarios.ts'` (coverage)

Mismo criterio que RF01-RF04 (no RF05): todo automatizado, Firestore mockeado donde aplica.

## Resultado
- Total de suites: 15 (13 previas de RF01-RF05 + 2 nuevas de RF07)
- Total de tests: 124 (108 previos + 16 nuevos de RF07 Bloque 5)
- Pasaron: 124
- Fallaron: 0
- Cobertura de `utils/creditoConsumo.ts`: 100% statements/branch/funcs/lines
- Cobertura de `services/escenarios.ts`: 100% statements/funcs/lines, 50% branch (línea 72 sin cubrir — el fallback `?? 0` de `fechaGuardadoMillis` para el caso en que `fechaGuardado` no resuelva `toMillis`, no se fuerza este caso porque el mock de `serverTimestamp` siempre devuelve un valor válido, igual que en `previsibles.integration.test.ts`)

## Unitario (`utils/__tests__/creditoConsumo.test.ts`)
- `calcularTasaMensual` — conversión anual→mensual, tasa 0% — 2 tests
- `calcularCuotaMensual` — crédito típico ($10.000.000/12 meses/23,98%), plazo de 1 mes, tasa 0% (caso límite, evita división por cero), monto muy alto (escala proporcional) — 4 tests
- `calcularImpuestos` — 0,8% flat, monto 0 — 2 tests
- `calcularCTC` — caso de referencia de `.claude/prompt-fix-ctc.md` ($10.000.000/12 meses/23,98% → CTC $11.425.990), impuestos 0 — 2 tests
- `calcularCAE` — crédito típico (26,8% efectiva desde 23,98% nominal), tasa 0%, comparación contra cálculo manual de referencia con tasa mensual constante (2% mensual → 24% nominal) — 3 tests

## Integración con Firestore mockeado en memoria (`services/__tests__/escenarios.integration.test.ts`)
- Guardar un escenario → documento creado en `escenariosGuardados` con `parametros` y `resultado` exactamente como se enviaron
- Listar escenarios → devueltos ordenados por fecha de guardado descendente (el mock usa un reloj incremental determinístico en vez de `Date.now()`, para que el orden no dependa de la resolución real del reloj del sistema)
- Eliminar un escenario → removido de la lista devuelta por `listarEscenariosGuardados`
- El mock distingue colecciones por ruta completa (incluye el uid), a diferencia del mock de `movimientos.integration.test.ts` que solo prueba con un uid — acá hacía falta para no mezclar escenarios de distintos usuarios entre tests

## Fuera de alcance a propósito
- No se testeó el render de `app/simulador-credito.tsx` (`EscenarioCard`/`GuardadoCard`) — mismo criterio que RF01-RF04/RF05 Niveles 1-2, solo se automatiza lógica de servicios y cálculo puro.
- No se testeó `scripts/actualizar-tasa-consumo.mjs` (Bloque 0) — es un script standalone fuera del bundle de la app, ya verificado manualmente con una corrida real (documentado en Bloque 0 del checklist).
