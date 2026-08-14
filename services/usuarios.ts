import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";

import { db } from "../firebaseConfig";

export type DatosUsuarioNuevo = {
  nombre: string;
  apellido: string;
  correo: string;
  fechaNacimiento: string;
  sueldoMensual?: number | null;
  consentimientoAceptado: boolean;
};

function refUsuario(uid: string) {
  return doc(db, "Usuarios", uid);
}

// Idempotente: si el documento ya existe no lo sobrescribe. Necesario
// porque se llama después de cualquier login/registro exitoso (email y
// Google), no solo al crear la cuenta la primera vez.
export async function crearUsuarioSiNoExiste(
  uid: string,
  datos: DatosUsuarioNuevo,
): Promise<void> {
  const ref = refUsuario(uid);
  const snapshot = await getDoc(ref);
  if (snapshot.exists()) return;

  await setDoc(ref, {
    nombre: datos.nombre,
    apellido: datos.apellido,
    correo: datos.correo,
    fechaNacimiento: datos.fechaNacimiento,
    fechaRegistro: serverTimestamp(),
    sueldoMensual: datos.sueldoMensual ?? null,
    diaPago: null,
    repiteSueldo: false,
    consentimientoAceptado: datos.consentimientoAceptado,
    fechaConsentimiento: datos.consentimientoAceptado
      ? serverTimestamp()
      : null,
  });
}

export async function necesitaConsentimiento(uid: string): Promise<boolean> {
  const snapshot = await getDoc(refUsuario(uid));
  if (!snapshot.exists()) return true;
  return snapshot.data().consentimientoAceptado !== true;
}

export async function aceptarConsentimiento(uid: string): Promise<void> {
  await updateDoc(refUsuario(uid), {
    consentimientoAceptado: true,
    fechaConsentimiento: serverTimestamp(),
  });
}
