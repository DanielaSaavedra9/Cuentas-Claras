import { doc, getDoc } from "firebase/firestore";

import { db } from "../firebaseConfig";

// tipConsumo (RF07) y cuentaAhorro (RF08) comparten shape: ambos vienen
// de la API del Banco Central vía scripts/actualizar-tasas-banco-central.mjs.
export type TasaReferencia = {
  valor: number;
  cantidadObservaciones: number;
  fechaActualizacion: string;
  fuente: string;
};

// cuentaRemunerada (RF08) es carga manual del equipo: no tiene
// cantidadObservaciones, lleva el mes de referencia en su lugar.
export type TasaReferenciaManual = {
  valor: number;
  mesReferencia: string;
  fechaActualizacion: string;
  fuente: string;
};

export async function obtenerTasaTipConsumo(): Promise<TasaReferencia | null> {
  const snapshot = await getDoc(doc(db, "tasasReferencia", "tipConsumo"));
  if (!snapshot.exists()) return null;
  return snapshot.data() as TasaReferencia;
}

export async function obtenerTasaCuentaAhorro(): Promise<TasaReferencia | null> {
  const snapshot = await getDoc(doc(db, "tasasReferencia", "cuentaAhorro"));
  if (!snapshot.exists()) return null;
  return snapshot.data() as TasaReferencia;
}

export async function obtenerTasaCuentaRemunerada(): Promise<TasaReferenciaManual | null> {
  const snapshot = await getDoc(doc(db, "tasasReferencia", "cuentaRemunerada"));
  if (!snapshot.exists()) return null;
  return snapshot.data() as TasaReferenciaManual;
}
