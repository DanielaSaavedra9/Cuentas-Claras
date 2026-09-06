# RF05 — Evidencia de pruebas automatizadas (Niveles 1 y 2)

Fecha: 2026-08-15
Comando: `npm test`

RF05 es el flujo diferenciador del proyecto — testing en 3 niveles (ver `.claude/rf05-checklist.md`, Bloque 6). Este documento cubre los Niveles 1 (unitario) y 2 (integración), que sí se automatizan. El Nivel 3 (sistema/E2E) se documenta aparte en `evidencia/RF05-e2e-log.md` con capturas, por decisión explícita del checklist (única excepción a "todo automatizado" del proyecto).

## Resultado
- Total de suites: 13 (12 previas de RF01-RF04 + 1 nueva de integración de previsibles)
- Total de tests: 108 (92 previos + 16 nuevos de RF05 Bloque 6)
- Pasaron: 108
- Fallaron: 0
- Cobertura de `utils/previsibles.ts`: 100% statements/branch/funcs/lines

## Nivel 1 — Unitario (`utils/__tests__/previsibles.test.ts`)
- `calcularCuotaSugerida` — meses restantes normal, 1 mes restante, mismo mes, saldo pendiente en 0 y negativo (5 tests, ya existían de RF05 Bloque 1)
- `mesesRestantes` — cruce de año, mismo mes, fecha límite mañana, un mes exacto, varios meses (5 tests, ya existían)
- `estaAtrasado` (nuevo) — vencido y sin completar (true), vencido y completado (false), vencido y sobrepagado (false), no vencido (false), vence exactamente hoy (true) — 5 tests
- `calcularDiferenciaSugerido` (nuevo) — abonó exactamente la cuota (0), de más (positiva), de menos (negativa) — 3 tests
- `estadoPrevisible` (nuevo) — vencido, vencido-pero-completado (no es "vencido"), próximo a vencer (≤1 mes), normal — 4 tests
- `formatFechaCorta` (nuevo) — conversión de formato — 1 test

## Nivel 2 — Integración con Firestore mockeado en memoria (`services/__tests__/previsibles.integration.test.ts`)
- Marcar gasto como previsible → documento creado con `previsible` inicializado correctamente (`montoAbonado: 0`, `abonosMensuales: []`, `cuotaSugerida` > 0)
- Registrar un abono → `abonosMensuales` actualizado, `montoAbonado` total correcto, `cuotaSugerida` recalculada (y menor que antes, al bajar el saldo pendiente)
- Eliminar gasto previsible → documento completo removido (incluyendo `previsible` y su historial)

## Fuera de alcance a propósito
- No se testeó el render de `app/gasto-previsible-detalle.tsx` ni la tarjeta de Home — mismo criterio que RF01-RF04, solo se automatiza lógica de servicios y cálculo puro.
