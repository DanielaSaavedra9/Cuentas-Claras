import {
  calcularCuotaSugerida,
  calcularDiferenciaSugerido,
  estadoPrevisible,
  estaAtrasado,
  formatFechaCorta,
  mesesRestantes,
} from "@/utils/previsibles";

describe("mesesRestantes", () => {
  it("cruza el año (octubre → febrero del año siguiente)", () => {
    const hoy = new Date(2026, 9, 15); // 15 de octubre de 2026
    expect(mesesRestantes(hoy, "2027-02-01")).toBe(4);
  });

  it("fecha límite dentro del mismo mes devuelve 1", () => {
    const hoy = new Date(2026, 7, 1); // 1 de agosto de 2026
    expect(mesesRestantes(hoy, "2026-08-31")).toBe(1);
  });

  it("fecha límite mañana (mismo mes) devuelve 1", () => {
    const hoy = new Date(2026, 7, 30); // 30 de agosto de 2026
    expect(mesesRestantes(hoy, "2026-08-31")).toBe(1);
  });

  it("un mes exacto de diferencia devuelve 1", () => {
    const hoy = new Date(2026, 7, 15); // 15 de agosto de 2026
    expect(mesesRestantes(hoy, "2026-09-01")).toBe(1);
  });

  it("varios meses de diferencia dentro del mismo año", () => {
    const hoy = new Date(2026, 7, 15); // 15 de agosto de 2026
    expect(mesesRestantes(hoy, "2026-12-01")).toBe(4);
  });
});

describe("calcularCuotaSugerida", () => {
  const hoy = new Date(2026, 7, 15); // 15 de agosto de 2026

  it("meses restantes normal (4 meses)", () => {
    expect(calcularCuotaSugerida(400000, "2026-12-01", hoy)).toBe(100000);
  });

  it("1 mes restante: la cuota es el saldo completo", () => {
    expect(calcularCuotaSugerida(50000, "2026-09-01", hoy)).toBe(50000);
  });

  it("fecha límite este mes (mismo mes): la cuota es el saldo completo", () => {
    expect(calcularCuotaSugerida(50000, "2026-08-31", hoy)).toBe(50000);
  });

  it("saldo pendiente en 0 devuelve 0", () => {
    expect(calcularCuotaSugerida(0, "2026-12-01", hoy)).toBe(0);
  });

  it("saldo pendiente negativo devuelve 0", () => {
    expect(calcularCuotaSugerida(-100, "2026-12-01", hoy)).toBe(0);
  });
});

describe("estaAtrasado", () => {
  const hoy = new Date(2026, 7, 15); // 15 de agosto de 2026

  it("vencido y sin completar: true", () => {
    expect(estaAtrasado(hoy, "2026-07-15", 10000, 50000)).toBe(true);
  });

  it("vencido pero ya completado: false", () => {
    expect(estaAtrasado(hoy, "2026-07-15", 50000, 50000)).toBe(false);
  });

  it("vencido y sobrepagado: false", () => {
    expect(estaAtrasado(hoy, "2026-07-15", 60000, 50000)).toBe(false);
  });

  it("no vencido (fecha límite futura): false", () => {
    expect(estaAtrasado(hoy, "2026-12-01", 10000, 50000)).toBe(false);
  });

  it("vence exactamente hoy y sin completar: true", () => {
    expect(estaAtrasado(hoy, "2026-08-15", 10000, 50000)).toBe(true);
  });
});

describe("calcularDiferenciaSugerido", () => {
  it("abonó exactamente la cuota: diferencia 0", () => {
    expect(calcularDiferenciaSugerido(35714, 35714)).toBe(0);
  });

  it("abonó de más: diferencia positiva", () => {
    expect(calcularDiferenciaSugerido(40000, 35714)).toBe(4286);
  });

  it("abonó de menos: diferencia negativa", () => {
    expect(calcularDiferenciaSugerido(30000, 35714)).toBe(-5714);
  });
});

describe("estadoPrevisible", () => {
  const hoy = new Date(2026, 7, 15); // 15 de agosto de 2026

  it("vencido y sin completar: 'vencido'", () => {
    expect(estadoPrevisible(hoy, "2026-07-15", 10000, 50000)).toBe("vencido");
  });

  it("vencido pero completado: no es 'vencido'", () => {
    expect(estadoPrevisible(hoy, "2026-07-15", 50000, 50000)).not.toBe("vencido");
  });

  it("vence este mes (≤1 mes restante), no vencido: 'proximoAVencer'", () => {
    expect(estadoPrevisible(hoy, "2026-08-31", 10000, 50000)).toBe(
      "proximoAVencer",
    );
  });

  it("faltan varios meses: 'normal'", () => {
    expect(estadoPrevisible(hoy, "2026-12-01", 10000, 50000)).toBe("normal");
  });
});

describe("formatFechaCorta", () => {
  it("convierte YYYY-MM-DD a DD-MM-YYYY", () => {
    expect(formatFechaCorta("2026-07-15")).toBe("15-07-2026");
  });
});
