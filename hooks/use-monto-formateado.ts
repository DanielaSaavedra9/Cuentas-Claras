import { useState } from "react";
import { NativeSyntheticEvent, TextInputSelectionChangeEventData } from "react-native";

import {
  calcularPosicionCursor,
  formatearPesoChileno,
  parsearPesoChileno,
} from "@/utils/formatoMoneda";

// Fix RF02/RF07 (.claude/fix-rf02-formato-peso-chileno.md,
// .claude/fix-rf07-simulador-ajustes.md): lógica compartida por
// cualquier campo de monto en pesos chilenos — el formulario de gasto y
// el simulador de crédito la usan igual. Formatea con separador de
// miles mientras se escribe y preserva la posición del cursor al
// reformatear (los separadores se corren al escribir/borrar en medio
// del número). El valor que se guarda (`onChange`) sigue siendo el
// string de dígitos crudos, nunca el texto formateado — eso no cambia
// el contrato de quien use este hook.
export function mostrarMonto(digitosCrudos: string): string {
  return formatearPesoChileno(parsearPesoChileno(digitosCrudos));
}

export function useMontoFormateado(
  value: string,
  onChange: (digitosCrudos: string) => void,
) {
  const [seleccion, setSeleccion] = useState<{ start: number; end: number }>();
  const textoMostrado = mostrarMonto(value);

  const onChangeText = (textoNuevo: string) => {
    const digitos = textoNuevo.replace(/[^0-9]/g, "");
    onChange(digitos);

    const cursorAnterior = seleccion?.end ?? textoMostrado.length;
    const textoReformateado = mostrarMonto(digitos);
    const nuevaPosicion = calcularPosicionCursor(
      textoMostrado,
      cursorAnterior,
      textoReformateado,
    );
    setSeleccion({ start: nuevaPosicion, end: nuevaPosicion });
  };

  const onSelectionChange = (
    e: NativeSyntheticEvent<TextInputSelectionChangeEventData>,
  ) => {
    setSeleccion(e.nativeEvent.selection);
  };

  return { textoMostrado, seleccion, onChangeText, onSelectionChange };
}
