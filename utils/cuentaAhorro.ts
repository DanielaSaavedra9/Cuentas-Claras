// RF08 — Simulador de cuenta de ahorro remunerada. Funciones puras (sin
// dependencias de Firebase), ver .claude/rf08-checklist.md, "Regla de
// negocio central".

// A diferencia de tipConsumo (RF07, nominal anual → se divide entre 12),
// las tasas de cuentaAhorro y cuentaRemunerada ya vienen como tasa ANUAL
// EFECTIVA. La conversión a mensual es la raíz 12, NO dividir entre 12:
//   i = (1 + tasaAnual/100)^(1/12) − 1
export function calcularTasaMensualEfectiva(tasaAnual: number): number {
  return Math.pow(1 + tasaAnual / 100, 1 / 12) - 1;
}

// Convención de aporte: anualidad ANTICIPADA — el aporte de cada mes gana
// interés ese mismo mes (decisión cerrada, ver checklist). Con tasa 0% la
// fórmula tiene un 0/0 (división por i), así que ese caso se resuelve
// aparte: capital más aportes, sin interés.
export function calcularSaldoFinal(
  ahorroInicial: number,
  aporteMensual: number,
  tasaAnual: number,
  meses: number,
): number {
  const i = calcularTasaMensualEfectiva(tasaAnual);
  if (i === 0) return ahorroInicial + aporteMensual * meses;

  const factor = Math.pow(1 + i, meses);
  return ahorroInicial * factor + (aporteMensual * (1 + i) * (factor - 1)) / i;
}

export function calcularTotalAportado(
  ahorroInicial: number,
  aporteMensual: number,
  meses: number,
): number {
  return ahorroInicial + aporteMensual * meses;
}

export function calcularInteresGanado(
  saldoFinal: number,
  totalAportado: number,
): number {
  return saldoFinal - totalAportado;
}

// Comparación cuenta de ahorro vs. cuenta remunerada: ambos saldos
// finales se calculan con la misma función pura (dos llamadas con la
// misma plata y plazo, distinta tasa). Acá solo se contrastan los dos
// resultados para la frase comparativa de la pantalla.
export type ComparacionRendimiento = {
  diferencia: number;
  mejor: "ahorro" | "remunerada" | "iguales";
};

export function compararRendimiento(
  saldoFinalAhorro: number,
  saldoFinalRemunerada: number,
): ComparacionRendimiento {
  const diferencia = Math.abs(saldoFinalRemunerada - saldoFinalAhorro);
  if (saldoFinalRemunerada > saldoFinalAhorro) return { diferencia, mejor: "remunerada" };
  if (saldoFinalAhorro > saldoFinalRemunerada) return { diferencia, mejor: "ahorro" };
  return { diferencia, mejor: "iguales" };
}
