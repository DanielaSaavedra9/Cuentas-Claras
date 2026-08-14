jest.mock("firebase/firestore", () => ({
  doc: jest.fn(() => "usuarios/uid-123"),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  serverTimestamp: jest.fn(() => "SERVER_TIMESTAMP"),
}));

jest.mock("../../firebaseConfig", () => ({ db: {} }));

import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

import {
  aceptarConsentimiento,
  crearUsuarioSiNoExiste,
  necesitaConsentimiento,
} from "@/services/usuarios";

const mockDoc = doc as jest.Mock;
const mockGetDoc = getDoc as jest.Mock;
const mockSetDoc = setDoc as jest.Mock;
const mockUpdateDoc = updateDoc as jest.Mock;

const datosNuevos = {
  nombre: "Daniela",
  apellido: "Saavedra",
  correo: "daniela@example.com",
  fechaNacimiento: "2000-01-01",
  sueldoMensual: null,
  consentimientoAceptado: true,
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("crearUsuarioSiNoExiste", () => {
  it("crea el documento si no existe", async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });

    await crearUsuarioSiNoExiste("uid-123", datosNuevos);

    expect(mockSetDoc).toHaveBeenCalledTimes(1);
    const [, payload] = mockSetDoc.mock.calls[0];
    expect(payload).toMatchObject({
      nombre: "Daniela",
      apellido: "Saavedra",
      correo: "daniela@example.com",
      consentimientoAceptado: true,
      diaPago: null,
      repiteSueldo: false,
    });
  });

  it("no sobrescribe el documento si ya existe", async () => {
    mockGetDoc.mockResolvedValue({ exists: () => true });

    await crearUsuarioSiNoExiste("uid-123", datosNuevos);

    expect(mockSetDoc).not.toHaveBeenCalled();
  });

  it("usa el uid recibido para referenciar el documento", async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });

    await crearUsuarioSiNoExiste("uid-123", datosNuevos);

    expect(mockDoc).toHaveBeenCalledWith({}, "Usuarios", "uid-123");
  });
});

describe("necesitaConsentimiento", () => {
  it("devuelve true si el documento no existe", async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });

    await expect(necesitaConsentimiento("uid-123")).resolves.toBe(true);
  });

  it("devuelve true si consentimientoAceptado es false", async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ consentimientoAceptado: false }),
    });

    await expect(necesitaConsentimiento("uid-123")).resolves.toBe(true);
  });

  it("devuelve false si consentimientoAceptado es true", async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ consentimientoAceptado: true }),
    });

    await expect(necesitaConsentimiento("uid-123")).resolves.toBe(false);
  });
});

describe("aceptarConsentimiento", () => {
  it("actualiza consentimientoAceptado y fechaConsentimiento", async () => {
    mockUpdateDoc.mockResolvedValue(undefined);

    await aceptarConsentimiento("uid-123");

    expect(mockUpdateDoc).toHaveBeenCalledWith("usuarios/uid-123", {
      consentimientoAceptado: true,
      fechaConsentimiento: "SERVER_TIMESTAMP",
    });
  });
});
