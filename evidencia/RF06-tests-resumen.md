# RF06 — Evidencia de pruebas automatizadas (Bloque 5)

Fecha: 2026-09-04
Comando: `npm test` (output) / `npx jest --coverage --collectCoverageFrom='constants/glosario.ts'` (coverage)

RF06 es contenido educativo estático de solo lectura (ver ficha ME-CE-01, Anexo F): sin colección ni documento nuevo en Firestore, sin persistencia. Se automatiza solo la lógica pura — mismo criterio que RF01-RF08 (no se testea el render de componentes).

## Resultado
- Total de suites: 17 (16 previas de RF01-RF08 + 1 nueva de RF06)
- Total de tests: 150 (138 previos + 12 nuevos de RF06 Bloque 5)
- Pasaron: 150
- Fallaron: 0
- Cobertura de `constants/glosario.ts`: 100% statements/branch/funcs/lines

## Unitario (`constants/__tests__/glosario.test.ts`)
- **Integridad del array `GLOSARIO`** — todo término tiene `id`/`termino`/`definicion` no vacíos; no hay ids repetidos; incluye los 4 términos que exige ME-CE-01 (CAE, CTC, gasto previsible, gasto compartido); cada `terminoId` usado en un tooltip contextual de una pantalla existe en el glosario (guarda contra typos que dejarían un tooltip vacío) — 4 tests
- **`buscarTermino`** — devuelve el término cuando el id existe; devuelve `undefined` cuando no — 2 tests
- **`TERMINOS_GLOSARIO_GENERAL`** — es un subconjunto no vacío de `GLOSARIO`; solo contiene términos con `enGlosarioGeneral: true`; deja fuera los que son solo tooltip contextual (`cuotaSugerida`) — 3 tests
- **`alternarTerminoAbierto`** (acordeón, un concepto expandido a la vez) — desde ninguno abierto expande el tocado; tocar el ya abierto lo colapsa; tocar otro cambia el abierto (colapsa el anterior) — 3 tests

## Fuera de alcance a propósito
- No se testeó el render de `components/tooltip-info.tsx` (abrir/cerrar el recuadro, posicionamiento, tocar fuera) ni de `app/(tabs)/aprender.tsx` (acordeón visual) — mismo criterio que RF01-RF08: el proyecto no automatiza render de componentes, solo lógica de servicios y funciones puras. La lógica del acordeón sí se testea, extraída en `alternarTerminoAbierto`. La verificación visual de tooltips y glosario se hace en dispositivo con la usuaria.
- Sin pruebas de integración con Firestore: RF06 no persiste nada.
