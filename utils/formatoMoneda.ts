// Fix RF02 (.claude/fix-rf02-formato-peso-chileno.md) — formato de peso
// chileno en campos de monto. Funciones puras, sin dependencias de React
// ni de Firebase (mismo criterio que utils/balance.ts / utils/creditoConsumo.ts).
// Utilidad genérica, no acoplada al formulario de gasto: el simulador de
// crédito de consumo (RF07) la reutiliza en un trabajo aparte.

// Formatea un monto con separador de miles chileno (punto), sin
// decimales — los montos de este proyecto son siempre pesos enteros.
// Usa Intl vía toLocaleString('es-CL'), mismo criterio que el resto del
// proyecto (formatCLP se repite así en cada pantalla). NaN o cualquier
// valor no finito (ver parsearPesoChileno, caso "sin dígitos") devuelve
// "" — un campo vacío se ve vacío, no "NaN".
export function formatearPesoChileno(valor: number): string {
  if (!Number.isFinite(valor)) return "";
  return Math.round(valor).toLocaleString("es-CL");
}

// Inversa: recibe el texto que el usuario ve/escribe (con puntos u otros
// caracteres) y devuelve el número limpio, para guardar en Firestore y
// para los cálculos. Sin dígitos (campo vacío, o solo caracteres no
// numéricos) devuelve NaN a propósito — a diferencia de `Number("")`
// (que da 0 en JS), acá "sin dígitos" no es lo mismo que "cero": es
// "sin valor todavía". Esto hace que el round-trip
// `formatearPesoChileno(parsearPesoChileno(""))` dé "" en vez de "0",
// sin necesitar un caso especial aparte en cada pantalla que lo usa.
export function parsearPesoChileno(texto: string): number {
  const soloDigitos = texto.replace(/[^0-9]/g, "");
  return soloDigitos === "" ? NaN : Number(soloDigitos);
}

// Al reformatear en cada tecla, el cursor no puede quedarse fijo en el
// mismo índice de caracter — los puntos de separador de miles se corren
// a la izquierda o la derecha según cuántos dígitos haya. Se preserva la
// cantidad de DÍGITOS a la derecha del cursor (no de caracteres), que es
// estable frente a separadores que aparecen o desaparecen antes del
// cursor. Devuelve la nueva posición de cursor sobre `textoNuevo`.
export function calcularPosicionCursor(
  textoAnterior: string,
  cursorAnterior: number,
  textoNuevo: string,
): number {
  const digitosDespues = textoAnterior
    .slice(cursorAnterior)
    .replace(/[^0-9]/g, "").length;

  let digitosVistos = 0;
  for (let i = textoNuevo.length; i >= 0; i--) {
    if (digitosVistos === digitosDespues) return i;
    if (/[0-9]/.test(textoNuevo[i - 1])) digitosVistos++;
  }
  return 0;
}
