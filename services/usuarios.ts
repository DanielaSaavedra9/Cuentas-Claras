import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import {
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";

import { auth, db } from "../firebaseConfig";

export type DatosUsuarioNuevo = {
  nombre: string;
  apellido: string;
  correo: string;
  fechaNacimiento: string;
  sueldoMensual?: number | null;
  consentimientoAceptado: boolean;
};

// Menú de usuario (.claude/dropdown-cerrar-sesion.md, Bloque 2): campos
// editables desde "Editar mis datos". El correo NO está acá — se decidió
// que quede de solo lectura (evita el flujo de updateEmail + verificación
// + re-autenticación, ver el documento).
export type DatosActualizarUsuario = {
  nombre: string;
  apellido: string;
  fechaNacimiento: string;
  sueldoMensual?: number | null;
};

export type PerfilUsuario = {
  nombre: string;
  apellido: string;
  fechaNacimiento: string;
  sueldoMensual: number | null;
};

function refUsuario(uid: string) {
  return doc(db, "Usuarios", uid);
}

function refSubcoleccion(uid: string, nombre: string) {
  return collection(db, "Usuarios", uid, nombre);
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

export async function obtenerUsuario(
  uid: string,
): Promise<{ nombre: string; apellido: string } | null> {
  const snapshot = await getDoc(refUsuario(uid));
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  return { nombre: data.nombre, apellido: data.apellido };
}

// Menú de usuario, Bloque 2: prellenar "Editar mis datos" con los valores
// actuales. Función aparte de `obtenerUsuario` (esa la usan 5 pantallas
// solo para el saludo/inicial del avatar, no hace falta traer más campos
// ahí) — evita cambiar el contrato de una función ya usada en 5 lugares.
export async function obtenerPerfilUsuario(
  uid: string,
): Promise<PerfilUsuario | null> {
  const snapshot = await getDoc(refUsuario(uid));
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  return {
    nombre: data.nombre,
    apellido: data.apellido,
    fechaNacimiento: data.fechaNacimiento,
    sueldoMensual: data.sueldoMensual ?? null,
  };
}

export async function actualizarUsuario(
  uid: string,
  datos: DatosActualizarUsuario,
): Promise<void> {
  await updateDoc(refUsuario(uid), {
    nombre: datos.nombre,
    apellido: datos.apellido,
    fechaNacimiento: datos.fechaNacimiento,
    sueldoMensual: datos.sueldoMensual ?? null,
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

// Borra todos los documentos de una subcolección en tandas de 500 (límite
// de un writeBatch de Firestore) — ninguna de las dos subcolecciones que
// usa este proyecto (movimientos, escenariosGuardados) debería acercarse
// a ese número en uso real, pero no se asume.
const TAMANO_LOTE = 500;

async function eliminarColeccionCompleta(
  uid: string,
  nombreSubcoleccion: string,
): Promise<void> {
  const snapshot = await getDocs(refSubcoleccion(uid, nombreSubcoleccion));
  const documentos = snapshot.docs;
  for (let i = 0; i < documentos.length; i += TAMANO_LOTE) {
    const lote = writeBatch(db);
    for (const documento of documentos.slice(i, i + TAMANO_LOTE)) {
      lote.delete(documento.ref);
    }
    await lote.commit();
  }
}

// Menú de usuario, Bloque 3 ("Darse de baja"): eliminación completa de la
// cuenta, sin dejar datos huérfanos (decisión de la usuaria, ver
// .claude/dropdown-cerrar-sesion.md — cumple el derecho de eliminación de
// la Ley N° 19.628). Requiere reautenticación con la contraseña actual
// justo antes de `deleteUser()`, porque Firebase exige un login reciente
// para esa operación (`auth/requires-recent-login` si no). Solo sirve
// para cuentas de email/contraseña — Google Sign-In sigue diferido
// (RF01), si se retoma esta función necesita un `credential` distinto
// para esas cuentas.
//
// Orden: primero se borran las subcolecciones y el documento de
// Firestore, y al final el usuario de Auth — si algo falla a mitad de
// camino, es preferible que sobreviva el usuario de Auth (puede
// reintentar "Darse de baja") a que sobreviva sin datos pero sin poder
// volver a autenticarse para reintentar el borrado.
export async function eliminarCuentaCompleta(password: string): Promise<void> {
  const usuario = auth.currentUser;
  if (!usuario?.email) {
    throw new Error("No hay una sesión de email/contraseña activa.");
  }

  const credencial = EmailAuthProvider.credential(usuario.email, password);
  await reauthenticateWithCredential(usuario, credencial);

  const uid = usuario.uid;
  await eliminarColeccionCompleta(uid, "movimientos");
  await eliminarColeccionCompleta(uid, "escenariosGuardados");
  await deleteDoc(refUsuario(uid));
  await deleteUser(usuario);
}
