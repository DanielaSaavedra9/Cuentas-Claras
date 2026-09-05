# Fix RF05 — Listado de gastos previsibles mostraba solo 3 (evidencia)

Fecha: 2026-09-04
Checklist: `.claude/fix-rf05-listado-previsibles.md`
Comando: `npm test`

## Causa

`app/(tabs)/index.tsx`, dentro de `SimuladorScreen`/Home: la tarjeta "Gastos previsibles próximos" armaba su lista con `.filter(...).sort(...).slice(0, 3)`. Era el **único** lugar de la app donde se listan varios previsibles a la vez — no existe una pantalla separada de "listado completo" (se revisó `movimientos-lista.tsx`, que no tiene ningún filtro por `esPrevisible`, y el resto de pantallas relacionadas: `movimiento-nuevo.tsx`, `movimiento-detalle.tsx`, `gasto-previsible-detalle.tsx` muestran un solo previsible, no una lista). Por lo tanto esta tarjeta **es** el listado que el bug reporta como incompleto, no una vista-resumen deliberadamente acotada — no aplicaba la distinción que el checklist dejaba abierta como posibilidad.

## Corrección

- Se quitó el `.slice(0, 3)`.
- El filtro (`esPrevisible`, con fecha límite, con saldo pendiente) y el orden (fecha límite ascendente) se extrajeron a una función pura nueva, `previsiblesPendientesOrdenados()` en `utils/previsibles.ts` — antes vivían inline en el componente, sin forma de testearlos sin renderizar. Firma genérica (no importa el tipo `Movimiento` de `services/movimientos.ts`) para no crear una dependencia circular utils↔services, dado que `services/movimientos.ts` ya importa de `utils/previsibles.ts`.
- `app/(tabs)/index.tsx` ahora llama a esa función; el orden de la lista (fecha límite ascendente, el mismo criterio que ya existía) no cambió.
- No se agregó ninguna pantalla ni link "Ver todos" nuevo — no hacía falta, la tarjeta pasó a mostrar la lista completa directamente.

## Resultado

- Total de suites: 17 (sin cambio — el test nuevo se agregó al archivo ya existente `utils/__tests__/previsibles.test.ts`)
- Total de tests: 154 (150 previos + 4 nuevos de este fix)
- Pasaron: 154
- Fallaron: 0
- `tsc --noEmit` limpio · `eslint` sin errores en los 3 archivos tocados

## Pruebas de regresión (`utils/__tests__/previsibles.test.ts`, describe `previsiblesPendientesOrdenados`)
- Con 5 previsibles pendientes, devuelve los 5 (no se acota a 3)
- Ordena por fecha límite ascendente (el que vence antes, primero)
- Excluye los que no son previsibles, sin fecha límite, o ya completos (`montoAbonado >= monto`)
- Con la lista vacía, devuelve `[]`

## No aplica del checklist
- "Si existe una vista resumen que sí debe limitarse a un número fijo por diseño, agregar también un test que confirme ese límite se mantiene ahí": no existe tal vista en la app (ver "Causa"), así que no hay nada que testear ahí.
- No se probó manualmente con datos reales en dispositivo (4, 5, 10+ previsibles) — **pendiente de la usuaria**.
