jest.mock("firebase/firestore", () => ({
  collection: jest.fn((_db, ...segments) => `col:${segments.join("/")}`),
  doc: jest.fn(() => "usuarios/uid-123"),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  writeBatch: jest.fn(),
  serverTimestamp: jest.fn(() => "SERVER_TIMESTAMP"),
}));

jest.mock("firebase/auth", () => ({
  deleteUser: jest.fn(),
  EmailAuthProvider: { credential: jest.fn(() => "CREDENCIAL") },
  reauthenticateWithCredential: jest.fn(),
}));

jest.mock("../../firebaseConfig", () => ({ db: {}, auth: { currentUser: null } }));

import { deleteUser, reauthenticateWithCredential } from "firebase/auth";
import {
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

import { auth } from "../../firebaseConfig";
import {
  aceptarConsentimiento,
  actualizarUsuario,
  crearUsuarioSiNoExiste,
  eliminarCuentaCompleta,
  necesitaConsentimiento,
  obtenerPerfilUsuario,
  obtenerUsuario,
} from "@/services/usuarios";

const mockDoc = doc as jest.Mock;
const mockGetDoc = getDoc as jest.Mock;
const mockGetDocs = getDocs as jest.Mock;
const mockSetDoc = setDoc as jest.Mock;
const mockUpdateDoc = updateDoc as jest.Mock;
const mockDeleteDoc = deleteDoc as jest.Mock;
const mockWriteBatch = writeBatch as jest.Mock;
const mockReauth = reauthenticateWithCredential as jest.Mock;
const mockDeleteUser = deleteUser as jest.Mock;

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

describe("obtenerUsuario", () => {
  it("devuelve nombre y apellido si el documento existe", async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ nombre: "Daniela", apellido: "Saavedra" }),
    });

    await expect(obtenerUsuario("uid-123")).resolves.toEqual({
      nombre: "Daniela",
      apellido: "Saavedra",
    });
  });

  it("devuelve null si el documento no existe", async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });

    await expect(obtenerUsuario("uid-123")).resolves.toBeNull();
  });
});

describe("obtenerPerfilUsuario", () => {
  it("devuelve el perfil completo para prellenar 'Editar mis datos'", async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        nombre: "Daniela",
        apellido: "Saavedra",
        fechaNacimiento: "2000-01-01",
        sueldoMensual: 500000,
      }),
    });

    await expect(obtenerPerfilUsuario("uid-123")).resolves.toEqual({
      nombre: "Daniela",
      apellido: "Saavedra",
      fechaNacimiento: "2000-01-01",
      sueldoMensual: 500000,
    });
  });

  it("sueldoMensual ausente se normaliza a null", async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        nombre: "Daniela",
        apellido: "Saavedra",
        fechaNacimiento: "2000-01-01",
      }),
    });

    const perfil = await obtenerPerfilUsuario("uid-123");
    expect(perfil?.sueldoMensual).toBeNull();
  });

  it("devuelve null si el documento no existe", async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });

    await expect(obtenerPerfilUsuario("uid-123")).resolves.toBeNull();
  });
});

describe("actualizarUsuario", () => {
  it("actualiza nombre, apellido, fecha de nacimiento y sueldo — sin tocar el correo", async () => {
    mockUpdateDoc.mockResolvedValue(undefined);

    await actualizarUsuario("uid-123", {
      nombre: "Daniela",
      apellido: "Saavedra Santana",
      fechaNacimiento: "2000-05-20",
      sueldoMensual: 800000,
    });

    expect(mockUpdateDoc).toHaveBeenCalledWith("usuarios/uid-123", {
      nombre: "Daniela",
      apellido: "Saavedra Santana",
      fechaNacimiento: "2000-05-20",
      sueldoMensual: 800000,
    });
  });

  it("sueldoMensual ausente se guarda como null", async () => {
    mockUpdateDoc.mockResolvedValue(undefined);

    await actualizarUsuario("uid-123", {
      nombre: "Daniela",
      apellido: "Saavedra",
      fechaNacimiento: "2000-05-20",
    });

    expect(mockUpdateDoc).toHaveBeenCalledWith(
      "usuarios/uid-123",
      expect.objectContaining({ sueldoMensual: null }),
    );
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

// Menú de usuario, "Darse de baja" (.claude/dropdown-cerrar-sesion.md):
// eliminación completa de la cuenta. Se mockea `writeBatch` devolviendo
// un objeto con `delete`/`commit` espiados, para verificar que se borra
// cada documento de las dos subcolecciones antes del documento del
// usuario y de la cuenta de Auth.
describe("eliminarCuentaCompleta", () => {
  function usuarioFirebaseMock() {
    return { uid: "uid-123", email: "daniela@example.com" };
  }

  function mockLote() {
    return { delete: jest.fn(), commit: jest.fn().mockResolvedValue(undefined) };
  }

  it("reautentica, borra ambas subcolecciones, el documento del usuario y la cuenta de Auth, en ese orden", async () => {
    const usuario = usuarioFirebaseMock();
    (auth as { currentUser: unknown }).currentUser = usuario;
    mockReauth.mockResolvedValue(undefined);
    mockGetDocs
      .mockResolvedValueOnce({
        docs: [{ ref: "movimiento-1" }, { ref: "movimiento-2" }],
      })
      .mockResolvedValueOnce({ docs: [{ ref: "escenario-1" }] });
    const loteMovimientos = mockLote();
    const loteEscenarios = mockLote();
    mockWriteBatch.mockReturnValueOnce(loteMovimientos).mockReturnValueOnce(loteEscenarios);
    mockDeleteDoc.mockResolvedValue(undefined);
    mockDeleteUser.mockResolvedValue(undefined);

    const orden: string[] = [];
    mockReauth.mockImplementation(async () => {
      orden.push("reauth");
    });
    loteMovimientos.commit.mockImplementation(async () => {
      orden.push("borra-movimientos");
    });
    loteEscenarios.commit.mockImplementation(async () => {
      orden.push("borra-escenarios");
    });
    mockDeleteDoc.mockImplementation(async () => {
      orden.push("borra-usuario");
    });
    mockDeleteUser.mockImplementation(async () => {
      orden.push("borra-auth");
    });

    await eliminarCuentaCompleta("contraseña-correcta");

    expect(mockReauth).toHaveBeenCalledWith(usuario, "CREDENCIAL");
    expect(loteMovimientos.delete).toHaveBeenCalledWith("movimiento-1");
    expect(loteMovimientos.delete).toHaveBeenCalledWith("movimiento-2");
    expect(loteEscenarios.delete).toHaveBeenCalledWith("escenario-1");
    expect(mockDeleteDoc).toHaveBeenCalledWith("usuarios/uid-123");
    expect(mockDeleteUser).toHaveBeenCalledWith(usuario);
    expect(orden).toEqual([
      "reauth",
      "borra-movimientos",
      "borra-escenarios",
      "borra-usuario",
      "borra-auth",
    ]);
  });

  it("si la contraseña es incorrecta, no borra nada (reauth falla primero)", async () => {
    (auth as { currentUser: unknown }).currentUser = usuarioFirebaseMock();
    mockReauth.mockRejectedValue({ code: "auth/invalid-credential" });

    await expect(eliminarCuentaCompleta("contraseña-mala")).rejects.toMatchObject({
      code: "auth/invalid-credential",
    });

    expect(mockGetDocs).not.toHaveBeenCalled();
    expect(mockDeleteDoc).not.toHaveBeenCalled();
    expect(mockDeleteUser).not.toHaveBeenCalled();
  });

  it("sin sesión de email/contraseña activa, rechaza antes de reautenticar", async () => {
    (auth as { currentUser: unknown }).currentUser = null;

    await expect(eliminarCuentaCompleta("cualquiera")).rejects.toThrow();
    expect(mockReauth).not.toHaveBeenCalled();
  });
});
