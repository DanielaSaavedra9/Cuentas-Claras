// RF07 Bloque 0 — actualiza tasasReferencia/tipConsumo con datos reales
// de la API del Banco Central de Chile. Es un script manual (Node +
// Firebase Admin SDK), no una Cloud Function: el proyecto está en plan
// Spark (sin facturación) y Cloud Functions no puede hacer llamadas HTTP
// salientes ahí. Ver .claude/PROJECT_CONTEXT.md, sección "Arquitectura
// definida", y .claude/rf07-checklist.md Bloque 0.
//
// Uso:
//   1. BCCH_TOKEN debe estar en el .env de la raíz del proyecto
//   2. Descargar la clave de cuenta de servicio desde Firebase Console
//      (Configuración del proyecto → Cuentas de servicio → Generar nueva
//      clave privada) y guardarla como scripts/serviceAccountKey.json
//      (ya cubierto por .gitignore — nunca commitear este archivo)
//   3. node scripts/actualizar-tasa-consumo.mjs

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function cargarEnv(rutaEnv) {
  const contenido = readFileSync(rutaEnv, "utf-8");
  for (const linea of contenido.split("\n")) {
    const match = linea.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const [, clave, valor] = match;
      if (!(clave.trim() in process.env)) {
        process.env[clave.trim()] = valor.trim();
      }
    }
  }
}

cargarEnv(path.join(__dirname, "..", ".env"));

const BCCH_BASE_URL = "https://si3.bcentral.cl/SieteRestWS/SieteRestWS.ashx";
const SERIE_TIP_CONSUMO = "F022.CON.TIP.Z.NO.Z.D";
const VENTANA_DIAS = 35; // ~4-5 publicaciones, la serie sale cada 8 días

const TOKEN = process.env.BCCH_TOKEN;
if (!TOKEN) {
  console.error("❌ Falta BCCH_TOKEN en el archivo .env de la raíz del proyecto");
  process.exit(1);
}

function formatoFecha(d) {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

async function fetchObservacionesValidas(seriesId, diasHaciaAtras) {
  const hoy = new Date();
  const desde = new Date(hoy);
  desde.setDate(hoy.getDate() - diasHaciaAtras);

  const url = new URL(BCCH_BASE_URL);
  url.searchParams.set("token", TOKEN);
  url.searchParams.set("function", "GetSeries");
  url.searchParams.set("timeseries", seriesId);
  url.searchParams.set("firstdate", formatoFecha(desde));
  url.searchParams.set("lastdate", formatoFecha(hoy));

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Error HTTP consultando API BCCh (${seriesId}): ${response.status}`);
  }

  const data = await response.json();
  if (data.Codigo !== 0) {
    throw new Error(`API BCCh devolvió error para ${seriesId}: ${data.Descripcion}`);
  }

  const observaciones = data.Series?.Obs ?? [];
  const validas = observaciones.filter((obs) => obs.statusCode === "OK");
  if (validas.length === 0) {
    throw new Error(`No hay observaciones válidas para ${seriesId} en el rango consultado`);
  }
  return validas;
}

async function fetchPromedioTIPConsumo() {
  const validas = await fetchObservacionesValidas(SERIE_TIP_CONSUMO, VENTANA_DIAS);

  const valores = validas.map((obs) => parseFloat(obs.value));
  const promedio = valores.reduce((acc, v) => acc + v, 0) / valores.length;

  const ultima = validas[validas.length - 1];
  const [dia, mes, anio] = ultima.indexDateString.split("-");
  const fechaUltimaObs = `${anio}-${mes}-${dia}`;

  return {
    valor: Number(promedio.toFixed(2)),
    cantidadObservaciones: valores.length,
    fechaUltimaObs,
  };
}

async function main() {
  console.log("== RF07 Bloque 0: actualizar tasasReferencia/tipConsumo ==");
  console.log(`Consultando ${SERIE_TIP_CONSUMO} (ventana de ${VENTANA_DIAS} días)...`);

  const resultado = await fetchPromedioTIPConsumo();
  console.log(
    `Promedio: ${resultado.valor}% (${resultado.cantidadObservaciones} observaciones, última: ${resultado.fechaUltimaObs})`,
  );

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

  await db.collection("tasasReferencia").doc("tipConsumo").set({
    valor: resultado.valor,
    cantidadObservaciones: resultado.cantidadObservaciones,
    fechaActualizacion: resultado.fechaUltimaObs,
    fuente: "banco-central-script-manual",
  });

  console.log("✅ tasasReferencia/tipConsumo actualizado en Firestore.");
}

main().catch((error) => {
  console.error("\n❌ Error:", error.message);
  process.exit(1);
});
