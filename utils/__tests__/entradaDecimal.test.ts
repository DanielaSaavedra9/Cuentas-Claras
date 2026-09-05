import { limpiarDecimal } from "@/utils/entradaDecimal";

describe("limpiarDecimal", () => {
  it("deja pasar un número entero tal cual", () => {
    expect(limpiarDecimal("24")).toBe("24");
  });

  it("acepta el punto como separador decimal", () => {
    expect(limpiarDecimal("23.98")).toBe("23.98");
  });

  it("convierte la coma a punto — teclado decimal en configuración chilena", () => {
    expect(limpiarDecimal("23,98")).toBe("23.98");
  });

  it("ignora cualquier caracter que no sea dígito, punto o coma", () => {
    expect(limpiarDecimal("2a3,9%8")).toBe("23.98");
  });

  it("descarta un segundo separador si el usuario escribe más de uno", () => {
    expect(limpiarDecimal("23.9.8")).toBe("23.98");
  });

  it("descarta un segundo separador cuando mezcla coma y punto", () => {
    expect(limpiarDecimal("23,9.8")).toBe("23.98");
  });

  it("campo vacío devuelve vacío", () => {
    expect(limpiarDecimal("")).toBe("");
  });

  it("un solo separador al final se mantiene (el usuario todavía está escribiendo)", () => {
    expect(limpiarDecimal("23,")).toBe("23.");
  });
});
