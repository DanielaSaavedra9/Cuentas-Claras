import { useState } from "react";
import { StyleProp, StyleSheet, Text, TextInput, TextStyle } from "react-native";

import { brandColors as colors } from "@/constants/brand-colors";
import { useMontoFormateado } from "@/hooks/use-monto-formateado";

// Fix RF02 (.claude/fix-rf02-formato-peso-chileno.md): campo de monto
// grande y centrado (junto a un "$") que crece con el contenido — usado
// hoy por el formulario de gasto. El valor que se guarda (`onChange`)
// sigue siendo el string de dígitos crudos, el formateo es solo de
// presentación (ver useMontoFormateado).
//
// Ancho del campo: un `TextInput` sin ancho fijo NO vuelve a medir su
// contenido de forma confiable en cada tecla en React Native (probado:
// con `flexShrink`/ancho automático el número se cortaba a veces sí, a
// veces no, según si la plataforma decidía remedir o no). La solución
// determinística es medir el texto real con un `Text` invisible (mismo
// tipografía/tamaño) vía `onLayout`, y pasarle ese ancho al `TextInput`.
export function MontoInput({
  value,
  onChange,
  onBlur,
  style,
  color,
}: {
  value: string;
  onChange: (texto: string) => void;
  onBlur: () => void;
  style: StyleProp<TextStyle>;
  color: string;
}) {
  const { textoMostrado, seleccion, onChangeText, onSelectionChange } =
    useMontoFormateado(value, onChange);
  const [anchoMedido, setAnchoMedido] = useState<number>();

  return (
    <>
      <Text
        style={[style, styles.medidor]}
        onLayout={(e) => setAnchoMedido(e.nativeEvent.layout.width)}
      >
        {textoMostrado || "0"}
      </Text>
      <TextInput
        style={[style, anchoMedido ? { width: anchoMedido + 8 } : null]}
        placeholder="0"
        placeholderTextColor={colors.textTertiary}
        value={textoMostrado}
        selection={seleccion}
        onSelectionChange={onSelectionChange}
        onChangeText={onChangeText}
        onBlur={onBlur}
        keyboardType="numeric"
        selectionColor={color}
        cursorColor={color}
      />
    </>
  );
}

const styles = StyleSheet.create({
  // Copia invisible del campo, misma tipografía/tamaño, fuera del flujo
  // (no ocupa espacio ni se ve) — solo existe para que `onLayout`
  // entregue el ancho real del texto actual.
  medidor: {
    position: "absolute",
    opacity: 0,
    zIndex: -1,
  },
});
