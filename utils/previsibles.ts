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

// Umbral de "próximo a vencer" (fix RF05,
// .claude/fix-rf05-color-gasto-vencido.md): 3 meses o menos hasta la
// fecha límite, decidido con la usuaria. Constante aparte para no dejar
// un "3" mágico suelto en el cuerpo de la función.
const UMBRAL_PROXIMO_A_VENCER_MESES = 3;

// Estado visual del gasto previsible: "vencido" si ya pasó la fecha
// límite con saldo pendiente; "proximoAVencer" si no está vencido, queda
// saldo pendiente, y faltan `UMBRAL_PROXIMO_A_VENCER_MESES` meses o
// menos; "normal" el resto de los casos (sin indicador) — incluido un
// previsible ya pagado por completo, sin importar qué tan cerca esté la
// fecha límite (el color depende de saldo pendiente + proximidad, no
// solo de la fecha).
export function estadoPrevisible(
  fechaActual: Date,
  fechaLimite: string,
  montoAbonado: number,
  montoTotal: number,
): EstadoPrevisible {
  if (estaAtrasado(fechaActual, fechaLimite, montoAbonado, montoTotal)) {
    return "vencido";
  }
  const saldoPendiente = montoAbonado < montoTotal;
  if (
    saldoPendiente &&
    mesesRestantes(fechaActual, fechaLimite) <= UMBRAL_PROXIMO_A_VENCER_MESES
  ) {
    return "proximoAVencer";
  }
  return "normal";
}

// "2026-07-15" -> "15-07-2026", solo para mostrar en pantalla.
export function formatFechaCorta(fecha: string): string {
  const [anio, mes, dia] = fecha.split("-");
  return `${dia}-${mes}-${anio}`;
}

// Fix RF05 (.claude/fix-rf05-listado-previsibles.md): la tarjeta "Gastos
// previsibles próximos" del Home usaba este mismo filtro+orden seguido
// de un `.slice(0, 3)` que dejaba ocultos los previsibles a partir del
// 4º — no hay ninguna otra pantalla que liste "todos los previsibles",
// así que esa tarjeta ES el listado completo y no debía estar acotada.
// Se extrae acá (antes vivía inline en app/(tabs)/index.tsx) para poder
// testear el filtro+orden sin renderizar el componente. Firma genérica
// (no importa `Movimiento` de services/) para no crear una dependencia
// circular utils↔services — services/movimientos.ts ya importa de acá.
export function previsiblesPendientesOrdenados<
  T extends {
    esPrevisible?: boolean;
    previsibleFechaLimite?: string;
    previsibleMontoAbonado?: number;
    monto: number;
  },
>(movimientos: T[]): T[] {
  return movimientos
    .filter(
      (m) =>
        m.esPrevisible &&
        m.previsibleFechaLimite &&
        (m.previsibleMontoAbonado ?? 0) < m.monto,
    )
    .sort((a, b) =>
      a.previsibleFechaLimite!.localeCompare(b.previsibleFechaLimite!),
    );
}
