import {
  alternarTerminoAbierto,
  buscarTermino,
  GLOSARIO,
  TERMINOS_GLOSARIO_GENERAL,
} from "@/constants/glosario";

// RF06 Bloque 5 — el contenido educativo es solo datos (sin persistencia),
// así que se prueban las funciones auxiliares y la integridad del array.
// El render del Tooltip y del acordeón no se automatiza — mismo criterio
// que RF01-RF08 (solo lógica pura y servicios, no componentes).

describe("GLOSARIO (integridad de datos)", () => {
  it("todos los términos tienen id, término y definición no vacíos", () => {
    for (const t of GLOSARIO) {
      expect(t.id.trim()).not.toBe("");
      expect(t.termino.trim()).not.toBe("");
      expect(t.definicion.trim()).not.toBe("");
    }
  });

  it("no hay ids repetidos", () => {
    const ids = GLOSARIO.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("incluye los términos que la ficha ME-CE-01 exige (con tooltip contextual)", () => {
    for (const id of ["cae", "ctc", "gastoPrevisible", "gastoCompartido"]) {
      expect(buscarTermino(id)).toBeDefined();
    }
  });

  it("cada terminoId usado en un tooltip contextual existe en el glosario", () => {
    // Si se renombra un id acá sin actualizar la pantalla (o al revés),
    // este test lo caza antes que la usuaria vea un tooltip vacío.
    for (const id of [
      "cae", // simulador-credito.tsx
      "ctc", // simulador-credito.tsx
      "gastoPrevisible", // movimiento-form.tsx
      "gastoCompartido", // movimiento-form.tsx
      "interesCompuesto", // simulador-ahorro.tsx
    ]) {
      expect(buscarTermino(id)).toBeDefined();
    }
  });
});

describe("buscarTermino", () => {
  it("devuelve el término cuando el id existe", () => {
    expect(buscarTermino("cae")?.termino).toBe("CAE");
  });

  it("devuelve undefined cuando el id no existe", () => {
    expect(buscarTermino("noExiste")).toBeUndefined();
  });
});

describe("TERMINOS_GLOSARIO_GENERAL", () => {
  it("es un subconjunto no vacío de GLOSARIO", () => {
    expect(TERMINOS_GLOSARIO_GENERAL.length).toBeGreaterThan(0);
    expect(TERMINOS_GLOSARIO_GENERAL.length).toBeLessThanOrEqual(GLOSARIO.length);
  });

  it("solo contiene términos marcados enGlosarioGeneral", () => {
    for (const t of TERMINOS_GLOSARIO_GENERAL) {
      expect(t.enGlosarioGeneral).toBe(true);
    }
  });

  it("deja fuera los términos que son solo tooltip contextual (cuotaSugerida)", () => {
    expect(TERMINOS_GLOSARIO_GENERAL.map((t) => t.id)).not.toContain("cuotaSugerida");
  });
});

describe("alternarTerminoAbierto (acordeón: uno abierto a la vez)", () => {
  it("desde ninguno abierto, abre el tocado", () => {
    expect(alternarTerminoAbierto(null, "cae")).toBe("cae");
  });

  it("tocar el término ya abierto lo cierra", () => {
    expect(alternarTerminoAbierto("cae", "cae")).toBeNull();
  });

  it("tocar otro término cambia el abierto (colapsa el anterior)", () => {
    expect(alternarTerminoAbierto("cae", "ctc")).toBe("ctc");
  });
});
