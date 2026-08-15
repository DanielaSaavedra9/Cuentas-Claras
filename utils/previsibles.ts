// Funciones puras del flujo de gastos previsibles (RF05). Reciben la
// fecha actual como parámetro (nunca `new Date()` interno) para que los
// cálculos sean deterministas y testeables.

// Meses restantes entre `fechaActual` y `fechaLimite` (YYYY-MM-DD),
// contando por mes calendario, no por días. Mínimo 1 — si la fecha
// límite cae dentro del mes en curso (o ya pasó), igual se considera
// "este mes" para efectos de la cuota, no división por 0 ni negativos.
export function mesesRestantes(fechaActual: Date, fechaLimite: string): number {
  const [anioLimite, mesLimite] = fechaLimite.split("-").map(Number);
  const anioActual = fechaActual.getFullYear();
  const mesActual = fechaActual.getMonth() + 1;

  const diferencia = (anioLimite - anioActual) * 12 + (mesLimite - mesActual);
  return Math.max(diferencia, 1);
}

// Cuota sugerida = saldo pendiente ÷ meses restantes. Se recalcula cada
// vez que se llama (no depende de si hubo abonos en meses anteriores,
// solo del saldo pendiente actual).
export function calcularCuotaSugerida(
  saldoPendiente: number,
  fechaLimite: string,
  fechaActual: Date,
): number {
  if (saldoPendiente <= 0) return 0;
  return saldoPendiente / mesesRestantes(fechaActual, fechaLimite);
}

// Diferencia entre lo abonado y la cuota sugerida vigente en el
// período — positivo si abonó de más, negativo si abonó de menos.
export function calcularDiferenciaSugerido(
  montoAbonado: number,
  cuotaSugerida: number,
): number {
  return montoAbonado - cuotaSugerida;
}

// Atrasado: la fecha actual ya alcanzó o pasó la fecha límite y todavía
// queda saldo por pagar. Un gasto vencido pero ya completado no cuenta
// como atrasado.
export function estaAtrasado(
  fechaActual: Date,
  fechaLimite: string,
  montoAbonado: number,
  montoTotal: number,
): boolean {
  const [anioLimite, mesLimite, diaLimite] = fechaLimite.split("-").map(Number);
  const limite = new Date(anioLimite, mesLimite - 1, diaLimite);
  return fechaActual >= limite && montoAbonado < montoTotal;
}

export type EstadoPrevisible = "vencido" | "proximoAVencer" | "normal";

// Estado visual del gasto previsible: "vencido" si ya pasó la fecha
// límite con saldo pendiente; "proximoAVencer" si no está vencido pero
// queda un mes o menos (mesesRestantes tiene piso 1, así que esto cubre
// "vence este mes"); "normal" el resto de los casos (sin indicador).
export function estadoPrevisible(
  fechaActual: Date,
  fechaLimite: string,
  montoAbonado: number,
  montoTotal: number,
): EstadoPrevisible {
  if (estaAtrasado(fechaActual, fechaLimite, montoAbonado, montoTotal)) {
    return "vencido";
  }
  if (mesesRestantes(fechaActual, fechaLimite) <= 1) {
    return "proximoAVencer";
  }
  return "normal";
}

// "2026-07-15" -> "15-07-2026", solo para mostrar en pantalla.
export function formatFechaCorta(fecha: string): string {
  const [anio, mes, dia] = fecha.split("-");
  return `${dia}-${mes}-${anio}`;
}
