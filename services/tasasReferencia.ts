import { doc, getDoc } from "firebase/firestore";

import { db } from "../firebaseConfig";

export type TasaReferencia = {
  valor: number;
  cantidadObservaciones: number;
  fechaActualizacion: string;
  fuente: string;
};

export async function obtenerTasaTipConsumo(): Promise<TasaReferencia | null> {
  const snapshot = await getDoc(doc(db, "tasasReferencia", "tipConsumo"));
  if (!snapshot.exists()) return null;
  return snapshot.data() as TasaReferencia;
}
