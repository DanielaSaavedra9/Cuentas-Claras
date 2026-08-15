import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";

import { db } from "../firebaseConfig";

export type TipoMovimiento = "ingreso" | "gasto";

export type CategoriaMovimiento =
  | "ahorro"
  | "cuentas"
  | "comida"
  | "transporte"
  | "salud"
  | "otros";

export type DatosMovimientoNuevo = {
  tipo: TipoMovimiento;
  monto: number;
  descripcion: string;
  categoria: CategoriaMovimiento;
  fecha: string;
  compartido?: boolean;
  numeroPersonas?: number;
  esPrevisible?: boolean;
  previsibleFechaLimite?: string;
};

export type Movimiento = DatosMovimientoNuevo & { id: string };

function refMovimientos(uid: string) {
  return collection(db, "Usuarios", uid, "movimientos");
}

function refMovimiento(uid: string, id: string) {
  return doc(db, "Usuarios", uid, "movimientos", id);
}

// Los toggles "compartido"/"esPrevisible" solo aplican a gastos. El campo
// mínimo que guardan (numeroPersonas / previsible.fechaLimite) es lo que
// muestra el mockup de RF02 — cuotaSugerida, abonosMensuales y la división
// real del monto en el balance son lógica de RF04/RF05, todavía pendientes.
export async function crearMovimiento(
  uid: string,
  datos: DatosMovimientoNuevo,
): Promise<string> {
  const compartido = datos.tipo === "gasto" ? !!datos.compartido : false;
  const esPrevisible = datos.tipo === "gasto" ? !!datos.esPrevisible : false;

  const payload: Record<string, unknown> = {
    tipo: datos.tipo,
    monto: datos.monto,
    descripcion: datos.descripcion,
    categoria: datos.categoria,
    fecha: datos.fecha,
    compartido,
    esPrevisible,
  };

  if (compartido && datos.numeroPersonas) {
    payload.numeroPersonas = datos.numeroPersonas;
  }
  if (esPrevisible && datos.previsibleFechaLimite) {
    payload.previsible = { fechaLimite: datos.previsibleFechaLimite };
  }
  if (datos.tipo === "ingreso") {
    payload.generadoAutomaticamente = false;
  }

  const ref = await addDoc(refMovimientos(uid), payload);
  return ref.id;
}

// Temporal para poder probar el Bloque 2 (editar/eliminar) en dispositivo
// mientras no existe la lista real de RF03. Ordena en el cliente para no
// depender de un índice compuesto en Firestore.
export async function listarMovimientos(uid: string): Promise<Movimiento[]> {
  const snapshot = await getDocs(refMovimientos(uid));
  const movimientos = snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      tipo: data.tipo,
      monto: data.monto,
      descripcion: data.descripcion,
      categoria: data.categoria,
      fecha: data.fecha,
      compartido: data.compartido,
      numeroPersonas: data.numeroPersonas,
      esPrevisible: data.esPrevisible,
      previsibleFechaLimite: data.previsible?.fechaLimite,
    } as Movimiento;
  });
  return movimientos.sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
}

export async function obtenerMovimiento(
  uid: string,
  id: string,
): Promise<Movimiento | null> {
  const snapshot = await getDoc(refMovimiento(uid, id));
  if (!snapshot.exists()) return null;

  const data = snapshot.data();
  return {
    id: snapshot.id,
    tipo: data.tipo,
    monto: data.monto,
    descripcion: data.descripcion,
    categoria: data.categoria,
    fecha: data.fecha,
    compartido: data.compartido,
    numeroPersonas: data.numeroPersonas,
    esPrevisible: data.esPrevisible,
    previsibleFechaLimite: data.previsible?.fechaLimite,
  };
}

// A diferencia de crearMovimiento, acá se usa deleteField() para los
// campos opcionales cuando el toggle correspondiente queda desactivado —
// si no, un numeroPersonas o previsible.fechaLimite viejo quedaría
// "pegado" en el documento después de editar.
export async function actualizarMovimiento(
  uid: string,
  id: string,
  datos: DatosMovimientoNuevo,
): Promise<void> {
  const compartido = datos.tipo === "gasto" ? !!datos.compartido : false;
  const esPrevisible = datos.tipo === "gasto" ? !!datos.esPrevisible : false;

  const payload: Record<string, unknown> = {
    tipo: datos.tipo,
    monto: datos.monto,
    descripcion: datos.descripcion,
    categoria: datos.categoria,
    fecha: datos.fecha,
    compartido,
    esPrevisible,
    numeroPersonas:
      compartido && datos.numeroPersonas ? datos.numeroPersonas : deleteField(),
    previsible:
      esPrevisible && datos.previsibleFechaLimite
        ? { fechaLimite: datos.previsibleFechaLimite }
        : deleteField(),
    generadoAutomaticamente:
      datos.tipo === "ingreso" ? false : deleteField(),
  };

  await updateDoc(refMovimiento(uid, id), payload);
}

export async function eliminarMovimiento(
  uid: string,
  id: string,
): Promise<void> {
  await deleteDoc(refMovimiento(uid, id));
}
