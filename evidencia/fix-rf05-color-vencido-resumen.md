# Fix RF05 — Color de gasto previsible próximo a vencer vs. vencido (evidencia)

Fecha: 2026-09-10
Checklist: `.claude/fix-rf05-color-gasto-vencido.md`
Comando: ver `evidencia/fix-rf05-color-vencido-output.txt` (`npm test`)

## Umbral confirmado por la usuaria
**3 meses.** Antes de tocar código se revisó el estado real (`estadoPrevisible` ya devolvía 3 estados desde antes, ver "Qué se encontró" abajo) — el umbral quedó como una constante nombrada, `UMBRAL_PROXIMO_A_VENCER_MESES = 3`, en vez de un "3" suelto en el cuerpo de la función.

## Qué se encontró (la causa real era distinta de lo que decía el reporte del bug)

El checklist decía "hoy `estadoPrevisible` solo distingue dos casos" — **no era así**: la función ya devolvía `'al-dia' | 'proximoAVencer' | 'vencido'` desde antes (código preexistente de RF05), con el umbral en 1 mes en vez de 3. Los bugs reales, encontrados al revisar los dos call sites (`app/(tabs)/index.tsx` y `app/gasto-previsible-detalle.tsx`):

1. **El badge visual usaba el mismo color ámbar para "Vencido" y "Próximo a vencer"** — un solo estilo (`atrasadoBadge`/`atrasadoBadgeText`, fondo `#FDECC0`, texto `#B5820A`) se aplicaba sin importar el estado, cambiando solo el texto. "Vencido" nunca se veía en rojo.
2. **"Próximo a vencer" no verificaba saldo pendiente** — solo miraba `mesesRestantes(...) <= umbral`, sin chequear si el previsible ya estaba pagado por completo. Un gasto previsible saldado con fecha límite cercana se marcaba igual como "próximo a vencer" (amarillo), violando el punto del checklist "un previsible sin saldo pendiente nunca debe mostrar amarillo ni rojo".

## Cambios

### `utils/previsibles.ts`
- Umbral subido de 1 a 3 meses (`UMBRAL_PROXIMO_A_VENCER_MESES`)
- `estadoPrevisible` ahora exige `saldoPendiente` (`montoAbonado < montoTotal`) además de la proximidad para devolver `"proximoAVencer"` — antes solo `estaAtrasado` (el caso "vencido") consideraba el saldo, el caso "próximo" no

### `app/(tabs)/index.tsx` y `app/gasto-previsible-detalle.tsx`
- Nuevo estilo `atrasadoBadgeVencido`/`atrasadoBadgeTextVencido` (usa `colors.error`/`colors.errorTint`, los mismos tokens de error que ya usa el resto de la app) aplicado condicionalmente cuando `estado === "vencido"` — "próximo a vencer" se queda con el ámbar existente (`#FDECC0`/`#B5820A`), que ya era, de hecho, el color de advertencia del kit — no hizo falta inventar uno nuevo, solo dejar de aplicarlo también a "vencido"

## Resultado
- Total de suites: 20 (sin suites nuevas — los tests se agregaron al archivo ya existente `utils/__tests__/previsibles.test.ts`)
- Total de tests: 203 (199 previos + 4 nuevos)
- Pasaron: 203, fallaron: 0
- Cobertura de `utils/previsibles.ts`: 100% statements/functions/lines (una rama preexistente sin cubrir, `?? 0` en `previsiblesPendientesOrdenados`, no tocada por este fix)
- `tsc --noEmit` limpio · `npm run lint` 0 errores, 7 warnings preexistentes sin cambios

## Unitario nuevo (`utils/__tests__/previsibles.test.ts`, describe `estadoPrevisible`)
- Caso límite exacto: 3 meses restantes (el umbral) → `'proximoAVencer'`
- Caso límite exacto: 4 meses restantes (fuera del umbral) → `'normal'`
- Saldo ya pagado por completo + fecha límite dentro del umbral → `'normal'`, no `'proximoAVencer'`
- Saldo ya pagado por completo + fecha límite vencida → `'normal'`, no `'vencido'` (versión más estricta del test preexistente, que solo verificaba `.not.toBe('vencido')` y no habría detectado un `'proximoAVencer'` incorrecto)

## Fuera de alcance a propósito
- No se testeó el render de los badges (`app/(tabs)/index.tsx`, `app/gasto-previsible-detalle.tsx`) — mismo criterio que todo el proyecto: solo se automatiza lógica pura, no render de componentes.
- No se tocó el color "normal" (sin indicador) — el checklist no pedía cambiarlo.

## Pendiente de la usuaria (verificación en dispositivo)
- Confirmar que un gasto previsible que vence en 3 meses o menos (con saldo pendiente) se ve en amarillo/ámbar, tanto en la tarjeta de Home como en el detalle.
- Confirmar que un gasto vencido con saldo pendiente se ve en rojo (antes se veía ámbar, igual que "próximo a vencer").
- Confirmar que un gasto ya pagado por completo nunca se ve amarillo ni rojo, sin importar la fecha límite.
