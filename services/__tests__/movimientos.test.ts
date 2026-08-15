jest.mock("firebase/firestore", () => ({
  collection: jest.fn(() => "col-movimientos"),
  doc: jest.fn((_db, ...segments) => `doc-${segments[segments.length - 1]}`),
  addDoc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  deleteField: jest.fn(() => "DELETE_FIELD"),
  serverTimestamp: jest.fn(() => "SERVER_TIMESTAMP"),
}));

jest.mock("../../firebaseConfig", () => ({ db: {} }));

import { addDoc, deleteDoc, doc, getDoc, updateDoc } from "firebase/firestore";

import {
  actualizarMovimiento,
  crearMovimiento,
  eliminarMovimiento,
  obtenerMovimiento,
} from "@/services/movimientos";

const mockAddDoc = addDoc as jest.Mock;
const mockGetDoc = getDoc as jest.Mock;
const mockUpdateDoc = updateDoc as jest.Mock;
const mockDeleteDoc = deleteDoc as jest.Mock;
const mockDoc = doc as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("crearMovimiento", () => {
  it("crea el documento con la estructura correcta para un gasto simple", async () => {
    mockAddDoc.mockResolvedValue({ id: "mov-1" });

    const id = await crearMovimiento("uid-123", {
      tipo: "gasto",
      monto: 5000,
      descripcion: "Almuerzo",
      categoria: "comida",
      fecha: "2026-08-14",
    });

    expect(id).toBe("mov-1");
    expect(mockAddDoc).toHaveBeenCalledTimes(1);
    const [, payload] = mockAddDoc.mock.calls[0];
    expect(payload).toEqual({
      tipo: "gasto",
      monto: 5000,
      descripcion: "Almuerzo",
      categoria: "comida",
      fecha: "2026-08-14",
      compartido: false,
      esPrevisible: false,
      creadoEn: "SERVER_TIMESTAMP",
    });
  });

  it("agrega generadoAutomaticamente: false si el tipo es ingreso", async () => {
    mockAddDoc.mockResolvedValue({ id: "mov-2" });

    await crearMovimiento("uid-123", {
      tipo: "ingreso",
      monto: 900000,
      descripcion: "Sueldo",
      categoria: "cuentas",
      fecha: "2026-08-01",
    });

    const [, payload] = mockAddDoc.mock.calls[0];
    expect(payload.generadoAutomaticamente).toBe(false);
  });

  it("agrega numeroPersonas cuando compartido es true", async () => {
    mockAddDoc.mockResolvedValue({ id: "mov-3" });

    await crearMovimiento("uid-123", {
      tipo: "gasto",
      monto: 20000,
      descripcion: "Cena",
      categoria: "comida",
      fecha: "2026-08-14",
      compartido: true,
      numeroPersonas: 4,
    });

    const [, payload] = mockAddDoc.mock.calls[0];
    expect(payload.compartido).toBe(true);
    expect(payload.numeroPersonas).toBe(4);
  });

  it("agrega previsible.fechaLimite cuando esPrevisible es true", async () => {
    mockAddDoc.mockResolvedValue({ id: "mov-4" });

    await crearMovimiento("uid-123", {
      tipo: "gasto",
      monto: 350000,
      descripcion: "Matrícula",
      categoria: "otros",
      fecha: "2026-08-14",
      esPrevisible: true,
      previsibleFechaLimite: "2027-03-01",
    });

    const [, payload] = mockAddDoc.mock.calls[0];
    expect(payload.esPrevisible).toBe(true);
    expect(payload.previsible).toEqual({ fechaLimite: "2027-03-01" });
  });

  it("no agrega compartido/esPrevisible reales si el tipo es ingreso", async () => {
    mockAddDoc.mockResolvedValue({ id: "mov-5" });

    await crearMovimiento("uid-123", {
      tipo: "ingreso",
      monto: 900000,
      descripcion: "Sueldo",
      categoria: "cuentas",
      fecha: "2026-08-01",
      compartido: true,
      esPrevisible: true,
    });

    const [, payload] = mockAddDoc.mock.calls[0];
    expect(payload.compartido).toBe(false);
    expect(payload.esPrevisible).toBe(false);
  });
});

describe("obtenerMovimiento", () => {
  it("devuelve null si el documento no existe", async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });

    await expect(obtenerMovimiento("uid-123", "mov-1")).resolves.toBeNull();
  });

  it("devuelve el movimiento con sus campos si existe", async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      id: "mov-1",
      data: () => ({
        tipo: "gasto",
        monto: 5000,
        descripcion: "Almuerzo",
        categoria: "comida",
        fecha: "2026-08-14",
        compartido: false,
        esPrevisible: false,
      }),
    });

    await expect(obtenerMovimiento("uid-123", "mov-1")).resolves.toMatchObject({
      id: "mov-1",
      tipo: "gasto",
      monto: 5000,
      descripcion: "Almuerzo",
    });
  });

  it("usa el uid y el id recibidos para referenciar el documento", async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });

    await obtenerMovimiento("uid-123", "mov-1");

    expect(mockDoc).toHaveBeenCalledWith(
      {},
      "Usuarios",
      "uid-123",
      "movimientos",
      "mov-1",
    );
  });
});

describe("actualizarMovimiento", () => {
  it("actualiza el documento existente (no crea uno nuevo)", async () => {
    mockUpdateDoc.mockResolvedValue(undefined);

    await actualizarMovimiento("uid-123", "mov-1", {
      tipo: "gasto",
      monto: 7000,
      descripcion: "Almuerzo actualizado",
      categoria: "comida",
      fecha: "2026-08-15",
    });

    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
    expect(mockAddDoc).not.toHaveBeenCalled();
    const [ref, payload] = mockUpdateDoc.mock.calls[0];
    expect(ref).toBe("doc-mov-1");
    expect(payload.monto).toBe(7000);
    expect(payload.descripcion).toBe("Almuerzo actualizado");
  });

  it("limpia numeroPersonas con deleteField() si compartido pasa a false", async () => {
    mockUpdateDoc.mockResolvedValue(undefined);

    await actualizarMovimiento("uid-123", "mov-1", {
      tipo: "gasto",
      monto: 7000,
      descripcion: "Cena",
      categoria: "comida",
      fecha: "2026-08-15",
      compartido: false,
    });

    const [, payload] = mockUpdateDoc.mock.calls[0];
    expect(payload.numeroPersonas).toBe("DELETE_FIELD");
  });

  it("limpia previsible con deleteField() si esPrevisible pasa a false", async () => {
    mockUpdateDoc.mockResolvedValue(undefined);

    await actualizarMovimiento("uid-123", "mov-1", {
      tipo: "gasto",
      monto: 7000,
      descripcion: "Matrícula",
      categoria: "otros",
      fecha: "2026-08-15",
      esPrevisible: false,
    });

    const [, payload] = mockUpdateDoc.mock.calls[0];
    expect(payload.previsible).toBe("DELETE_FIELD");
  });
});

describe("eliminarMovimiento", () => {
  it("borra el documento correcto por id", async () => {
    mockDeleteDoc.mockResolvedValue(undefined);

    await eliminarMovimiento("uid-123", "mov-1");

    expect(mockDeleteDoc).toHaveBeenCalledWith("doc-mov-1");
  });
});
