import { useRef, useState } from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { brandColors as colors } from "@/constants/brand-colors";
import { brandFonts as fonts } from "@/constants/brand-fonts";
import { buscarTermino } from "@/constants/glosario";

// RF06 Bloque 1 — Tooltip contextual reutilizable. Ícono "i" que al
// tocarse despliega la definición de un término del glosario en un
// recuadro flotante, sin empujar el layout de la pantalla en uso (ver
// ficha ME-CE-01, flujo normal pasos 3-4). El texto NO se pasa como
// literal: se resuelve desde constants/glosario.ts por id, para que
// tooltip y glosario general compartan una sola fuente.
//
// Se cierra al tocar de nuevo el ícono o al tocar fuera del recuadro
// (el Pressable de fondo del Modal). El recuadro se posiciona junto al
// ícono midiendo su posición en pantalla y se acota al ancho disponible
// para no salirse por el borde derecho.

const ANCHO_RECUADRO = 220;
const MARGEN_PANTALLA = 12;

export function TooltipInfo({ terminoId }: { terminoId: string }) {
  const termino = buscarTermino(terminoId);
  const iconoRef = useRef<View>(null);
  const [abierto, setAbierto] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  if (!termino) return null;

  const abrir = () => {
    iconoRef.current?.measureInWindow((x, y, ancho, alto) => {
      const anchoPantalla = Dimensions.get("window").width;
      let left = x;
      if (left + ANCHO_RECUADRO > anchoPantalla - MARGEN_PANTALLA) {
        left = anchoPantalla - MARGEN_PANTALLA - ANCHO_RECUADRO;
      }
      if (left < MARGEN_PANTALLA) left = MARGEN_PANTALLA;
      setPos({ top: y + alto + 6, left });
      setAbierto(true);
    });
  };

  return (
    <>
      <Pressable
        ref={iconoRef}
        onPress={() => (abierto ? setAbierto(false) : abrir())}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`Qué significa ${termino.termino}`}
        style={styles.badge}
      >
        <Text style={styles.badgeText}>i</Text>
      </Pressable>

      <Modal
        visible={abierto}
        transparent
        animationType="fade"
        onRequestClose={() => setAbierto(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setAbierto(false)}>
          {pos ? (
            <View style={[styles.bubble, { top: pos.top, left: pos.left }]}>
              <Text style={styles.bubbleText}>{termino.definicion}</Text>
            </View>
          ) : null}
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  badge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.infoBadge,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "700",
    color: colors.brand,
    fontFamily: fonts.bodyBold,
  },
  backdrop: {
    flex: 1,
  },
  bubble: {
    position: "absolute",
    width: ANCHO_RECUADRO,
    backgroundColor: colors.textPrimary,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  bubbleText: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.card,
    fontFamily: fonts.bodyRegular,
  },
});
