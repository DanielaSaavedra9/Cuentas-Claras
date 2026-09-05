import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { brandColors as colors } from "@/constants/brand-colors";
import { brandFonts as fonts } from "@/constants/brand-fonts";
import { auth } from "@/firebaseConfig";
import { Movimiento, obtenerMovimiento, registrarAbono } from "@/services/movimientos";
import {
  calcularCuotaSugerida,
  estadoPrevisible,
  formatFechaCorta,
} from "@/utils/previsibles";

function formatCLP(valor: number) {
  return "$" + Math.round(valor).toLocaleString("es-CL");
}

function Switch({ value, onChange }: { value: boolean; onChange: () => void }) {
  return (
    <Pressable
      style={[styles.switchTrack, value && styles.switchTrackActive]}
      onPress={onChange}
    >
      <View style={[styles.switchThumb, value && styles.switchThumbActive]} />
    </Pressable>
  );
}

// Bloque 2 de RF05: solo lectura del estado (recalcula cuotaSugerida al
// abrir). Bloque 3: registrar abono — casilla "ya ahorré" + edición
// opcional del monto, con vista previa antes de guardar. Eliminar
// (Bloque 5) todavía no está acá.
export default function GastoPrevisibleDetalleScreen() {
  const router = useRouter();
  // Dentro del componente (no a nivel de módulo): si no, se calcula una
  // sola vez cuando el bundle de JS carga y queda pegada en esa fecha
  // mientras la app no se reinicie del todo — el recálculo de cuota y la
  // detección de atraso dependen de que esto sea siempre "ahora".
  const hoy = new Date();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [movimiento, setMovimiento] = useState<Movimiento | null>(null);
  const [cargando, setCargando] = useState(true);
  const [noEncontrado, setNoEncontrado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const [yaAhorre, setYaAhorre] = useState(false);
  const [editarMonto, setEditarMonto] = useState(false);
  const [montoEditado, setMontoEditado] = useState("");

  // Chore SDK 57: eslint-config-expo trajo react-hooks/set-state-in-effect,
  // que marca error el `setNoEncontrado`/`setCargando` síncronos de la
  // rama `if (!uid || !id)` (setState directo dentro del cuerpo del
  // efecto). Se difiere la llamada a un microtask para que ambas ramas
  // actualicen estado después de que el efecto ya confirmó — mismo
  // comportamiento. `useCallback` para poder declararla como dependencia
  // del efecto sin que se re-dispare en cada render.
  const cargarMovimiento = useCallback(() => {
    const uid = auth.currentUser?.uid;
    if (!uid || !id) {
      setNoEncontrado(true);
      setCargando(false);
      return;
    }
    obtenerMovimiento(uid, id)
      .then((m) => {
        if (!m || !m.esPrevisible || !m.previsibleFechaLimite) {
          setNoEncontrado(true);
          return;
        }
        setMovimiento(m);
      })
      .catch(() => setNoEncontrado(true))
      .finally(() => setCargando(false));
  }, [id]);

  useEffect(() => {
    Promise.resolve().then(cargarMovimiento);
  }, [cargarMovimiento]);

  if (cargando) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.brand} />
        </View>
      </SafeAreaView>
    );
  }

  if (noEncontrado || !movimiento) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.centered}>
          <Text style={styles.title}>Gasto previsible no encontrado</Text>
          <TouchableOpacity onPress={() => router.replace("/(tabs)")}>
            <Text style={styles.backLinkText}>Volver al inicio</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const montoTotal = movimiento.monto;
  const montoAbonado = movimiento.previsibleMontoAbonado ?? 0;
  const saldoPendiente = montoTotal - montoAbonado;
  const cuotaSugerida = calcularCuotaSugerida(
    saldoPendiente,
    movimiento.previsibleFechaLimite!,
    hoy,
  );
  const estado = estadoPrevisible(
    hoy,
    movimiento.previsibleFechaLimite!,
    montoAbonado,
    montoTotal,
  );
  const atrasado = estado === "vencido";
  // Vencido: se sugiere el saldo pendiente completo, no una cuota mensual.
  const montoSugerido = atrasado ? saldoPendiente : cuotaSugerida;

  const abonoDelMes = (movimiento.previsibleAbonosMensuales ?? []).find(
    (a) => a.mes === hoy.getMonth() + 1 && a.anio === hoy.getFullYear(),
  );
  const yaAbonoEsteMes = !!abonoDelMes;

  const montoAAbonar = editarMonto ? Number(montoEditado) || 0 : montoSugerido;
  const montoAbonadoPreview =
    montoAbonado + (!yaAbonoEsteMes && yaAhorre ? montoAAbonar : 0);
  const progresoPreview = Math.min(
    100,
    Math.round((montoAbonadoPreview / montoTotal) * 100),
  );

  const onGuardar = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid || !id || montoAAbonar <= 0) return;

    setError("");
    setGuardando(true);
    try {
      await registrarAbono(uid, id, {
        mes: hoy.getMonth() + 1,
        anio: hoy.getFullYear(),
        montoAbonado: montoAAbonar,
      });
      router.replace("/(tabs)");
    } catch {
      setError("No se pudo registrar el abono. Intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Gasto previsible</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View>
          <Text style={styles.nombre}>{movimiento.descripcion}</Text>
          <View style={styles.venceRow}>
            <Text style={styles.vence}>
              Vence {formatFechaCorta(movimiento.previsibleFechaLimite!)}
            </Text>
            {estado !== "normal" ? (
              <View style={styles.atrasadoBadge}>
                <Text style={styles.atrasadoBadgeText}>
                  {atrasado ? "Vencido" : "Próximo a vencer"}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.montosRow}>
          <View>
            <Text style={styles.montoLabel}>Monto total</Text>
            <Text style={styles.montoValor}>{formatCLP(montoTotal)}</Text>
          </View>
          <View>
            <Text style={styles.montoLabel}>Abonado</Text>
            <Text style={[styles.montoValor, { color: colors.success }]}>
              {formatCLP(montoAbonadoPreview)}
            </Text>
          </View>
        </View>

        <View>
          <View style={styles.progresoHeader}>
            <Text style={styles.progresoLabel}>Progreso</Text>
            <Text style={styles.progresoLabel}>{progresoPreview}%</Text>
          </View>
          <View style={styles.progresoTrack}>
            <View style={[styles.progresoFill, { width: `${progresoPreview}%` }]} />
          </View>
        </View>

        <View style={[styles.cuotaBox, atrasado && styles.cuotaBoxAtrasado]}>
          <Text style={styles.cuotaLabel}>
            {atrasado ? "Saldo pendiente (vencido)" : "Cuota sugerida este mes"}
          </Text>
          <Text style={styles.cuotaValor}>
            {formatCLP(montoSugerido)}
            {atrasado ? "" : " / mes"}
          </Text>
        </View>

        {yaAbonoEsteMes ? (
          <View style={styles.abonadoBox}>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <Text style={styles.abonadoBoxText}>
              Ya registraste tu abono de este mes: {formatCLP(abonoDelMes!.montoAbonado)}
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Editar monto a ahorrar</Text>
              <Switch
                value={editarMonto}
                onChange={() => {
                  const activando = !editarMonto;
                  setEditarMonto(activando);
                  if (activando && !montoEditado) {
                    setMontoEditado(String(Math.round(montoSugerido)));
                  }
                }}
              />
            </View>

            {editarMonto ? (
              <View style={styles.field}>
                <Text style={styles.label}>
                  {atrasado ? "Monto a pagar" : "Monto a ahorrar este mes"}
                </Text>
                <TextInput
                  style={styles.input}
                  value={montoEditado}
                  onChangeText={(text) =>
                    setMontoEditado(text.replace(/[^0-9]/g, ""))
                  }
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
            ) : null}

            <TouchableOpacity
              style={styles.checkboxRow}
              activeOpacity={0.8}
              onPress={() => setYaAhorre(!yaAhorre)}
            >
              <View style={[styles.checkbox, yaAhorre && styles.checkboxChecked]}>
                {yaAhorre ? (
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                ) : null}
              </View>
              <Text style={styles.checkboxLabel}>
                {atrasado
                  ? "¿Ya pagaste el saldo pendiente?"
                  : "¿Ya ahorraste la cuota sugerida este mes?"}
              </Text>
            </TouchableOpacity>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[
                styles.submitButton,
                (!yaAhorre || montoAAbonar <= 0 || guardando) &&
                  styles.submitButtonDisabled,
              ]}
              activeOpacity={0.85}
              onPress={onGuardar}
              disabled={!yaAhorre || montoAAbonar <= 0 || guardando}
            >
              <Text style={styles.submitButtonText}>
                {guardando ? "Guardando…" : "Guardar"}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.card,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerSpacer: {
    width: 20,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.textPrimary,
    fontFamily: fonts.displaySemiBold,
  },
  backLinkText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.brand,
    fontFamily: fonts.bodySemiBold,
    marginTop: 4,
  },
  content: {
    padding: 24,
    paddingTop: 4,
    paddingBottom: 40,
    gap: 20,
  },
  nombre: {
    fontSize: 22,
    fontWeight: "600",
    color: colors.textPrimary,
    fontFamily: fonts.displaySemiBold,
  },
  venceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  vence: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: fonts.bodyRegular,
  },
  atrasadoBadge: {
    backgroundColor: "#FDECC0",
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  atrasadoBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#B5820A",
    fontFamily: fonts.bodySemiBold,
  },
  montosRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 14,
  },
  montoLabel: {
    fontSize: 11.5,
    color: colors.textSecondary,
    fontFamily: fonts.bodyRegular,
  },
  montoValor: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginTop: 2,
    fontFamily: fonts.bodySemiBold,
  },
  progresoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  progresoLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: fonts.bodyRegular,
  },
  progresoTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    overflow: "hidden",
  },
  progresoFill: {
    height: "100%",
    backgroundColor: colors.success,
  },
  cuotaBox: {
    backgroundColor: "#FFF4DE",
    borderRadius: 12,
    padding: 14,
  },
  cuotaBoxAtrasado: {
    backgroundColor: "#FDECC0",
  },
  cuotaLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: fonts.bodyRegular,
  },
  cuotaValor: {
    fontSize: 24,
    fontWeight: "600",
    color: colors.textPrimary,
    marginTop: 4,
    fontFamily: fonts.displaySemiBold,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  abonadoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.successTint,
    borderRadius: 12,
    padding: 14,
  },
  abonadoBoxText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    color: colors.textPrimary,
    fontFamily: fonts.bodyRegular,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textPrimary,
    fontFamily: fonts.bodyRegular,
  },
  switchTrack: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.border,
    justifyContent: "center",
  },
  switchTrackActive: {
    backgroundColor: colors.brand,
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.card,
    marginLeft: 3,
  },
  switchThumbActive: {
    marginLeft: 21,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textPrimary,
    fontFamily: fonts.bodySemiBold,
  },
  input: {
    borderWidth: 0,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.background,
    fontFamily: fonts.bodyRegular,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    borderWidth: 0,
    backgroundColor: colors.brand,
  },
  checkboxLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textPrimary,
    fontFamily: fonts.bodyRegular,
    flex: 1,
  },
  errorText: {
    fontSize: 12.5,
    color: colors.error,
    textAlign: "center",
    fontFamily: fonts.bodyRegular,
  },
  submitButton: {
    backgroundColor: colors.brand,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    fontFamily: fonts.bodySemiBold,
  },
});
