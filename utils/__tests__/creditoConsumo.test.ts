import {
  calcularCAE,
  calcularCTC,
  calcularCuotaMensual,
  calcularImpuestos,
  calcularTasaMensual,
} from "@/utils/creditoConsumo";

describe("calcularTasaMensual", () => {
  it("convierte tasa anual nominal a tasa mensual", () => {
    expect(calcularTasaMensual(23.98)).toBeCloseTo(0.0199833, 6);
  });

  it("tasa 0% devuelve 0", () => {
    expect(calcularTasaMensual(0)).toBe(0);
  });
});

describe("calcularCuotaMensual", () => {
  it("crédito típico: $10.000.000 a 12 meses, 23,98% anual", () => {
    expect(calcularCuotaMensual(10000000, 23.98, 12)).toBeCloseTo(945499, -1);
  });

  it("plazo de 1 mes: la cuota es el monto más el interés de ese mes", () => {
    const i = calcularTasaMensual(23.98);
    expect(calcularCuotaMensual(10000000, 23.98, 1)).toBeCloseTo(
      10000000 * (1 + i),
      0,
    );
  });

  it("tasa 0% (caso límite, evita división por cero): cuota es monto/plazo", () => {
    expect(calcularCuotaMensual(1200000, 0, 12)).toBe(100000);
  });

  it("monto muy alto: la cuota escala proporcionalmente", () => {
    const cuotaBase = calcularCuotaMensual(10000000, 23.98, 12);
    const cuotaAlta = calcularCuotaMensual(1000000000, 23.98, 12);
    expect(cuotaAlta).toBeCloseTo(cuotaBase * 100, 0);
  });
});

describe("calcularImpuestos", () => {
  it("0.8% flat sobre el monto", () => {
    expect(calcularImpuestos(10000000)).toBe(80000);
  });

  it("monto 0 devuelve 0", () => {
    expect(calcularImpuestos(0)).toBe(0);
  });
});

describe("calcularCTC", () => {
  it("incluye capital: cuota × plazo + impuestos", () => {
    // Caso de referencia (.claude/prompt-fix-ctc.md): $10.000.000/12 meses/23,98%
    expect(calcularCTC(945499, 12, 80000)).toBeCloseTo(11425990, -1);
  });

  it("impuestos 0 no afecta el cálculo base", () => {
    expect(calcularCTC(100000, 12, 0)).toBe(1200000);
  });
});

describe("calcularCAE", () => {
  it("crédito típico: 23,98% anual nominal → CAE efectiva mayor por capitalización mensual", () => {
    expect(calcularCAE(23.98)).toBeCloseTo(26.8, 1);
  });

  it("tasa 0% devuelve CAE 0%", () => {
    expect(calcularCAE(0)).toBe(0);
  });

  it("compara contra un cálculo manual de referencia con tasa mensual constante", () => {
    // Con tasa mensual i, CAE = ((1+i)^12 - 1) * 100. Para i = 2% mensual
    // (24% nominal anual), el cálculo manual da (1.02^12 - 1) * 100.
    const i = 0.02;
    const esperado = (Math.pow(1 + i, 12) - 1) * 100;
    expect(calcularCAE(24)).toBeCloseTo(esperado, 6);
  });
});
