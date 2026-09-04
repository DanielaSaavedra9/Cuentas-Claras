import {
  calcularInteresGanado,
  calcularSaldoFinal,
  calcularTasaMensualEfectiva,
  calcularTotalAportado,
  compararRendimiento,
} from "@/utils/cuentaAhorro";

describe("calcularTasaMensualEfectiva", () => {
  it("convierte tasa anual efectiva a mensual con la raíz 12 (no dividiendo entre 12)", () => {
    // 4,3% anual efectiva → (1,043)^(1/12) − 1 ≈ 0,00351459
    expect(calcularTasaMensualEfectiva(4.3)).toBeCloseTo(0.00351459, 8);
  });

  it("es la inversa de capitalizar 12 meses: (1 + i)^12 = 1 + tasaAnual/100", () => {
    const i = calcularTasaMensualEfectiva(4.3);
    expect(Math.pow(1 + i, 12)).toBeCloseTo(1.043, 10);
  });

  it("tasa 0% devuelve 0", () => {
    expect(calcularTasaMensualEfectiva(0)).toBe(0);
  });
});

describe("calcularSaldoFinal (anualidad anticipada)", () => {
  it("caso de ejemplo del checklist: $500.000 inicial, $100.000/mes, 12 meses, 4,3% anual", () => {
    // Cálculo manual de referencia: 1.749.270,23 (ver evidencia RF08).
    expect(calcularSaldoFinal(500000, 100000, 4.3, 12)).toBeCloseTo(1749270.23, 1);
  });

  it("plazo de 1 mes: inicial y primer aporte ganan un mes de interés → (P + A) × (1 + i)", () => {
    const i = calcularTasaMensualEfectiva(4.3);
    expect(calcularSaldoFinal(500000, 100000, 4.3, 1)).toBeCloseTo(
      (500000 + 100000) * (1 + i),
      6,
    );
  });

  it("tasa 0% (caso límite, evita división por cero): solo capital más aportes", () => {
    expect(calcularSaldoFinal(500000, 100000, 0, 12)).toBe(1700000);
  });

  it("aporte mensual en 0: solo capitaliza el ahorro inicial", () => {
    expect(calcularSaldoFinal(500000, 0, 4.3, 12)).toBeCloseTo(500000 * 1.043, 6);
  });

  it("monto inicial muy alto: el saldo escala proporcionalmente en la parte del capital", () => {
    const soloInicialBase = calcularSaldoFinal(500000, 0, 4.3, 12);
    const soloInicialAlto = calcularSaldoFinal(500000000, 0, 4.3, 12);
    expect(soloInicialAlto).toBeCloseTo(soloInicialBase * 1000, 0);
  });
});

describe("calcularTotalAportado / calcularInteresGanado", () => {
  it("total aportado = inicial + aporte × meses (sin interés)", () => {
    expect(calcularTotalAportado(500000, 100000, 12)).toBe(1700000);
  });

  it("interés ganado = saldo final − total aportado", () => {
    const saldo = calcularSaldoFinal(500000, 100000, 4.3, 12);
    const aportado = calcularTotalAportado(500000, 100000, 12);
    expect(calcularInteresGanado(saldo, aportado)).toBeCloseTo(49270.23, 1);
  });

  it("con tasa 0% el interés ganado es 0", () => {
    const saldo = calcularSaldoFinal(500000, 100000, 0, 12);
    const aportado = calcularTotalAportado(500000, 100000, 12);
    expect(calcularInteresGanado(saldo, aportado)).toBe(0);
  });
});

describe("compararRendimiento", () => {
  it("con dos tasas distintas identifica que la cuenta remunerada rinde más y calcula la diferencia", () => {
    const misma = { inicial: 500000, aporte: 100000, meses: 12 };
    const saldoAhorro = calcularSaldoFinal(misma.inicial, misma.aporte, 4.3, misma.meses);
    const saldoRemunerada = calcularSaldoFinal(misma.inicial, misma.aporte, 6.0, misma.meses);

    const r = compararRendimiento(saldoAhorro, saldoRemunerada);
    expect(r.mejor).toBe("remunerada");
    expect(r.diferencia).toBeCloseTo(saldoRemunerada - saldoAhorro, 6);
    expect(r.diferencia).toBeGreaterThan(0);
  });

  it("cuando la cuenta de ahorro rinde más, lo indica y la diferencia sigue siendo positiva", () => {
    const r = compararRendimiento(1_800_000, 1_750_000);
    expect(r.mejor).toBe("ahorro");
    expect(r.diferencia).toBe(50_000);
  });

  it("saldos iguales: 'iguales' y diferencia 0", () => {
    const r = compararRendimiento(1_749_270.23, 1_749_270.23);
    expect(r.mejor).toBe("iguales");
    expect(r.diferencia).toBe(0);
  });
});
