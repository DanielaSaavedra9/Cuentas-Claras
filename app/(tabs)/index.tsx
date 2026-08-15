import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CATEGORIA_ICONS } from "@/components/movimiento-form";
import { brandColors as colors } from "@/constants/brand-colors";
import { brandFonts as fonts } from "@/constants/brand-fonts";
import { auth } from "@/firebaseConfig";
import {
  escucharMovimientosDelMes,
  listarMovimientos,
  Movimiento,
} from "@/services/movimientos";
import { obtenerUsuario } from "@/services/usuarios";
import {
  calcularBalance,
  filtrarPorMes,
  mesAnterior,
  mesSiguiente,
  MesAnio,
  puedeNavegarAMes,
  ultimosNMeses,
} from "@/utils/balance";

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];
const MESES_CORTOS = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

function formatCLP(valor: number) {
  return "$" + Math.round(valor).toLocaleString("es-CL");
}

const ULTIMOS_MOVIMIENTOS = 3;
const MESES_TENDENCIA = 6;
const ALTURA_BARRAS = 100;
const ALTURA_MINIMA_BARRA = 8;

function hoyMesAnio(): MesAnio {
  const hoy = new Date();
  return { anio: hoy.getFullYear(), mes: hoy.getMonth() + 1 };
}

export default function HomeScreen() {
  const router = useRouter();
  const [mesSeleccionado, setMesSeleccionado] = useState<MesAnio>(hoyMesAnio());
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [todosLosMovimientos, setTodosLosMovimientos] = useState<Movimiento[]>([]);
  const [nombre, setNombre] = useState("");

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    obtenerUsuario(uid).then((usuario) => {
      if (usuario) setNombre(usuario.nombre);
    });
  }, []);

  // Bloque 1: listener en tiempo real acotado al mes seleccionado (balance
  // + últimos movimientos). Bloque 2: cambiar de mes re-suscribe el
  // listener a ese mes.
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    return escucharMovimientosDelMes(
      uid,
      mesSeleccionado.anio,
      mesSeleccionado.mes,
      setMovimientos,
    );
  }, [mesSeleccionado]);

  // Tendencia del gráfico de gastos (últimos 6 meses): consulta única, no
  // en tiempo real. Se refresca cuando cambia el mes seleccionado o el
  // listener del mes en curso trae datos nuevos.
  const cargarTendencia = useCallback(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    listarMovimientos(uid).then(setTodosLosMovimientos);
  }, []);

  useEffect(() => {
    cargarTendencia();
  }, [cargarTendencia, mesSeleccionado, movimientos]);

  const balance = calcularBalance(movimientos);
  const ultimosMovimientos = movimientos.slice(0, ULTIMOS_MOVIMIENTOS);
  const nombreMes = MESES[mesSeleccionado.mes - 1];
  const puedeAvanzar = puedeNavegarAMes(
    mesSiguiente(mesSeleccionado).anio,
    mesSiguiente(mesSeleccionado).mes,
  );

  const ventanaTendencia = ultimosNMeses(mesSeleccionado, MESES_TENDENCIA);
  const gastosPorMes = ventanaTendencia.map((m) =>
    calcularBalance(filtrarPorMes(todosLosMovimientos, m.anio, m.mes)).gastos,
  );
  const maxGasto = Math.max(...gastosPorMes, 1);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <FlatList
        data={ultimosMovimientos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <View style={styles.topBar}>
              <Text style={styles.greeting}>Hola{nombre ? `, ${nombre}` : ""}</Text>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {nombre ? nombre.charAt(0).toUpperCase() : "?"}
                </Text>
              </View>
            </View>

            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Balance de {nombreMes}</Text>
              <Text style={styles.balanceValue}>{formatCLP(balance.neto)}</Text>
              <View style={styles.balanceRow}>
                <View style={styles.balancePill}>
                  <Text style={styles.balancePillLabel}>Ingresos</Text>
                  <Text style={[styles.balancePillValue, { color: "#8FF7B4" }]}>
                    {formatCLP(balance.ingresos)}
                  </Text>
                </View>
                <View style={styles.balancePill}>
                  <Text style={styles.balancePillLabel}>Gastos</Text>
                  <Text style={[styles.balancePillValue, { color: "#FF8A8A" }]}>
                    {formatCLP(balance.gastos)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <Text style={styles.sectionTitle}>Gastos</Text>
                <View style={styles.monthNav}>
                  <TouchableOpacity
                    style={styles.monthNavButton}
                    activeOpacity={0.7}
                    onPress={() => setMesSeleccionado(mesAnterior(mesSeleccionado))}
                  >
                    <Ionicons name="chevron-back" size={14} color={colors.brand} />
                  </TouchableOpacity>
                  <Text style={styles.monthNavLabel}>
                    {MESES_CORTOS[mesSeleccionado.mes - 1]}
                  </Text>
                  <TouchableOpacity
                    style={styles.monthNavButton}
                    activeOpacity={0.7}
                    disabled={!puedeAvanzar}
                    onPress={() => setMesSeleccionado(mesSiguiente(mesSeleccionado))}
                  >
                    <Ionicons
                      name="chevron-forward"
                      size={14}
                      color={puedeAvanzar ? colors.brand : colors.textTertiary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.barsRow}>
                {ventanaTendencia.map((m, i) => {
                  const esSeleccionado =
                    m.anio === mesSeleccionado.anio && m.mes === mesSeleccionado.mes;
                  const alto =
                    ALTURA_MINIMA_BARRA +
                    (ALTURA_BARRAS - ALTURA_MINIMA_BARRA) *
                      (gastosPorMes[i] / maxGasto);
                  return (
                    <View key={`${m.anio}-${m.mes}`} style={styles.barCol}>
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.bar,
                            {
                              height: alto,
                              backgroundColor: esSeleccionado
                                ? colors.brand
                                : colors.brandBarTint,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.barLabel}>{MESES_CORTOS[m.mes - 1]}</Text>
                    </View>
                  );
                })}
              </View>

              {movimientos.length > 0 ? (
                <TouchableOpacity
                  onPress={() => router.push("/movimientos-lista")}
                  style={styles.chartLink}
                >
                  <Text style={styles.sectionLink}>
                    Ver movimientos de {nombreMes}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Últimos movimientos</Text>
              <TouchableOpacity onPress={() => router.push("/movimientos-lista")}>
                <Text style={styles.sectionLink}>Ver todos</Text>
              </TouchableOpacity>
            </View>
          </>
        }
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
              <Text style={styles.rowMeta}>{item.fecha}</Text>
            </View>
            <Text
              style={[
                styles.rowMonto,
                { color: item.tipo === "ingreso" ? colors.success : colors.error },
              ]}
            >
              {item.tipo === "ingreso" ? "+" : "-"}
              {formatCLP(item.monto)}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>
              Sin movimientos en {nombreMes}
            </Text>
            <Text style={styles.emptySubtitle}>
              Toca el botón + para agregar un ingreso o gasto
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => router.push("/movimiento-nuevo")}
      >
        <Ionicons name="add" size={26} color={colors.textPrimary} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  greeting: {
    fontSize: 16,
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
  balanceCard: {
    backgroundColor: colors.brand,
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 22,
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    fontFamily: fonts.bodyRegular,
    textTransform: "capitalize",
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: "600",
    color: "#FFFFFF",
    marginVertical: 4,
    marginBottom: 14,
    fontFamily: fonts.displayBold,
  },
  balanceRow: {
    flexDirection: "row",
    gap: 12,
  },
  balancePill: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  balancePillLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.75)",
    fontFamily: fonts.bodyRegular,
  },
  balancePillValue: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: fonts.bodySemiBold,
  },
  chartCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  chartHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: colors.brandTint,
    borderRadius: 20,
    padding: 3,
  },
  monthNavButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  monthNavLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.brand,
    minWidth: 56,
    textAlign: "center",
    fontFamily: fonts.bodySemiBold,
  },
  barsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    marginTop: 8,
  },
  barCol: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  barTrack: {
    height: ALTURA_BARRAS,
    width: "100%",
    justifyContent: "flex-end",
  },
  bar: {
    width: "100%",
    borderRadius: 8,
  },
  barLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: fonts.bodyRegular,
  },
  chartLink: {
    marginTop: 4,
    alignItems: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    fontFamily: fonts.bodySemiBold,
  },
  sectionLink: {
    fontSize: 12,
    color: colors.brand,
    fontFamily: fonts.bodySemiBold,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
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
  },
  rowMonto: {
    fontSize: 13.5,
    fontWeight: "600",
    fontFamily: fonts.bodySemiBold,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 4,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    fontFamily: fonts.bodySemiBold,
    textTransform: "capitalize",
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
