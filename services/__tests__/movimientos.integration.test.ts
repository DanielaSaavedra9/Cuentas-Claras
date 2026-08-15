// Firestore mockeado con un store en memoria para poder verificar el ciclo
// completo crear → aparece → editar → se actualiza → eliminar → ya no está,
// sin tocar el proyecto real.
jest.mock("firebase/firestore", () => {
  const store = new Map<string, Record<string, unknown>>();
  let counter = 0;
  const DELETE_FIELD = Symbol("DELETE_FIELD");

  return {
    collection: jest.fn(() => "col-movimientos"),
    doc: jest.fn((_db, ...segments) => ({
      __id: segments[segments.length - 1],
    })),
    addDoc: jest.fn(async (_col, data: Record<string, unknown>) => {
      const id = `mov-${++counter}`;
      store.set(id, { ...data });
      return { id };
    }),
    getDoc: jest.fn(async (ref: { __id: string }) => {
      const data = store.get(ref.__id);
      return {
        exists: () => data !== undefined,
        id: ref.__id,
        data: () => data,
      };
    }),
    updateDoc: jest.fn(async (ref: { __id: string }, payload: Record<string, unknown>) => {
      const current = store.get(ref.__id) ?? {};
      const next = { ...current };
      for (const [key, value] of Object.entries(payload)) {
        if (value === DELETE_FIELD) delete next[key];
        else next[key] = value;
      }
      store.set(ref.__id, next);
    }),
    deleteDoc: jest.fn(async (ref: { __id: string }) => {
      store.delete(ref.__id);
    }),
    deleteField: jest.fn(() => DELETE_FIELD),
  };
});

jest.mock("../../firebaseConfig", () => ({ db: {} }));

import {
  actualizarMovimiento,
  crearMovimiento,
  eliminarMovimiento,
  obtenerMovimiento,
} from "@/services/movimientos";

describe("Integración: crear → editar → eliminar movimiento", () => {
  it("recorre el ciclo completo sobre el mismo documento", async () => {
    const id = await crearMovimiento("uid-123", {
      tipo: "gasto",
      monto: 5000,
      descripcion: "Almuerzo",
      categoria: "comida",
      fecha: "2026-08-14",
    });

    let movimiento = await obtenerMovimiento("uid-123", id);
    expect(movimiento).toMatchObject({
      id,
      tipo: "gasto",
      monto: 5000,
      descripcion: "Almuerzo",
      categoria: "comida",
      fecha: "2026-08-14",
      compartido: false,
      esPrevisible: false,
    });

    await actualizarMovimiento("uid-123", id, {
      tipo: "gasto",
      monto: 7000,
      descripcion: "Almuerzo actualizado",
      categoria: "comida",
      fecha: "2026-08-15",
    });

    movimiento = await obtenerMovimiento("uid-123", id);
    expect(movimiento?.monto).toBe(7000);
    expect(movimiento?.descripcion).toBe("Almuerzo actualizado");
    expect(movimiento?.fecha).toBe("2026-08-15");

    await eliminarMovimiento("uid-123", id);

    movimiento = await obtenerMovimiento("uid-123", id);
    expect(movimiento).toBeNull();
  });
});
