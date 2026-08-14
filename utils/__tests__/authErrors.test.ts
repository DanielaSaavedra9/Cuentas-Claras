import { getAuthErrorMessage } from "@/utils/authErrors";

describe("getAuthErrorMessage", () => {
  it("mapea auth/user-not-found", () => {
    expect(getAuthErrorMessage("auth/user-not-found")).toBe(
      "No existe una cuenta con ese correo.",
    );
  });

  it("mapea auth/invalid-credential", () => {
    expect(getAuthErrorMessage("auth/invalid-credential")).toBe(
      "Correo o contraseña incorrectos.",
    );
  });

  it("mapea auth/email-already-in-use", () => {
    expect(getAuthErrorMessage("auth/email-already-in-use")).toBe(
      "Ese correo ya está registrado. Intenta iniciar sesión.",
    );
  });

  it("mapea auth/weak-password", () => {
    expect(getAuthErrorMessage("auth/weak-password")).toBe(
      "La contraseña es muy débil. Usa al menos 8 caracteres.",
    );
  });

  it("devuelve el mensaje por defecto para un código desconocido", () => {
    expect(getAuthErrorMessage("auth/algo-que-no-existe")).toBe(
      "Ocurrió un error inesperado. Intenta de nuevo.",
    );
  });

  it("devuelve el mensaje por defecto cuando no hay código", () => {
    expect(getAuthErrorMessage(undefined)).toBe(
      "Ocurrió un error inesperado. Intenta de nuevo.",
    );
  });
});
