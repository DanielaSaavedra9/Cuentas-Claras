import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  QueryDocumentSnapshot,
  serverTimestamp,
  updateDoc,
  where,
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

export type Movimiento = DatosMovimientoNuevo & {
  id: string;
  creadoEnMillis?: number;
};

function refMovimientos(uid: string) {
  return collection(db, "Usuarios", uid, "movimientos");
}

function refMovimiento(uid: string, id: string) {
  return doc(db, "Usuarios", uid, "movimientos", id);
}

function mapearMovimiento(snapshot: QueryDocumentSnapshot): Movimiento {
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
    creadoEnMillis: data.creadoEn?.toMillis?.(),
  };
}

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

// `fecha` solo guarda el día (YYYY-MM-DD), así que dos movimientos del
// mismo día quedan empatados ahí — creadoEnMillis desempata para que el
// más reciente aparezca primero.
function ordenarPorFechaYCreacion(movimientos: Movimiento[]): Movimiento[] {
  return [...movimientos].sort((a, b) => {
    if (a.fecha !== b.fecha) return a.fecha < b.fecha ? 1 : -1;
    return (b.creadoEnMillis ?? 0) - (a.creadoEnMillis ?? 0);
  });
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
    creadoEn: serverTimestamp(),
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
  return ordenarPorFechaYCreacion(snapshot.docs.map(mapearMovimiento));
}

export async function obtenerMovimiento(
  uid: string,
  id: string,
): Promise<Movimiento | null> {
  const snapshot = await getDoc(refMovimiento(uid, id));
  if (!snapshot.exists()) return null;
  return mapearMovimiento(snapshot as QueryDocumentSnapshot);
}

// Bloque 1 de RF03: listener en tiempo real acotado al mes/año pedidos,
// usando rango sobre "fecha" (formato YYYY-MM-DD) + orderBy del mismo
// campo, que no requiere índice compuesto en Firestore.
export function escucharMovimientosDelMes(
  uid: string,
  anio: number,
  mes: number,
  onChange: (movimientos: Movimiento[]) => void,
): () => void {
  const inicio = `${anio}-${pad2(mes)}-01`;
  const anioFin = mes === 12 ? anio + 1 : anio;
  const mesFin = mes === 12 ? 1 : mes + 1;
  const fin = `${anioFin}-${pad2(mesFin)}-01`;

  const q = query(
    refMovimientos(uid),
    where("fecha", ">=", inicio),
    where("fecha", "<", fin),
    orderBy("fecha", "desc"),
  );

  return onSnapshot(q, (snapshot) => {
    onChange(ordenarPorFechaYCreacion(snapshot.docs.map(mapearMovimiento)));
  });
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
    creadoEn: serverTimestamp(),
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
