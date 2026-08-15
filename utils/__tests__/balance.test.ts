import { Movimiento } from "@/services/movimientos";
import {
  calcularBalance,
  filtrarPorMes,
  mesAnterior,
  mesSiguiente,
  puedeNavegarAMes,
} from "@/utils/balance";

function mov(overrides: Partial<Movimiento> = {}): Movimiento {
  return {
    id: "mov-1",
    tipo: "gasto",
    monto: 1000,
    descripcion: "Test",
    categoria: "otros",
    fecha: "2026-08-14",
    ...overrides,
  };
}

describe("calcularBalance", () => {
  it("devuelve todo en 0 con lista vacía", () => {
    expect(calcularBalance([])).toEqual({ neto: 0, ingresos: 0, gastos: 0 });
  });

  it("calcula correctamente solo con ingresos", () => {
    const movimientos = [
      mov({ tipo: "ingreso", monto: 500000 }),
      mov({ tipo: "ingreso", monto: 100000 }),
    ];
    expect(calcularBalance(movimientos)).toEqual({
      neto: 600000,
      ingresos: 600000,
      gastos: 0,
    });
  });

  it("calcula correctamente solo con gastos", () => {
    const movimientos = [
      mov({ tipo: "gasto", monto: 20000 }),
      mov({ tipo: "gasto", monto: 5000 }),
    ];
    expect(calcularBalance(movimientos)).toEqual({
      neto: -25000,
      ingresos: 0,
      gastos: 25000,
    });
  });

  it("calcula correctamente con ingresos y gastos mixtos", () => {
    const movimientos = [
      mov({ tipo: "ingreso", monto: 900000 }),
      mov({ tipo: "gasto", monto: 45200 }),
      mov({ tipo: "gasto", monto: 6300 }),
    ];
    expect(calcularBalance(movimientos)).toEqual({
      neto: 848500,
      ingresos: 900000,
      gastos: 51500,
    });
  });
});

describe("filtrarPorMes", () => {
  const movimientos = [
    mov({ id: "a", fecha: "2026-08-01" }),
    mov({ id: "b", fecha: "2026-08-31" }),
    mov({ id: "c", fecha: "2026-07-31" }),
    mov({ id: "d", fecha: "2025-08-14" }),
  ];

  it("devuelve solo los movimientos del mes y año pedidos", () => {
    const resultado = filtrarPorMes(movimientos, 2026, 8);
    expect(resultado.map((m) => m.id)).toEqual(["a", "b"]);
  });

  it("devuelve lista vacía si no hay movimientos en ese mes", () => {
    expect(filtrarPorMes(movimientos, 2026, 12)).toEqual([]);
  });

  it("no confunde el mismo mes en otro año", () => {
    const resultado = filtrarPorMes(movimientos, 2025, 8);
    expect(resultado.map((m) => m.id)).toEqual(["d"]);
  });
});

describe("puedeNavegarAMes", () => {
  const hoy = new Date(2026, 7, 15); // 15 de agosto de 2026

  it("permite el mes en curso", () => {
    expect(puedeNavegarAMes(2026, 8, hoy)).toBe(true);
  });

  it("permite un mes anterior en el mismo año", () => {
    expect(puedeNavegarAMes(2026, 7, hoy)).toBe(true);
  });

  it("permite un año anterior completo", () => {
    expect(puedeNavegarAMes(2025, 12, hoy)).toBe(true);
  });

  it("rechaza un mes futuro en el mismo año", () => {
    expect(puedeNavegarAMes(2026, 9, hoy)).toBe(false);
  });

  it("rechaza un año futuro", () => {
    expect(puedeNavegarAMes(2027, 1, hoy)).toBe(false);
  });
});

describe("mesAnterior / mesSiguiente", () => {
  it("retrocede un mes dentro del mismo año", () => {
    expect(mesAnterior({ anio: 2026, mes: 8 })).toEqual({ anio: 2026, mes: 7 });
  });

  it("retrocede de enero a diciembre del año anterior", () => {
    expect(mesAnterior({ anio: 2026, mes: 1 })).toEqual({ anio: 2025, mes: 12 });
  });

  it("avanza un mes dentro del mismo año", () => {
    expect(mesSiguiente({ anio: 2026, mes: 8 })).toEqual({ anio: 2026, mes: 9 });
  });

  it("avanza de diciembre a enero del año siguiente", () => {
    expect(mesSiguiente({ anio: 2026, mes: 12 })).toEqual({ anio: 2027, mes: 1 });
  });
});
