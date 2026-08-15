import { Movimiento } from "@/services/movimientos";

export type Balance = {
  neto: number;
  ingresos: number;
  gastos: number;
};

export function calcularBalance(movimientos: Movimiento[]): Balance {
  const balance = movimientos.reduce(
    (acc, m) => {
      if (m.tipo === "ingreso") {
        acc.ingresos += m.monto;
      } else {
        acc.gastos += m.monto;
      }
      return acc;
    },
    { ingresos: 0, gastos: 0 },
  );
  return { ...balance, neto: balance.ingresos - balance.gastos };
}

export function filtrarPorMes(
  movimientos: Movimiento[],
  anio: number,
  mes: number,
): Movimiento[] {
  const prefijo = `${anio}-${String(mes).padStart(2, "0")}`;
  return movimientos.filter((m) => m.fecha.startsWith(prefijo));
}

export function puedeNavegarAMes(
  anio: number,
  mes: number,
  hoy: Date = new Date(),
): boolean {
  const anioActual = hoy.getFullYear();
  const mesActual = hoy.getMonth() + 1;
  if (anio !== anioActual) return anio < anioActual;
  return mes <= mesActual;
}

export type MesAnio = { anio: number; mes: number };

export function mesAnterior({ anio, mes }: MesAnio): MesAnio {
  return mes === 1 ? { anio: anio - 1, mes: 12 } : { anio, mes: mes - 1 };
}

export function mesSiguiente({ anio, mes }: MesAnio): MesAnio {
  return mes === 12 ? { anio: anio + 1, mes: 1 } : { anio, mes: mes + 1 };
}

// Ventana de N meses terminando en `mesFinal` (inclusive), del más antiguo
// al más reciente — usada para la tendencia del gráfico de gastos.
export function ultimosNMeses(mesFinal: MesAnio, n: number): MesAnio[] {
  const meses: MesAnio[] = [];
  let actual = mesFinal;
  for (let i = 0; i < n; i++) {
    meses.unshift(actual);
    actual = mesAnterior(actual);
  }
  return meses;
}
