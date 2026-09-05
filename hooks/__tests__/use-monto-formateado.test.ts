import { mostrarMonto } from "@/hooks/use-monto-formateado";

// Fix RF07 (.claude/fix-rf07-simulador-ajustes.md): el monto precargado
// del simulador de crédito (useState("1000000") en ambos escenarios)
// debe verse formateado desde el primer render, no solo después de que
// el usuario empiece a escribir — caso que RF02 no cubría porque ahí no
// había ningún valor por defecto en el campo de monto. No se repiten acá
// los tests unitarios de formatearPesoChileno/parsearPesoChileno, ya
// cubiertos en la rama de RF02 (fix/rf02-formato-peso-chileno).
describe("mostrarMonto", () => {
  it("el monto precargado del simulador de crédito se ve formateado desde el primer render", () => {
    expect(mostrarMonto("1000000")).toBe("1.000.000");
  });

  it("un campo sin valor por defecto (ej. el formulario de gasto) se muestra vacío, no '0'", () => {
    expect(mostrarMonto("")).toBe("");
  });
});
