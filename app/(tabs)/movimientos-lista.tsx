import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CATEGORIA_ICONS } from "@/components/movimiento-form";
import { UserMenuSheet } from "@/components/user-menu-sheet";
import { brandColors as colors } from "@/constants/brand-colors";
import { brandFonts as fonts } from "@/constants/brand-fonts";
import { auth } from "@/firebaseConfig";
import { listarMovimientos, Movimiento } from "@/services/movimientos";
import { obtenerUsuario } from "@/services/usuarios";
import { filtrarPorMes, montoEfectivo } from "@/utils/balance";

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function formatCLP(valor: number) {
  return "$" + Math.round(valor).toLocaleString("es-CL");
}

// Menú de navegación, Bloque 3: se movió a app/(tabs)/ y se le aplicó el
// diseño del kit (mismo lenguaje visual que las tarjetas de "últimos
// movimientos" de Home) — antes era un placeholder temporal sin estilo,
// construido en RF02 solo para poder probar editar/eliminar.
//
// Bug reportado por la usuaria: los links "Ver movimientos de {mes}" y
// "Ver todos" de Home no pasaban el mes seleccionado, así que esta
// pantalla siempre mostraba el listado completo sin filtrar (parecía
// "pegado" en el mes actual). Ahora Home pasa anio/mes por parámetros de
// ruta y acá se filtra con filtrarPorMes; si se entra sin parámetros
// (ej. desde el tab de Movimientos) se muestra todo, sin filtrar.
export default function MovimientosListaScreen() {
  const router = useRouter();
  const listRef = useRef<FlatList<Movimiento>>(null);
  const { anio, mes } = useLocalSearchParams<{ anio?: string; mes?: string }>();
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    obtenerUsuario(uid).then((usuario) => {
      if (usuario) {
        setNombre(usuario.nombre);
        setApellido(usuario.apellido);
      }
    });
  }, []);

  const cerrarSesion = async () => {
    await signOut(auth);
    router.replace("/login");
  };

  useFocusEffect(
    useCallback(() => {
      // Mismo fix que Home: al volver a este tab desde otra sección, el
      // scroll debe volver arriba en vez de quedar donde estaba.
      listRef.current?.scrollToOffset({ offset: 0, animated: false });

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

  const anioNum = anio ? Number(anio) : null;
  const mesNum = mes ? Number(mes) : null;
  const movimientosMostrados =
    anioNum && mesNum ? filtrarPorMes(movimientos, anioNum, mesNum) : movimientos;
  const titulo = mesNum ? `Movimientos de ${MESES[mesNum - 1]}` : "Movimientos";

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>{titulo}</Text>
        <Pressable onPress={() => setMenuAbierto(true)}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {nombre ? nombre.charAt(0).toUpperCase() : "?"}
            </Text>
          </View>
        </Pressable>
      </View>

      {cargando ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.brand} />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={movimientosMostrados}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              activeOpacity={0.7}
              onPress={() => router.push(`/movimiento-detalle?id=${item.id}`)}
            >
              <View style={styles.rowIcon}>
                <Ionicons
                  name={CATEGORIA_ICONS[item.categoria]}
                  size={18}
                  color={colors.brand}
                />
              </View>
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
                {item.tipo === "ingreso" ? "+" : "-"}
                {formatCLP(montoEfectivo(item))}
              </Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="receipt-outline" size={18} color={colors.brand} />
              </View>
              <Text style={styles.emptyTitle}>Aún no tienes movimientos</Text>
              <Text style={styles.emptySubtitle}>
                Toca el botón + para agregar un ingreso o gasto
              </Text>
            </View>
          }
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => router.push("/movimiento-nuevo")}
      >
        <Ionicons name="add" size={26} color={colors.textPrimary} />
      </TouchableOpacity>

      <UserMenuSheet
        visible={menuAbierto}
        onClose={() => setMenuAbierto(false)}
        nombre={nombre}
        apellido={apellido}
        correo={auth.currentUser?.email ?? ""}
        onEditarPerfil={() => router.push("/editar-perfil")}
        onCerrarSesion={cerrarSesion}
      />
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
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    gap: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brandTint,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: {
    flex: 1,
  },
  rowDescripcion: {
    fontSize: 13.5,
    fontWeight: "500",
    color: colors.textPrimary,
    fontFamily: fonts.bodySemiBold,
  },
  rowMeta: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    fontFamily: fonts.bodyRegular,
    textTransform: "capitalize",
  },
  rowMonto: {
    fontSize: 13.5,
    fontWeight: "600",
    fontFamily: fonts.bodySemiBold,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 4,
  },
  emptyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brandTint,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    fontFamily: fonts.bodySemiBold,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: fonts.bodyRegular,
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 4,
  },
});
