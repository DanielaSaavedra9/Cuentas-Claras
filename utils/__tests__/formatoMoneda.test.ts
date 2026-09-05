import {
  calcularPosicionCursor,
  formatearPesoChileno,
  parsearPesoChileno,
} from "@/utils/formatoMoneda";

describe("formatearPesoChileno", () => {
  it("agrega el separador de miles chileno (punto)", () => {
    expect(formatearPesoChileno(1000)).toBe("1.000");
  });

  it("funciona con montos de millones (dos separadores)", () => {
    expect(formatearPesoChileno(1000000)).toBe("1.000.000");
  });

  it("cero se muestra como '0', no vacío", () => {
    expect(formatearPesoChileno(0)).toBe("0");
  });

  it("un número de un solo dígito no lleva separador", () => {
    expect(formatearPesoChileno(5)).toBe("5");
  });

  it("redondea decimales — los montos son siempre pesos enteros", () => {
    expect(formatearPesoChileno(1000.6)).toBe("1.001");
  });

  it("NaN devuelve string vacío, no 'NaN'", () => {
    expect(formatearPesoChileno(NaN)).toBe("");
  });

  it("Infinity devuelve string vacío", () => {
    expect(formatearPesoChileno(Infinity)).toBe("");
  });
});

describe("parsearPesoChileno", () => {
  it("quita el separador de miles y devuelve el número limpio", () => {
    expect(parsearPesoChileno("1.000")).toBe(1000);
  });

  it("funciona con montos de millones", () => {
    expect(parsearPesoChileno("1.000.000")).toBe(1000000);
  });

  it("texto sin ningún dígito (campo vacío) devuelve NaN, no 0", () => {
    // A propósito distinto de Number(""), que en JS da 0 — acá "sin
    // dígitos" es "sin valor todavía", no "cero".
    expect(parsearPesoChileno("")).toBeNaN();
  });

  it("texto inválido sin dígitos (ej. solo un signo) también devuelve NaN", () => {
    expect(parsearPesoChileno("-")).toBeNaN();
  });

  it("ignora cualquier caracter que no sea dígito", () => {
    expect(parsearPesoChileno("$1.000abc")).toBe(1000);
  });
});

describe("formatearPesoChileno / parsearPesoChileno — ida y vuelta", () => {
  it.each([0, 5, 1000, 1500, 999999, 1000000, 123456789])(
    "parsearPesoChileno(formatearPesoChileno(%i)) === %i",
    (n) => {
      expect(parsearPesoChileno(formatearPesoChileno(n))).toBe(n);
    },
  );

  it("el campo vacío se mantiene vacío en el round-trip completo (caso límite del checklist)", () => {
    // Simula exactamente lo que hace el campo de monto: mostrarMonto(digitosCrudos)
    // = formatearPesoChileno(parsearPesoChileno(digitosCrudos)).
    const digitosCrudos = "";
    expect(formatearPesoChileno(parsearPesoChileno(digitosCrudos))).toBe("");
  });
});

describe("calcularPosicionCursor", () => {
  it("escribiendo al final, el cursor se mantiene al final", () => {
    // "1.000" -> el usuario agrega un dígito al final -> "10.000"
    const pos = calcularPosicionCursor("1.000", 5, "10.000");
    expect(pos).toBe(6);
  });

  it("borrando al final (backspace), el cursor se mantiene al final", () => {
    // "1.000" -> borra el último dígito -> "100"
    const pos = calcularPosicionCursor("1.000", 5, "100");
    expect(pos).toBe(3);
  });

  it("insertando un dígito en medio del número, el cursor queda después del dígito insertado", () => {
    // "1.000" con cursor después del "1" (posición 1) -> escribe "5" -> "15.000"
    const pos = calcularPosicionCursor("1.000", 1, "15.000");
    // Deben quedar exactamente 3 dígitos después del cursor (los mismos
    // "000" que quedaban antes de insertar), sin importar de qué lado
    // del separador nuevo caiga (ambas posiciones son visualmente
    // equivalentes junto al punto).
    const digitosDespues = "15.000".slice(pos).replace(/[^0-9]/g, "").length;
    expect(digitosDespues).toBe(3);
  });

  it("borrando un dígito en medio del número, preserva los dígitos restantes a la derecha", () => {
    // "12.000" con cursor después del "2" (posición 2) -> borra el "2" -> "1.000"...
    // en dígitos crudos "12000" -> borra el segundo dígito -> "1000"
    const pos = calcularPosicionCursor("12.000", 2, "1.000");
    const digitosDespues = "1.000".slice(pos).replace(/[^0-9]/g, "").length;
    expect(digitosDespues).toBe(3);
  });

  it("con el campo completamente vacío, el cursor queda en 0", () => {
    const pos = calcularPosicionCursor("1.000", 0, "");
    expect(pos).toBe(0);
  });
});
