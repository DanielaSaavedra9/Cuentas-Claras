// Firestore mockeado con un store en memoria, mismo patrón que
// services/__tests__/movimientos.integration.test.ts — Nivel 2 del
// Bloque 6 de RF05: marcar previsible → documento inicializado, abonar →
// historial/montoAbonado/cuotaSugerida actualizados, eliminar → removido.
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
    serverTimestamp: jest.fn(() => "SERVER_TIMESTAMP"),
  };
});

jest.mock("../../firebaseConfig", () => ({ db: {} }));

import {
  crearMovimiento,
  eliminarMovimiento,
  obtenerMovimiento,
  registrarAbono,
} from "@/services/movimientos";

describe("Integración: gasto previsible — crear, abonar, eliminar", () => {
  it("marcar como previsible crea el documento con previsible inicializado", async () => {
    const id = await crearMovimiento("uid-123", {
      tipo: "gasto",
      monto: 400000,
      descripcion: "Matrícula",
      categoria: "otros",
      fecha: "2026-08-15",
      esPrevisible: true,
      previsibleFechaLimite: "2026-12-01",
    });

    const movimiento = await obtenerMovimiento("uid-123", id);
    expect(movimiento?.esPrevisible).toBe(true);
    expect(movimiento?.previsibleFechaLimite).toBe("2026-12-01");
    expect(movimiento?.previsibleMontoAbonado).toBe(0);
    expect(movimiento?.previsibleAbonosMensuales).toEqual([]);
    expect(movimiento?.previsibleCuotaSugerida).toBeGreaterThan(0);
  });

  it("registrar un abono actualiza el historial, montoAbonado y recalcula cuotaSugerida", async () => {
    const id = await crearMovimiento("uid-123", {
      tipo: "gasto",
      monto: 400000,
      descripcion: "Matrícula",
      categoria: "otros",
      fecha: "2026-08-15",
      esPrevisible: true,
      previsibleFechaLimite: "2026-12-01",
    });

    const antes = await obtenerMovimiento("uid-123", id);
    const cuotaAntes = antes!.previsibleCuotaSugerida!;

    await registrarAbono("uid-123", id, {
      mes: 8,
      anio: 2026,
      montoAbonado: cuotaAntes,
    });

    const despues = await obtenerMovimiento("uid-123", id);
    expect(despues?.previsibleMontoAbonado).toBe(cuotaAntes);
    expect(despues?.previsibleAbonosMensuales).toHaveLength(1);
    expect(despues?.previsibleAbonosMensuales?.[0]).toMatchObject({
      mes: 8,
      anio: 2026,
      montoAbonado: cuotaAntes,
      diferenciaSugerido: 0,
    });
    // Con un mes menos de saldo pendiente, la cuota recalculada baja.
    expect(despues!.previsibleCuotaSugerida!).toBeLessThan(cuotaAntes);
  });

  it("eliminar un gasto previsible borra el documento completo", async () => {
    const id = await crearMovimiento("uid-123", {
      tipo: "gasto",
      monto: 400000,
      descripcion: "Matrícula",
      categoria: "otros",
      fecha: "2026-08-15",
      esPrevisible: true,
      previsibleFechaLimite: "2026-12-01",
    });

    await registrarAbono("uid-123", id, {
      mes: 8,
      anio: 2026,
      montoAbonado: 50000,
    });

    await eliminarMovimiento("uid-123", id);

    await expect(obtenerMovimiento("uid-123", id)).resolves.toBeNull();
  });
});
