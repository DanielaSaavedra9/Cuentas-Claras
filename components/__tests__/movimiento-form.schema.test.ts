import { movimientoSchema } from "@/components/movimiento-form";

function baseData(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    tipo: "gasto",
    monto: "5000",
    descripcion: "Almuerzo",
    categoria: "comida",
    dia: "14",
    mes: "8",
    anio: "2026",
    compartido: false,
    numeroPersonas: "2",
    esPrevisible: false,
    diaLimite: "",
    mesLimite: "",
    anioLimite: "",
    ...overrides,
  };
}

describe("movimientoSchema", () => {
  it("acepta datos válidos de gasto", () => {
    const result = movimientoSchema.safeParse(baseData());
    expect(result.success).toBe(true);
  });

  it("acepta datos válidos de ingreso", () => {
    const result = movimientoSchema.safeParse(
      baseData({ tipo: "ingreso", categoria: "cuentas" }),
    );
    expect(result.success).toBe(true);
  });

  it("rechaza monto igual a 0", () => {
    const result = movimientoSchema.safeParse(baseData({ monto: "0" }));
    expect(result.success).toBe(false);
  });

  it("rechaza monto negativo", () => {
    const result = movimientoSchema.safeParse(baseData({ monto: "-100" }));
    expect(result.success).toBe(false);
  });

  it("rechaza monto vacío", () => {
    const result = movimientoSchema.safeParse(baseData({ monto: "" }));
    expect(result.success).toBe(false);
  });

  it("rechaza categoría vacía", () => {
    const result = movimientoSchema.safeParse(baseData({ categoria: "" }));
    expect(result.success).toBe(false);
  });

  it("rechaza descripción vacía", () => {
    const result = movimientoSchema.safeParse(baseData({ descripcion: "" }));
    expect(result.success).toBe(false);
  });

  it("rechaza fecha vacía", () => {
    const result = movimientoSchema.safeParse(
      baseData({ dia: "", mes: "", anio: "" }),
    );
    expect(result.success).toBe(false);
  });

  it("rechaza fecha inválida (31 de febrero)", () => {
    const result = movimientoSchema.safeParse(
      baseData({ dia: "31", mes: "2", anio: "2026" }),
    );
    expect(result.success).toBe(false);
  });

  it("rechaza gasto compartido con menos de 2 personas", () => {
    const result = movimientoSchema.safeParse(
      baseData({ compartido: true, numeroPersonas: "1" }),
    );
    expect(result.success).toBe(false);
  });

  it("acepta gasto compartido con 2 o más personas", () => {
    const result = movimientoSchema.safeParse(
      baseData({ compartido: true, numeroPersonas: "3" }),
    );
    expect(result.success).toBe(true);
  });

  it("rechaza gasto previsible sin fecha límite", () => {
    const result = movimientoSchema.safeParse(baseData({ esPrevisible: true }));
    expect(result.success).toBe(false);
  });

  it("acepta gasto previsible con fecha límite válida", () => {
    const result = movimientoSchema.safeParse(
      baseData({
        esPrevisible: true,
        diaLimite: "1",
        mesLimite: "12",
        anioLimite: "2026",
      }),
    );
    expect(result.success).toBe(true);
  });

  it("ignora compartido/esPrevisible cuando tipo es ingreso", () => {
    const result = movimientoSchema.safeParse(
      baseData({ tipo: "ingreso", categoria: "cuentas", compartido: true, numeroPersonas: "1" }),
    );
    expect(result.success).toBe(true);
  });
});
