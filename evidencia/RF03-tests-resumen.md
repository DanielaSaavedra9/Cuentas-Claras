# RF03 — Evidencia de pruebas automatizadas

Fecha: 2026-08-15
Comando: `npm test`

## Resultado
- Total de suites: 11 (9 de RF01+RF02 + 2 nuevas de RF03)
- Total de tests: 73 (56 de RF01+RF02 + 17 nuevas de RF03)
- Pasaron: 73
- Fallaron: 0

## Cobertura (nuevos tests de RF03)
- `utils/balance.ts` (`utils/__tests__/balance.test.ts`) — 15 tests:
  - `calcularBalance`: lista vacía, solo ingresos, solo gastos, mixto
  - `filtrarPorMes`: devuelve solo el mes/año pedido, lista vacía si no hay match, no confunde el mismo mes en otro año
  - `puedeNavegarAMes`: mes en curso, mes anterior mismo año, año anterior completo, rechaza mes futuro mismo año, rechaza año futuro
  - `mesAnterior`/`mesSiguiente`: dentro del mismo año y cruzando el límite de año (diciembre↔enero)
- Integración crear → balance del mes correcto (`utils/__tests__/balance.integration.test.ts`) — 1 test: con Firestore mockeado en memoria, crea un movimiento en agosto 2026 y confirma que aparece en el cálculo de balance de agosto y no en el de julio (mes anterior)

## Fuera de alcance a propósito
- Tendencia de 6 meses del gráfico (`ultimosNMeses`) — marcado explícitamente fuera de alcance por la usuaria en `.claude/rf03-checklist.md` (mejora visual, no requerimiento de la Tabla 4).
- `escucharMovimientosDelMes` (listener en tiempo real) y `obtenerUsuario` — no forman parte de los 4 puntos que pide el Bloque 3 del checklist; se prueban indirectamente vía `listarMovimientos` + las funciones de `utils/balance.ts`.
- No se testeó el render de `app/(tabs)/index.tsx` — mismo criterio que RF01/RF02, solo se automatiza lógica de servicios y cálculo.
