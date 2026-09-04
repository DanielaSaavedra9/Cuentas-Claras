// RF06 — Contenido educativo. Fuente única de los textos del glosario:
// los usan tanto los tooltips contextuales (components/tooltip-info.tsx,
// Bloque 2) como la pantalla del glosario general (app/(tabs)/aprender.tsx,
// Bloque 3). NO se persiste nada en Firestore — es contenido estático de
// solo lectura (ver ficha ME-CE-01, Anexo F). Los textos salen del kit
// "Cuentas Claras Design System" (componente Tooltip / TERM_DEFS y el
// array GLOSARIO de la pantalla Aprender); el contenido definitivo se
// afinará con la usuaria más adelante, la estructura ya es la final.

export type TerminoGlosario = {
  id: string;
  termino: string;
  definicion: string;
  // true: aparece también en el glosario general de la pestaña "Aprender".
  // false: solo se usa como tooltip contextual en su pantalla.
  enGlosarioGeneral: boolean;
};

export const GLOSARIO: TerminoGlosario[] = [
  {
    id: "cae",
    termino: "CAE",
    definicion:
      "Costo real del crédito en un año, todo incluido. Sirve para comparar créditos entre bancos: mientras más baja, más barato es el crédito.",
    enGlosarioGeneral: true,
  },
  {
    id: "ctc",
    termino: "CTC",
    definicion:
      "Costo Total del Crédito: la suma de todo lo que pagarás por el crédito — capital, intereses y gastos asociados.",
    enGlosarioGeneral: true,
  },
  {
    id: "interesCompuesto",
    termino: "Interés compuesto",
    definicion:
      "Los intereses se calculan sobre el capital más los intereses ya ganados, por eso tu ahorro crece cada vez más rápido.",
    enGlosarioGeneral: true,
  },
  {
    id: "tasaInteres",
    termino: "Tasa de interés",
    definicion:
      "Porcentaje que se cobra o se gana sobre un monto, en un período determinado.",
    enGlosarioGeneral: true,
  },
  {
    id: "gastoPrevisible",
    termino: "Gasto previsible",
    definicion:
      "Un gasto que sabes que vendrá y tiene fecha límite (ej: matrícula, seguro, patente). Te ayudamos a dividirlo en cuotas y a hacer seguimiento de tus abonos.",
    enGlosarioGeneral: true,
  },
  {
    id: "gastoCompartido",
    termino: "Gasto compartido",
    definicion:
      "Divide el monto entre el número de personas para saber cuánto te corresponde pagar a ti.",
    enGlosarioGeneral: true,
  },
  {
    id: "cuotaSugerida",
    termino: "Cuota sugerida",
    definicion:
      "Es el monto total dividido en cuotas iguales entre hoy y tu fecha límite, para que llegues a la fecha sin sobresaltos.",
    enGlosarioGeneral: false,
  },
];

// Términos que se listan en la pantalla del glosario general (Bloque 3).
export const TERMINOS_GLOSARIO_GENERAL: TerminoGlosario[] = GLOSARIO.filter(
  (t) => t.enGlosarioGeneral,
);

export function buscarTermino(id: string): TerminoGlosario | undefined {
  return GLOSARIO.find((t) => t.id === id);
}

// Acordeón del glosario (Bloque 3): un solo término expandido a la vez.
// Tocar el término abierto lo cierra; tocar otro cambia el abierto.
export function alternarTerminoAbierto(
  abiertoActual: string | null,
  id: string,
): string | null {
  return abiertoActual === id ? null : id;
}
