// Fix RF07 (.claude/fix-rf07-simulador-ajustes.md): función pura, sin
// dependencias de React ni Firebase (mismo criterio que
// utils/formatoMoneda.ts). Se usa en los campos de tasa (%) del
// simulador de crédito y del simulador de ahorro.
//
// En teclados con configuración regional chilena, el `decimal-pad` de
// iOS/Android suele mostrar solo la coma como separador decimal, no el
// punto — filtrar el texto dejando pasar solo dígitos y puntos (como se
// hacía antes) hacía imposible escribir un decimal desde el teclado.
// Acá se acepta la coma y se normaliza a punto (el resto del código
// espera "23.98", no "23,98" — `Number("23,98")` da `NaN`), y se
// descarta cualquier separador de más si el usuario alcanza a escribir
// más de uno.
export function limpiarDecimal(texto: string): string {
  const conPunto = texto.replace(/,/g, ".").replace(/[^0-9.]/g, "");
  const primerPunto = conPunto.indexOf(".");
  if (primerPunto === -1) return conPunto;
  return (
    conPunto.slice(0, primerPunto + 1) +
    conPunto.slice(primerPunto + 1).replace(/\./g, "")
  );
}
