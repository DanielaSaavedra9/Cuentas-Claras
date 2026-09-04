// RF07/RF08 Bloque 0 — actualiza tasasReferencia/tipConsumo y
// tasasReferencia/cuentaAhorro con datos reales de la API del Banco
// Central de Chile. Es un script manual (Node + Firebase Admin SDK), no
// una Cloud Function: el proyecto está en plan Spark (sin facturación) y
// Cloud Functions no puede hacer llamadas HTTP salientes ahí. Ver
// .claude/PROJECT_CONTEXT.md, sección "Arquitectura definida", y los
// checklists .claude/rf07-checklist.md / .claude/rf08-checklist.md Bloque 0.
//
// tasasReferencia/cuentaRemunerada NO se toca acá — es carga manual del
// equipo, sin API: usar scripts/actualizar-tasa-remunerada.mjs.
//
// Uso:
//   1. BCCH_TOKEN debe estar en el .env de la raíz del proyecto
//   2. Descargar la clave de cuenta de servicio desde Firebase Console
//      (Configuración del proyecto → Cuentas de servicio → Generar nueva
//      clave privada) y guardarla como scripts/serviceAccountKey.json
//      (ya cubierto por .gitignore — nunca commitear este archivo)
//   3. node scripts/actualizar-tasas-banco-central.mjs

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

const SERIE_CUENTA_AHORRO = "F022.CAP.TIP.D089.NO.Z.D"; // captaciones 30-89 días, tasa en base mensual
const VENTANA_DIAS_AHORRO = 7; // serie casi diaria (ND solo fines de semana/feriados), no necesita ventana amplia

const TOKEN = process.env.BCCH_TOKEN;
if (!TOKEN) {
  console.error("❌ Falta BCCH_TOKEN en el archivo .env de la raíz del proyecto");
  process.exit(1);
}

function formatoFecha(d) {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

// indexDateString viene como DD-MM-YYYY — se convierte a YYYY-MM-DD.
function fechaObsAIso(indexDateString) {
  const [dia, mes, anio] = indexDateString.split("-");
  return `${anio}-${mes}-${dia}`;
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

// TIP créditos de consumo: tasa anual nominal, muy volátil semana a
// semana → se promedia la ventana en vez de usar el último valor puntual.
async function fetchPromedioTIPConsumo() {
  const validas = await fetchObservacionesValidas(SERIE_TIP_CONSUMO, VENTANA_DIAS);

  const valores = validas.map((obs) => parseFloat(obs.value));
  const promedio = valores.reduce((acc, v) => acc + v, 0) / valores.length;

  const ultima = validas[validas.length - 1];

  return {
    valor: Number(promedio.toFixed(2)),
    cantidadObservaciones: valores.length,
    fechaUltimaObs: fechaObsAIso(ultima.indexDateString),
  };
}

// Cuenta de ahorro (captaciones 30-89 días): la serie es muy estable
// (spread ~0.02 pts/mes) y casi diaria → se toma la última observación
// válida, sin promedio móvil. La API la entrega en BASE MENSUAL, así que
// hay que convertirla a anual efectiva compuesta antes de guardarla —
// guardar la mensual cruda fue un bug detectado en el wireframe (0.4 en
// vez de ~4.2-4.3%).
async function fetchUltimaTasaCuentaAhorro() {
  const validas = await fetchObservacionesValidas(SERIE_CUENTA_AHORRO, VENTANA_DIAS_AHORRO);

  const ultima = validas[validas.length - 1];
  const tasaMensual = parseFloat(ultima.value);
  const tasaAnualEfectiva = (Math.pow(1 + tasaMensual / 100, 12) - 1) * 100;

  return {
    valor: Number(tasaAnualEfectiva.toFixed(2)),
    cantidadObservaciones: validas.length, // informativo: no se promedia
    fechaUltimaObs: fechaObsAIso(ultima.indexDateString),
  };
}

async function main() {
  console.log("== RF07/RF08 Bloque 0: actualizar tasasReferencia (Banco Central) ==");

  console.log(`Consultando ${SERIE_TIP_CONSUMO} (ventana de ${VENTANA_DIAS} días)...`);
  const tipConsumo = await fetchPromedioTIPConsumo();
  console.log(
    `  tipConsumo: ${tipConsumo.valor}% anual (promedio de ${tipConsumo.cantidadObservaciones} obs, última: ${tipConsumo.fechaUltimaObs})`,
  );

  console.log(`Consultando ${SERIE_CUENTA_AHORRO} (ventana de ${VENTANA_DIAS_AHORRO} días)...`);
  const cuentaAhorro = await fetchUltimaTasaCuentaAhorro();
  console.log(
    `  cuentaAhorro: ${cuentaAhorro.valor}% anual efectiva (última obs: ${cuentaAhorro.fechaUltimaObs})`,
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

  // Batch: los dos documentos se actualizan de forma atómica.
  const batch = db.batch();
  const coleccion = db.collection("tasasReferencia");

  batch.set(coleccion.doc("tipConsumo"), {
    valor: tipConsumo.valor,
    cantidadObservaciones: tipConsumo.cantidadObservaciones,
    fechaActualizacion: tipConsumo.fechaUltimaObs,
    fuente: "banco-central-script-manual",
  });

  batch.set(coleccion.doc("cuentaAhorro"), {
    valor: cuentaAhorro.valor,
    cantidadObservaciones: cuentaAhorro.cantidadObservaciones,
    fechaActualizacion: cuentaAhorro.fechaUltimaObs,
    fuente: "banco-central-script-manual",
  });

  await batch.commit();

  console.log("✅ tasasReferencia/tipConsumo y tasasReferencia/cuentaAhorro actualizados en Firestore.");
}

main().catch((error) => {
  console.error("\n❌ Error:", error.message);
  process.exit(1);
});
