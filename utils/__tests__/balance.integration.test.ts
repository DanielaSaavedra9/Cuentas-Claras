// Firestore mockeado con un store en memoria, mismo patrón que
// services/__tests__/movimientos.integration.test.ts — acá se prueba que
// un movimiento recién creado entra en el cálculo de balance del mes en
// que fue creado, y no en el de un mes anterior.
jest.mock("firebase/firestore", () => {
  const store = new Map<string, Record<string, unknown>>();
  let counter = 0;

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
    getDocs: jest.fn(async () => ({
      docs: Array.from(store.entries()).map(([id, data]) => ({
        id,
        data: () => data,
      })),
    })),
    deleteField: jest.fn(() => "DELETE_FIELD"),
    serverTimestamp: jest.fn(() => "SERVER_TIMESTAMP"),
  };
});

jest.mock("../../firebaseConfig", () => ({ db: {} }));

import { crearMovimiento, listarMovimientos } from "@/services/movimientos";
import { calcularBalance, filtrarPorMes } from "@/utils/balance";

describe("Integración: movimiento nuevo entra en el balance del mes correcto", () => {
  it("aparece en el balance del mes actual y no en el de un mes anterior", async () => {
    await crearMovimiento("uid-123", {
      tipo: "gasto",
      monto: 45200,
      descripcion: "Supermercado",
      categoria: "comida",
      fecha: "2026-08-14",
    });

    const todos = await listarMovimientos("uid-123");

    const mesActual = calcularBalance(filtrarPorMes(todos, 2026, 8));
    expect(mesActual.gastos).toBe(45200);

    const mesAnterior = calcularBalance(filtrarPorMes(todos, 2026, 7));
    expect(mesAnterior.gastos).toBe(0);
    expect(mesAnterior.neto).toBe(0);
  });
});
