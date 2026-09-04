# RF08 — Evidencia de pruebas automatizadas (Bloque 5)

Fecha: 2026-09-03
Comando: `npm test` (output) / `npx jest --coverage --collectCoverageFrom='utils/cuentaAhorro.ts'` (coverage)

Mismo criterio que RF01-RF04 y RF07 (no RF05): todo automatizado, funciones puras sin mockear nada. RF08 no tiene guardado de escenarios (fuera de alcance por tesis 2.8.3), así que no hay pruebas de integración con Firestore para este RF.

## Resultado
- Total de suites: 16 (15 previas de RF01-RF07 + 1 nueva de RF08)
- Total de tests: 138 (124 previos + 14 nuevos de RF08 Bloque 5)
- Pasaron: 138
- Fallaron: 0
- Cobertura de `utils/cuentaAhorro.ts`: 100% statements/branch/funcs/lines

## Unitario (`utils/__tests__/cuentaAhorro.test.ts`)
- `calcularTasaMensualEfectiva` — conversión anual efectiva→mensual con la raíz 12 (NO dividiendo entre 12), identidad inversa `(1 + i)^12 = 1 + tasaAnual/100`, tasa 0% → 0 — 3 tests
- `calcularSaldoFinal` (anualidad anticipada) — caso de ejemplo del checklist ($500.000 inicial / $100.000 mes / 12 meses / 4,3% → $1.749.270,23), plazo de 1 mes `(P + A) × (1 + i)`, tasa 0% (caso límite, evita división por cero), aporte mensual en 0, monto inicial muy alto (escala proporcional en la parte del capital) — 5 tests
- `calcularTotalAportado` / `calcularInteresGanado` — total aportado sin interés, interés ganado = saldo − aportado, con tasa 0% el interés es 0 — 3 tests
- `compararRendimiento` — con dos tasas distintas identifica cuál rinde más y calcula la diferencia (positiva), caso inverso (ahorro rinde más), saldos iguales → `iguales` y diferencia 0 — 3 tests

## Fuera de alcance a propósito
- No se testeó el render de `app/(tabs)/simulador-ahorro.tsx` — mismo criterio que RF01-RF04/RF07, solo se automatiza el cálculo puro. La verificación de la pantalla (formato de miles, redseño del resumen kit "Design System-5", segmentado, precarga de tasas) se hizo en dispositivo con la usuaria.
- No se testeó el guardado de escenarios: RF08 no lo implementa (decisión de alcance, tesis 2.8.3).
- No se testearon los scripts `scripts/actualizar-tasas-banco-central.mjs` ni `scripts/actualizar-tasa-remunerada.mjs` (Bloque 0) — son scripts standalone fuera del bundle de la app, se verifican con una corrida real contra Firestore (pendiente usuaria, Bloque 0).
- La función `desglosarInteres()` y sus 5 tests se eliminaron: el rediseño del resumen del kit "Design System-5" ya no separa el interés por origen, dejó la función sin uso.
