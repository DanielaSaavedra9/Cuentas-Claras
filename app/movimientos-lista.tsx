import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { brandColors as colors } from "@/constants/brand-colors";
import { brandFonts as fonts } from "@/constants/brand-fonts";
import { auth } from "@/firebaseConfig";
import { listarMovimientos, Movimiento } from "@/services/movimientos";
import { montoEfectivo } from "@/utils/balance";

// Pantalla temporal solo para poder llegar a un movimiento existente y
// probar editar/eliminar (Bloque 2 de RF02) mientras no existe la lista
// real de RF03 (Home / "Movimientos"). Sin estilo del kit de diseño a
// propósito — se reemplaza cuando se construya RF03.
export default function MovimientosListaScreen() {
  const router = useRouter();
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [cargando, setCargando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        setCargando(false);
        return;
      }
      setCargando(true);
      listarMovimientos(uid)
        .then(setMovimientos)
        .finally(() => setCargando(false));
    }, []),
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          hitSlop={8}
        >
          <Ionicons name="close" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Movimientos (temporal)</Text>
        <View style={styles.headerSpacer} />
      </View>

      {cargando ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.brand} />
        </View>
      ) : movimientos.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Aún no tienes movimientos.</Text>
        </View>
      ) : (
        <FlatList
          data={movimientos}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              activeOpacity={0.7}
              onPress={() => router.push(`/movimiento-detalle?id=${item.id}`)}
            >
              <View style={styles.rowText}>
                <Text style={styles.rowDescripcion}>{item.descripcion}</Text>
                <Text style={styles.rowMeta}>
                  {item.categoria} · {item.fecha}
                </Text>
              </View>
              <Text
                style={[
                  styles.rowMonto,
                  { color: item.tipo === "ingreso" ? colors.success : colors.error },
                ]}
              >
                {item.tipo === "ingreso" ? "+" : "-"}${montoEfectivo(item)}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.card,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerSpacer: {
    width: 18,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.textPrimary,
    fontFamily: fonts.displaySemiBold,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: fonts.bodyRegular,
  },
  list: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowText: {
    flex: 1,
  },
  rowDescripcion: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textPrimary,
    fontFamily: fonts.bodySemiBold,
  },
  rowMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    fontFamily: fonts.bodyRegular,
    textTransform: "capitalize",
  },
  rowMonto: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: fonts.bodySemiBold,
  },
});
