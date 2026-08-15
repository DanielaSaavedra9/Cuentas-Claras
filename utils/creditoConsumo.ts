// RF07 — Simulador de crédito de consumo. Funciones puras (sin
// dependencias de Firebase), ver .claude/rf07-checklist.md, "Regla de
// negocio central".

// La tasa que trae tasasReferencia/tipConsumo (y la que edita el
// usuario) es nominal anual — hay que convertirla a mensual para el
// sistema francés.
export function calcularTasaMensual(tasaAnual: number): number {
  return tasaAnual / 12 / 100;
}

// Sistema francés: cuota fija durante todo el plazo. Con tasa 0% la
// fórmula estándar da 0/0 (división por cero), así que ese caso se
// resuelve aparte: monto dividido en partes iguales, sin interés.
export function calcularCuotaMensual(
  monto: number,
  tasaAnual: number,
  plazo: number,
): number {
  const i = calcularTasaMensual(tasaAnual);
  if (i === 0) return monto / plazo;
  return (monto * i) / (1 - Math.pow(1 + i, -plazo));
}

// Simplificación de alcance para este MVP: 0.8% flat sobre el monto. No
// es el cálculo prorrateado real del impuesto de timbres y estampillas
// del SII (que varía según plazo) — documentado también en el aviso
// educativo de la pantalla del simulador.
export function calcularImpuestos(monto: number): number {
  return monto * 0.008;
}

// Costo Total del Crédito: definición estándar SERNAC/CMF — la suma de
// TODO lo que paga el cliente durante el crédito, incluyendo el
// capital, no solo lo adicional por sobre el monto original.
// ctc = (cuota × plazo) + impuestos, equivalente a
// monto + totalIntereses + impuestos.
export function calcularCTC(
  cuota: number,
  plazo: number,
  impuestos: number,
): number {
  return cuota * plazo + impuestos;
}

// Carga Anual Equivalente: tasa efectiva anual equivalente a la tasa
// mensual usada en la cuota (interés compuesto, no incluye impuestos —
// es la fórmula que pide el checklist, ver Bloque 1).
export function calcularCAE(tasaAnual: number): number {
  const i = calcularTasaMensual(tasaAnual);
  return (Math.pow(1 + i, 12) - 1) * 100;
}
