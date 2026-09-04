// RF08 Bloque 0 — actualiza tasasReferencia/cuentaRemunerada con una
// carga MANUAL del equipo (procedimiento PO 01 de la tesis). No hay
// llamada a la API del Banco Central: la tasa de cuenta remunerada no
// tiene una serie pública, se define una vez al mes con un valor de
// referencia acordado por el equipo.
//
// Propósito:      dejar en Firestore la tasa anual efectiva de referencia
//                 para cuentas remuneradas, usada por el simulador de
//                 ahorro (RF08) al comparar contra una cuenta de ahorro.
// Alcance:        solo el documento tasasReferencia/cuentaRemunerada.
// Responsable:    equipo del proyecto (carga controlada, ~1 vez al mes).
// Procedimiento:  node scripts/actualizar-tasa-remunerada.mjs <tasaAnual> <mesReferencia YYYY-MM>
//                 ej.: node scripts/actualizar-tasa-remunerada.mjs 3.8 2026-09
//
// Requisitos previos:
//   - scripts/serviceAccountKey.json descargado desde Firebase Console
//     (mismo archivo que usa actualizar-tasas-banco-central.mjs, ya
//     cubierto por .gitignore — nunca commitear).

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const [tasaAnualArg, mesReferenciaArg] = process.argv.slice(2);

if (!tasaAnualArg || !mesReferenciaArg) {
  console.error(
    "❌ Uso: node scripts/actualizar-tasa-remunerada.mjs <tasaAnual> <mesReferencia YYYY-MM>\n" +
      "   ej.: node scripts/actualizar-tasa-remunerada.mjs 3.8 2026-09",
  );
  process.exit(1);
}

const tasaAnual = Number(tasaAnualArg);
if (!Number.isFinite(tasaAnual) || tasaAnual <= 0) {
  console.error(`❌ tasaAnual inválida: "${tasaAnualArg}". Debe ser un número mayor que 0.`);
  process.exit(1);
}

if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mesReferenciaArg)) {
  console.error(`❌ mesReferencia inválido: "${mesReferenciaArg}". Formato esperado: YYYY-MM.`);
  process.exit(1);
}

function formatoFecha(d) {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

async function main() {
  console.log("== RF08 Bloque 0: actualizar tasasReferencia/cuentaRemunerada (carga manual) ==");
  console.log(`  valor: ${tasaAnual}% anual efectiva | mesReferencia: ${mesReferenciaArg}`);

  const rutaClave = path.join(__dirname, "serviceAccountKey.json");
  let credenciales;
  try {
    credenciales = JSON.parse(readFileSync(rutaClave, "utf-8"));
  } catch {
    console.error(
      `❌ No se encontró ${rutaClave}. Descárgala desde Firebase Console → Configuración del proyecto → Cuentas de servicio → Generar nueva clave privada.`,
    );
    process.exit(1);
  }

  const app = initializeApp({ credential: cert(credenciales) });
  const db = getFirestore(app, "cuentas-claras-db");

  await db.collection("tasasReferencia").doc("cuentaRemunerada").set({
    valor: Number(tasaAnual.toFixed(2)),
    mesReferencia: mesReferenciaArg,
    fechaActualizacion: formatoFecha(new Date()),
    fuente: "carga-manual-equipo",
  });

  console.log("✅ tasasReferencia/cuentaRemunerada actualizado en Firestore.");
}

main().catch((error) => {
  console.error("\n❌ Error:", error.message);
  process.exit(1);
});
