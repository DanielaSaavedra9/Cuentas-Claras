# Fix RF02 — Formato de peso chileno en el formulario de gasto (evidencia)

Fecha: 2026-09-08
Checklist: `.claude/fix-rf02-formato-peso-chileno.md`
Comando: ver `evidencia/fix-formato-peso-rf02-output.txt` (`npm test`)

## Qué se implementó

### `utils/formatoMoneda.ts` (nueva, genérica — no acoplada al formulario de gasto)
- `formatearPesoChileno(valor: number): string` — separador de miles chileno vía `toLocaleString("es-CL")` (mismo criterio que el resto del proyecto, donde cada pantalla ya define su propio `formatCLP` así). `NaN`/`Infinity` → `""`, no `"NaN"`.
- `parsearPesoChileno(texto: string): number` — inversa; quita todo lo que no sea dígito. **Decisión de diseño:** a diferencia de `Number("")` (que en JS da `0`), un texto sin ningún dígito devuelve `NaN` a propósito — "sin dígitos" es "sin valor todavía", no "cero". Esto hace que el caso límite del checklist ("campo vacío no debe romper ni mostrar NaN/$.") se resuelva solo por composición (`formatearPesoChileno(parsearPesoChileno(""))` = `""`), sin necesitar un caso especial en cada pantalla que la use.
- `calcularPosicionCursor(textoAnterior, cursorAnterior, textoNuevo): number` — no estaba pedida explícitamente por nombre en el checklist, pero hacía falta para resolver el punto "verificar que el cursor no salte de forma rara al escribir en medio del número": preserva la cantidad de **dígitos** (no de caracteres) a la derecha del cursor, que es estable frente a separadores de miles que aparecen o desaparecen a la izquierda.

### `components/movimiento-form.tsx`
- Nuevo `MontoInput` (reemplaza el `TextInput` inline del campo de monto): muestra el valor con separador de miles mientras se escribe (`mostrarMonto = formatearPesoChileno(parsearPesoChileno(digitosCrudos))`), con `selection` controlado para que el cursor no salte al reformatear.
- **El valor que guarda React Hook Form no cambió** — sigue siendo el string de dígitos crudos de siempre (`onChange(digitos)`, mismo `.replace(/[^0-9]/g, "")` que ya existía). Solo cambió qué se **muestra** en el `TextInput`, no qué se valida ni qué se envía a Firestore — por eso la validación existente (`monto > 0`, numérico) sigue funcionando exactamente igual, sin tocar `movimientoSchema`.
- Se mantuvieron `selectionColor`/`cursorColor` (color según ingreso/gasto) que tenía el campo original.

## Resultado
- Total de suites: 18 (17 previas + 1 nueva: `utils/__tests__/formatoMoneda.test.ts`)
- Total de tests: 179 (154 previos + 25 nuevos)
- Pasaron: 179, fallaron: 0
- Cobertura de `utils/formatoMoneda.ts`: **100%** statements/branch/functions/lines
- `tsc --noEmit` limpio · `eslint` 0 errores en los 3 archivos nuevos/tocados (7 warnings preexistentes sin cambios)
- `components/__tests__/movimiento-form.schema.test.ts` (16 tests, validación de `movimientoSchema`) sigue en verde sin modificaciones — confirma que la validación sobre el valor parseado no se rompió

## Unitario (`utils/__tests__/formatoMoneda.test.ts`)
- `formatearPesoChileno`: separador de miles (1.000, 1.000.000), cero, un dígito, redondeo de decimales, `NaN`/`Infinity` → `""`
- `parsearPesoChileno`: quita separadores, campo vacío → `NaN` (no `0`), texto sin dígitos → `NaN`, ignora caracteres no numéricos
- Ida y vuelta: `parsearPesoChileno(formatearPesoChileno(n)) === n` para 0, 5, 1000, 1500, 999999, 1000000, 123456789; y el caso límite del campo vacío se mantiene vacío en el round-trip completo
- `calcularPosicionCursor`: escribir/borrar al final (cursor se mantiene al final), insertar/borrar un dígito en medio del número (preserva los dígitos a la derecha del cursor), campo completamente vacío

## Fuera de alcance a propósito
- No se tocó el simulador de crédito de consumo (RF07) — el checklist dice explícitamente que lo reutiliza "en un trabajo aparte". Tampoco se tocó `simulador-ahorro.tsx`, que ya tenía su propio formateador ad hoc (`formatMiles`, del trabajo de RF08) — migrarlo a esta utilidad compartida queda para cuando se aborde RF07, no en este fix.
- No se testeó el render de `MontoInput` ni la integración visual del cursor — mismo criterio que todo el proyecto (RF01-RF08): solo se automatiza lógica pura, no render de componentes. La verificación del comportamiento del cursor en pantalla real queda para la usuaria en dispositivo.

## Pendiente de la usuaria (verificación en dispositivo)
- Escribir un monto y confirmar que se ve con el separador de miles en tiempo real (ej. escribir "1000" y ver "1.000").
- Borrar el monto completo y confirmar que el campo queda vacío (no "$0" ni "NaN").
- Editar un movimiento existente (`app/movimiento-detalle.tsx`) con un monto ya cargado, y tocar en medio del número para insertar/borrar un dígito — confirmar que el cursor no salta a un lugar inesperado.
