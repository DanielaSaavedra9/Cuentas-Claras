# RF05 — Evidencia manual E2E (Nivel 3 del Bloque 6)

Fecha: 2026-08-15. Dispositivo real, cuenta `daniela.saavedra.santana@gmail.com`, proyecto `cuentas-claras-mvp`.

Nivel 3 se documenta manualmente por decisión explícita de `.claude/rf05-checklist.md` (única excepción a "todo automatizado" del proyecto, dado que RF05 es el flujo diferenciador de la tesis). Niveles 1 y 2 están automatizados y documentados en `RF05-tests-*`.

## Flujo probado

1. **Crear gasto previsible** ("matrícula colegio", monto $250.000, fecha límite 2027-03-15 desde el 2026-08-15) — el formulario no permitió guardar con fecha de hoy/pasada. Documento creado en Firestore con `previsible.cuotaSugerida: 35714.28571428572` ($250.000 ÷ 7 meses), `montoAbonado: 0`, `abonosMensuales: []` — verificado leyendo el documento directo en la consola de Firestore.
2. **Ver detalle con cuota inicial** — `app/gasto-previsible-detalle.tsx` mostró monto total, abonado $0, progreso 0%, cuota sugerida recalculada en pantalla (no leída del campo cacheado).
3. **Abonar** — se probaron ambos caminos: (a) marcar la casilla y guardar la cuota sugerida tal cual, y (b) activar "Editar monto a ahorrar" y guardar un monto distinto. Ambos casos quedaron registrados correctamente en `previsible.abonosMensuales` con `diferenciaSugerido` calculado.
4. **Progreso actualizado** — al reabrir el detalle después de abonar, el monto abonado y el % de progreso reflejaron el abono.
5. **Reabrir en un momento posterior y confirmar recálculo** — se editó `previsible.fechaLimite` directo en la consola de Firestore a una fecha pasada (2026-07-15) para simular el paso del tiempo sin esperar meses reales; al reabrir el detalle, la cuota sugerida se recalculó sobre el nuevo saldo pendiente.
6. **Marcar como atrasado** — con `fechaLimite` pasada y saldo pendiente (`montoAbonado < monto`), apareció el badge "Vencido" (paleta ámbar del kit) y la caja cambió a "Saldo pendiente (vencido)" mostrando el saldo completo sin dividir, tanto en la tarjeta de Home ("Gastos previsibles próximos") como en el detalle. Ver `RF05-e2e-1-home-previsibles.png`.
7. **Estados "Próximo a vencer" y estilo del badge** — se ajustó el estilo del badge (alineado a la derecha del header, paleta ámbar `#FDECC0`/`#B5820A` en vez de rojo) para calzar con el diseño de referencia — comparar `RF05-e2e-2-tarjeta-antes-fix.png` (antes) vs `RF05-e2e-3-tarjeta-referencia-diseno.png` (referencia de la usuaria, aplicada).
8. **Eliminar** — no se recapturó en este flujo porque `eliminarMovimiento` es la misma función ya verificada con captura/evidencia en RF02 Bloque 2 (editar/eliminar movimiento genérico); un gasto previsible es un movimiento más, así que compartir la función fue una decisión explícita (ver Bloque 5 del checklist de RF05) en vez de duplicar un botón "Eliminar" en la pantalla de detalle.

## Bugs encontrados y corregidos durante el flujo

- `valoresDesdeMovimiento` en `movimiento-detalle.tsx` invertía año y día de la fecha límite al editar (`.split("-").reverse()` sobre `YYYY-MM-DD`) — corregido.
- El checkbox de abono permitía registrar más de uno por mes calendario — se agregó la regla "un abono por mes", tanto en la UI (oculta el formulario y muestra "Ya registraste tu abono de este mes") como en `registrarAbono()` (rechaza si ya existe un abono para ese mes/año).
- La detección de atraso solo estaba conectada en la pantalla de detalle, no en la tarjeta de Home — corregido para que ambas pantallas usen la misma función `estadoPrevisible()`.

## Resultado

Los 6 pasos del flujo funcionaron correctamente en dispositivo real, con los 3 bugs encontrados durante la prueba corregidos y reverificados por la usuaria antes de cerrar cada bloque.
