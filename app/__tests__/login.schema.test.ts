jest.mock("firebase/auth", () => ({ signInWithEmailAndPassword: jest.fn() }));
jest.mock("@/firebaseConfig", () => ({ auth: {} }));
jest.mock("@/services/usuarios", () => ({ crearUsuarioSiNoExiste: jest.fn() }));

import { loginSchema } from "@/app/login";

describe("loginSchema", () => {
  it("acepta correo y contraseña válidos", () => {
    const result = loginSchema.safeParse({
      email: "daniela@example.com",
      password: "cualquiera",
    });
    expect(result.success).toBe(true);
  });

  it("rechaza correo con formato inválido", () => {
    const result = loginSchema.safeParse({
      email: "no-es-correo",
      password: "cualquiera",
    });
    expect(result.success).toBe(false);
  });

  it("rechaza correo vacío", () => {
    const result = loginSchema.safeParse({ email: "", password: "cualquiera" });
    expect(result.success).toBe(false);
  });

  it("rechaza contraseña vacía", () => {
    const result = loginSchema.safeParse({
      email: "daniela@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});
