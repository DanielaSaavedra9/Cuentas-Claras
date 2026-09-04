import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";

import { brandColors as colors } from "@/constants/brand-colors";
import { brandFonts as fonts } from "@/constants/brand-fonts";
import {
  alternarTerminoAbierto,
  TERMINOS_GLOSARIO_GENERAL,
  TerminoGlosario,
} from "@/constants/glosario";
import { auth } from "@/firebaseConfig";
import { obtenerUsuario } from "@/services/usuarios";

// RF06 Bloque 3 — Glosario general. Lista de conceptos en acordeón: cada
// uno colapsado por defecto, y expandir uno colapsa cualquier otro que
// estuviera abierto (ver ficha ME-CE-01, flujo alternativo). El contenido
// viene de constants/glosario.ts — sin getDoc ni listener, es contenido
// estático de solo lectura.
function ConceptoCard({
  termino,
  abierto,
  onToggle,
}: {
  termino: TerminoGlosario;
  abierto: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.conceptoCard}
      activeOpacity={0.7}
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityState={{ expanded: abierto }}
    >
      <View style={styles.conceptoHeader}>
        <Text style={styles.conceptoTermino}>{termino.termino}</Text>
        <Ionicons
          name={abierto ? "remove" : "add"}
          size={18}
          color={colors.textSecondary}
        />
      </View>
      {abierto ? (
        <Text style={styles.conceptoDefinicion}>{termino.definicion}</Text>
      ) : null}
    </TouchableOpacity>
  );
}

export default function AprenderScreen() {
  const [nombre, setNombre] = useState("");
  const [abierto, setAbierto] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    obtenerUsuario(uid).then((usuario) => {
      if (usuario) setNombre(usuario.nombre);
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, []),
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Aprender</Text>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {nombre ? nombre.charAt(0).toUpperCase() : "?"}
          </Text>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>
          Glosario financiero — toca un concepto para ver la explicación.
        </Text>
        <View style={styles.lista}>
          {TERMINOS_GLOSARIO_GENERAL.map((t) => (
            <ConceptoCard
              key={t.id}
              termino={t}
              abierto={abierto === t.id}
              onToggle={() => setAbierto((prev) => alternarTerminoAbierto(prev, t.id))}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.textPrimary,
    fontFamily: fonts.displaySemiBold,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: fonts.bodySemiBold,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: fonts.bodyRegular,
    paddingBottom: 12,
  },
  lista: {
    gap: 10,
  },
  conceptoCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  conceptoHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  conceptoTermino: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.brand,
    fontFamily: fonts.displaySemiBold,
  },
  conceptoDefinicion: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
    fontFamily: fonts.bodyRegular,
    marginTop: 8,
  },
});
