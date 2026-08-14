jest.mock("firebase/auth", () => ({ sendPasswordResetEmail: jest.fn() }));
jest.mock("@/firebaseConfig", () => ({ auth: {} }));

import { resetSchema } from "@/app/recuperar-contrasena";

describe("resetSchema", () => {
  it("acepta un correo válido", () => {
    const result = resetSchema.safeParse({ email: "daniela@example.com" });
    expect(result.success).toBe(true);
  });

  it("rechaza correo con formato inválido", () => {
    const result = resetSchema.safeParse({ email: "no-es-correo" });
    expect(result.success).toBe(false);
  });

  it("rechaza correo vacío", () => {
    const result = resetSchema.safeParse({ email: "" });
    expect(result.success).toBe(false);
  });
});
