// Firestore mockeado con un store en memoria, mismo patrón que
// services/__tests__/movimientos.integration.test.ts — RF07 Bloque 5:
// guardar escenario → aparece en escenariosGuardados con la estructura
// correcta; eliminar → removido; listar → ordenado por fecha descendente.
jest.mock("firebase/firestore", () => {
  // Cada colección se identifica por su ruta completa (incluye el uid), así
  // que escenarios de distintos usuarios no se mezclan al listar — a
  // diferencia del mock de movimientos.integration.test.ts, que solo se usa
  // con un uid por archivo, aquí sí hace falta distinguir.
  const store = new Map<string, { col: string; data: Record<string, unknown> }>();
  let counter = 0;
  let reloj = 0;

  return {
    collection: jest.fn((_db, ...segments) => segments.join("/")),
    doc: jest.fn((_db, ...segments) => ({
      __id: segments[segments.length - 1],
    })),
    addDoc: jest.fn(async (col: string, data: Record<string, unknown>) => {
      const id = `esc-${++counter}`;
      store.set(id, { col, data: { ...data } });
      return { id };
    }),
    deleteDoc: jest.fn(async (ref: { __id: string }) => {
      store.delete(ref.__id);
    }),
    getDocs: jest.fn(async (col: string) => ({
      docs: Array.from(store.entries())
        .filter(([, entry]) => entry.col === col)
        .map(([id, entry]) => ({
          id,
          data: () => entry.data,
        })),
    })),
    // Reloj incremental (no Date.now()) para que el orden de guardado sea
    // determinístico aunque dos addDoc caigan en el mismo milisegundo real.
    serverTimestamp: jest.fn(() => {
      const millis = ++reloj;
      return { toMillis: () => millis };
    }),
  };
});

jest.mock("../../firebaseConfig", () => ({ db: {} }));

import {
  eliminarEscenario,
  guardarEscenario,
  listarEscenariosGuardados,
} from "@/services/escenarios";

describe("Integración: guardar, listar y eliminar escenarios", () => {
  it("guardar un escenario crea el documento con parametros y resultado correctos", async () => {
    const id = await guardarEscenario(
      "uid-123",
      { monto: 10000000, tasa: 23.98, plazo: 12 },
      {
        cuotaMensual: 945499,
        totalIntereses: 1345988,
        impuestos: 80000,
        ctc: 11425988,
        cae: 26.8,
      },
    );

    const escenarios = await listarEscenariosGuardados("uid-123");
    const guardado = escenarios.find((e) => e.id === id);

    expect(guardado).toBeDefined();
    expect(guardado?.parametros).toEqual({ monto: 10000000, tasa: 23.98, plazo: 12 });
    expect(guardado?.resultado).toEqual({
      cuotaMensual: 945499,
      totalIntereses: 1345988,
      impuestos: 80000,
      ctc: 11425988,
      cae: 26.8,
    });
  });

  it("listar devuelve los escenarios ordenados por fecha de guardado descendente", async () => {
    const primero = await guardarEscenario(
      "uid-456",
      { monto: 1000000, tasa: 20, plazo: 6 },
      { cuotaMensual: 1, totalIntereses: 1, impuestos: 1, ctc: 1, cae: 1 },
    );
    const segundo = await guardarEscenario(
      "uid-456",
      { monto: 2000000, tasa: 20, plazo: 6 },
      { cuotaMensual: 2, totalIntereses: 2, impuestos: 2, ctc: 2, cae: 2 },
    );

    const escenarios = await listarEscenariosGuardados("uid-456");
    expect(escenarios.map((e) => e.id)).toEqual([segundo, primero]);
  });

  it("eliminar un escenario lo remueve de la lista", async () => {
    const id = await guardarEscenario(
      "uid-789",
      { monto: 500000, tasa: 15, plazo: 3 },
      { cuotaMensual: 1, totalIntereses: 1, impuestos: 1, ctc: 1, cae: 1 },
    );

    await eliminarEscenario("uid-789", id);

    const escenarios = await listarEscenariosGuardados("uid-789");
    expect(escenarios.find((e) => e.id === id)).toBeUndefined();
  });
});
