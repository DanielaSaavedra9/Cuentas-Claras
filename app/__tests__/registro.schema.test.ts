jest.mock("firebase/auth", () => ({ createUserWithEmailAndPassword: jest.fn() }));
jest.mock("@/firebaseConfig", () => ({ auth: {} }));
jest.mock("@/services/usuarios", () => ({ crearUsuarioSiNoExiste: jest.fn() }));

import { registroSchema } from "@/app/registro";

const anioActual = new Date().getFullYear();

function baseData(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    nombre: "Daniela",
    apellido: "Saavedra",
    email: "daniela@example.com",
    password: "password123",
    dia: "14",
    mes: "8",
    anio: String(anioActual - 20),
    sueldoMensual: "",
    aceptaTerminos: true,
    ...overrides,
  };
}

describe("registroSchema", () => {
  it("acepta datos válidos", () => {
    const result = registroSchema.safeParse(baseData());
    expect(result.success).toBe(true);
  });

  it("rechaza contraseña con menos de 8 caracteres", () => {
    const result = registroSchema.safeParse(baseData({ password: "1234567" }));
    expect(result.success).toBe(false);
  });

  it("rechaza correo con formato inválido", () => {
    const result = registroSchema.safeParse(baseData({ email: "no-es-correo" }));
    expect(result.success).toBe(false);
  });

  it("rechaza campos obligatorios vacíos (nombre)", () => {
    const result = registroSchema.safeParse(baseData({ nombre: "" }));
    expect(result.success).toBe(false);
  });

  it("rechaza si no se acepta el checkbox de términos", () => {
    const result = registroSchema.safeParse(baseData({ aceptaTerminos: false }));
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "aceptaTerminos");
      expect(issue).toBeDefined();
    }
  });

  it("rechaza una fecha de nacimiento futura", () => {
    const result = registroSchema.safeParse(
      baseData({ anio: String(anioActual + 1) }),
    );
    expect(result.success).toBe(false);
  });

  it("rechaza una fecha inválida (31 de febrero)", () => {
    const result = registroSchema.safeParse(
      baseData({ dia: "31", mes: "2", anio: String(anioActual - 20) }),
    );
    expect(result.success).toBe(false);
  });

  it("acepta sueldoMensual vacío (opcional)", () => {
    const result = registroSchema.safeParse(baseData({ sueldoMensual: "" }));
    expect(result.success).toBe(true);
  });
});
