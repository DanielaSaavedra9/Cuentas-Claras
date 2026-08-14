jest.mock("firebase/firestore", () => ({
  doc: jest.fn(() => "usuarios/uid-nuevo"),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  serverTimestamp: jest.fn(() => "SERVER_TIMESTAMP"),
}));

jest.mock("../../firebaseConfig", () => ({ db: {} }));

import { getDoc, setDoc } from "firebase/firestore";

import { crearUsuarioSiNoExiste, necesitaConsentimiento } from "@/services/usuarios";

const mockGetDoc = getDoc as jest.Mock;
const mockSetDoc = setDoc as jest.Mock;

// Simula el flujo completo del Bloque 2: registro por email → se llama
// crearUsuarioSiNoExiste() con consentimientoAceptado: true (capturado
// en el mismo formulario) → el documento resultante no necesita pasar
// por la pantalla de Consentimiento (Bloque 7, exclusiva del flujo Google).
describe("Integración: registro por email crea usuario con consentimiento aceptado", () => {
  it("crea el documento y no requiere consentimiento después", async () => {
    mockGetDoc.mockResolvedValueOnce({ exists: () => false });

    await crearUsuarioSiNoExiste("uid-nuevo", {
      nombre: "Daniela",
      apellido: "Saavedra",
      correo: "daniela@example.com",
      fechaNacimiento: "2000-01-01",
      sueldoMensual: null,
      consentimientoAceptado: true,
    });

    expect(mockSetDoc).toHaveBeenCalledTimes(1);
    const [, payload] = mockSetDoc.mock.calls[0];
    expect(payload.consentimientoAceptado).toBe(true);
    expect(payload.fechaConsentimiento).toBe("SERVER_TIMESTAMP");

    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => payload,
    });

    await expect(necesitaConsentimiento("uid-nuevo")).resolves.toBe(false);
  });
});
