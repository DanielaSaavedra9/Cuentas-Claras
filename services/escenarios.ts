import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebaseConfig";

export type EscenarioParametros = {
  monto: number;
  tasa: number;
  plazo: number;
};

export type EscenarioResultado = {
  cuotaMensual: number;
  totalIntereses: number;
  impuestos: number;
  ctc: number;
  cae: number;
};

export type EscenarioGuardado = {
  id: string;
  parametros: EscenarioParametros;
  resultado: EscenarioResultado;
  fechaGuardadoMillis?: number;
};

function refEscenarios(uid: string) {
  return collection(db, "Usuarios", uid, "escenariosGuardados");
}

function refEscenario(uid: string, id: string) {
  return doc(db, "Usuarios", uid, "escenariosGuardados", id);
}

export async function guardarEscenario(
  uid: string,
  parametros: EscenarioParametros,
  resultado: EscenarioResultado,
): Promise<string> {
  const ref = await addDoc(refEscenarios(uid), {
    parametros,
    resultado,
    fechaGuardado: serverTimestamp(),
  });
  return ref.id;
}

export async function eliminarEscenario(uid: string, id: string): Promise<void> {
  await deleteDoc(refEscenario(uid, id));
}

export async function listarEscenariosGuardados(
  uid: string,
): Promise<EscenarioGuardado[]> {
  const snapshot = await getDocs(refEscenarios(uid));
  const escenarios = snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      parametros: data.parametros,
      resultado: data.resultado,
      fechaGuardadoMillis: data.fechaGuardado?.toMillis?.(),
    };
  });
  return escenarios.sort(
    (a, b) => (b.fechaGuardadoMillis ?? 0) - (a.fechaGuardadoMillis ?? 0),
  );
}
