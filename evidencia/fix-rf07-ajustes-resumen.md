# Fix RF07 — Ajustes del simulador de crédito de consumo (evidencia)

Fecha: 2026-09-09
Checklist: `.claude/fix-rf07-simulador-ajustes.md`
Comando: ver `evidencia/fix-rf07-ajustes-output.txt` (`npm test`)

## 1. Aviso educativo pendiente (RNF03, Ley Fintech N°21.521)

Agregado en `app/(tabs)/simulador-credito.tsx`, visible desde el primer render, con el mismo estilo (`aviso`: 11px, `textSecondary`, `bodyRegular`) que ya usa el simulador de ahorro (RF08) — no se encontró un tratamiento visual distinto para este tipo de aviso en el kit de diseño, así que se reutilizó el patrón ya establecido en el proyecto en vez de improvisar uno nuevo.

**Confirmado: RF08 ya lo tenía implementado** (`app/(tabs)/simulador-ahorro.tsx`, contemplado desde el checklist original) — no se había perdido, solo faltaba en RF07.

## 2. Botón "Guardar simulación" en vez del ícono de estrella

- `EscenarioCard` (la tarjeta activa/editable, Escenario 1 y 2): el ícono de estrella se reemplazó por texto simple tappable — **"Guardar simulación"**, en el mismo lugar donde estaba la estrella (esquina superior derecha, junto al label). Ya guardado: **"Simulación guardada"** (mismo texto, cambia a color `successStrong`). Sin ícono, sin fondo — texto simple, tal como se pidió.
  - **Primer intento (revertido):** un botón de texto completo (con fondo e ícono) debajo de la caja de resultados, para no competir por espacio en el encabezado. La usuaria lo probó en dispositivo y pidió mantenerlo en la esquina original — se rehizo como texto tappable simple, que sí entra ahí junto al label y al ícono de cerrar del Escenario 2 (se restauró `cardHeaderActions` para agrupar ambos con espacio entre ellos).
- **`GuardadoCard` (la tarjeta de solo lectura en "Escenarios guardados") mantiene el ícono de estrella a propósito** — ahí no hay ambigüedad "guardar vs. no guardar" (todo lo que aparece ahí ya está guardado), la estrella solo significa "tocar para eliminar", con el mismo modal de confirmación de antes. El cambio de este fix aplica solo a `EscenarioCard`.
- Misma lógica de toggle que ya existía (`onToggleGuardar`, detección de duplicados, `Alert` si ya estaba guardado) — no se tocó, solo el disparador visual.

## 3. Formato de peso chileno en los montos del simulador

Reutiliza `utils/formatoMoneda.ts` (RF02, ya en `develop`) — no se creó una utilidad nueva, tal como pedía el checklist. Se extrajo la lógica de formateo+cursor a un **hook compartido nuevo**, `hooks/use-monto-formateado.ts`, porque ahora dos pantallas la necesitan (el formulario de gasto y este simulador) y duplicar la lógica de preservación de cursor no era buena idea:

- `components/monto-input.tsx`: se extrajo el componente `MontoInput` que antes vivía dentro de `movimiento-form.tsx` (campo grande centrado junto al "$", con medición de ancho vía `Text` invisible) — ahora usa el hook compartido y `movimiento-form.tsx` lo importa en vez de definirlo localmente. Sin cambios de comportamiento para RF02.
- `app/(tabs)/simulador-credito.tsx`: el campo "Monto" de `EscenarioCard` (usado tanto por Escenario 1 como por Escenario 2, es el mismo componente) ahora usa `useMontoFormateado()` directo sobre su `TextInput` con borde existente — acá no hacía falta el componente con medición de ancho, porque el campo ya tiene ancho fijo (ocupa todo el field) y no se corta, solo necesitaba formateo + cursor estable.
- **El monto precargado se ve formateado desde el primer render**: `monto`/`monto2` arrancan en `"1000000"` (dígitos crudos) y `useMontoFormateado` deriva `textoMostrado` directo de ese valor (`mostrarMonto("1000000")` = `"1.000.000"`), sin depender de que el usuario escriba algo primero.
- El valor que se envía a `calcularCuotaMensual`/`calcularImpuestos`/`calcularCTC`/`calcularCAE` y a `guardarEscenario` **no cambió** — sigue siendo `monto`/`monto2` (el string de dígitos crudos), el formateo es solo de presentación en el campo.

## Hallazgos en dispositivo (2026-09-09), tras la primera verificación

1. **En "Escenarios guardados" seguía apareciendo la estrella.** No era un descuido — el checklist original decía dejarla ahí a propósito (ver punto 2), pero la usuaria pidió sacarla también de `GuardadoCard`. Primera vuelta: texto "Simulación guardada" sin ícono. Segunda vuelta (más clara): el label **"Guardado" pasa a verde** (`cardLabelGuardado`, `successStrong`) y en el lugar de la estrella va un **ícono de tacho de basura** (`trash-outline`) — comunica mejor "podés eliminar esto". Sigue abriendo el mismo modal de confirmación de siempre.
2. **El teclado numérico del campo "Tasa anual (%)" solo mostraba la coma, no el punto**, en configuración regional chilena — con el filtro anterior (`t.replace(/[^0-9.]/g, "")`, solo dígitos y puntos) era literalmente imposible escribir un decimal desde el teclado del celular, porque cada coma se descartaba. Se encontró el mismo patrón en `simulador-ahorro.tsx` (`tasaAhorro`/`tasaRemunerada`) y se corrigió ahí también, aunque no se había reportado explícitamente — es el mismo bug, no una decisión de diseño.
   - Nueva utilidad `utils/entradaDecimal.ts` (`limpiarDecimal`): acepta coma o punto, normaliza a punto (`Number("23,98")` da `NaN`, el resto del código espera `"23.98"`), y descarta cualquier separador de más si el usuario escribe dos.
   - 8 tests nuevos, 100% cobertura.

## Resultado
- Total de suites: 20 (18 previas + `hooks/__tests__/use-monto-formateado.test.ts` + `utils/__tests__/entradaDecimal.test.ts`)
- Total de tests: 199 (189 previas de la rama base + 2 + 8)
- Pasaron: 199, fallaron: 0
- Cobertura de `utils/entradaDecimal.ts`: 100% stmts/branch/funcs/lines
- `tsc --noEmit` limpio · `npm run lint` 0 errores, 7 warnings preexistentes sin cambios (ninguno nuevo)

## Unitario nuevo (`hooks/__tests__/use-monto-formateado.test.ts`)
- El monto precargado del simulador de crédito (`"1000000"`) se ve formateado desde el primer render (`"1.000.000"`) — el caso que RF02 no cubría por no tener valor por defecto
- Un campo sin valor por defecto (ej. el formulario de gasto) se muestra vacío, no `"0"`
- No se repitieron los tests unitarios de `formatearPesoChileno`/`parsearPesoChileno`/`calcularPosicionCursor` — siguen cubiertos por la suite de RF02, sin cambios

## Fuera de alcance a propósito
- No se testeó el render de `EscenarioCard`, `GuardadoCard` ni el botón "Guardar simulación" — mismo criterio que todo el proyecto (RF01-RF08, RF02, menú de usuario): solo se automatiza lógica pura, no render de componentes.
- No se tocó `GuardadoCard` — el checklist preguntaba si el cambio del ícono aplicaba también ahí; se decidió que no (ver punto 2).
- No se aplicó formato de peso a los campos "Plazo" ni "Tasa anual" — no son montos en pesos, el checklist solo pedía el campo "Monto".

## Pendiente de la usuaria (verificación en dispositivo)
- Confirmar que el aviso educativo se ve bien al final de la pantalla del simulador de crédito.
- Probar el botón "Guardar simulación": guardar, ver que cambia a "Simulación guardada", tocarlo de nuevo y confirmar que se elimina (y que la tarjeta correspondiente desaparece de "Escenarios guardados").
- Confirmar que `GuardadoCard` sigue funcionando igual (estrella + confirmación al eliminar).
- Escribir un monto en el Escenario 1 y en el Escenario 2, confirmar que ambos se ven con separador de miles y que el monto precargado ($1.000.000) ya aparece formateado al abrir la pantalla.
