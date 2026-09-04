import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { TooltipInfo } from "@/components/tooltip-info";
import { brandColors as colors } from "@/constants/brand-colors";
import { brandFonts as fonts } from "@/constants/brand-fonts";
import { auth } from "@/firebaseConfig";
import {
  eliminarEscenario,
  EscenarioGuardado,
  guardarEscenario,
  listarEscenariosGuardados,
} from "@/services/escenarios";
import { obtenerTasaTipConsumo } from "@/services/tasasReferencia";
import { obtenerUsuario } from "@/services/usuarios";
import {
  calcularCAE,
  calcularCTC,
  calcularCuotaMensual,
  calcularImpuestos,
} from "@/utils/creditoConsumo";

function formatCLP(valor: number) {
  return "$" + Math.round(valor).toLocaleString("es-CL");
}

function formatPct(valor: number) {
  return valor.toLocaleString("es-CL", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%";
}

type EscenarioCardProps = {
  label: string;
  monto: string;
  setMonto: (v: string) => void;
  plazo: string;
  setPlazo: (v: string) => void;
  tasa: string;
  setTasa: (v: string) => void;
  onRemove?: () => void;
  onGuardado: () => void;
  guardados: EscenarioGuardado[];
};

// Bloque 3: cada tarjeta calcula de forma independiente — recibe sus
// propios monto/plazo/tasa y no sabe nada del otro escenario. Bloque 4:
// el ícono de estrella guarda ESTE escenario en Firestore. "Guardado" no
// es un booleano local: se deriva de si `escenarioId` sigue en la lista
// `guardados` — así, si se elimina desde la sección de abajo, la
// estrella de esta tarjeta se apaga sola en vez de quedar amarilla.
function EscenarioCard({
  label,
  monto,
  setMonto,
  plazo,
  setPlazo,
  tasa,
  setTasa,
  onRemove,
  onGuardado,
  guardados,
}: EscenarioCardProps) {
  const [guardando, setGuardando] = useState(false);
  const [escenarioId, setEscenarioId] = useState<string | null>(null);
  const guardado =
    escenarioId !== null && guardados.some((g) => g.id === escenarioId);

  const montoNum = Number(monto) || 0;
  const plazoNum = Number(plazo) || 0;
  const tasaNum = Number(tasa) || 0;

  const cuota =
    plazoNum > 0 ? calcularCuotaMensual(montoNum, tasaNum, plazoNum) : 0;
  const impuestos = calcularImpuestos(montoNum);
  const totalIntereses = plazoNum > 0 ? cuota * plazoNum - montoNum : 0;
  const ctc = plazoNum > 0 ? calcularCTC(cuota, plazoNum, impuestos) : 0;
  const cae = calcularCAE(tasaNum);

  // Toggle real: si ya está guardado, tocar la estrella lo elimina (el
  // mismo documento) en vez de crear un duplicado.
  const onToggleGuardar = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid || guardando) return;

    setGuardando(true);
    try {
      if (guardado && escenarioId) {
        await eliminarEscenario(uid, escenarioId);
        setEscenarioId(null);
      } else {
        const duplicado = guardados.find(
          (g) =>
            g.parametros.monto === montoNum &&
            g.parametros.plazo === plazoNum &&
            g.parametros.tasa === tasaNum,
        );
        if (duplicado) {
          setEscenarioId(duplicado.id);
          Alert.alert("Ya guardado", "Este crédito ya está en tus escenarios guardados.");
          return;
        }

        const id = await guardarEscenario(
          uid,
          { monto: montoNum, tasa: tasaNum, plazo: plazoNum },
          {
            cuotaMensual: cuota,
            totalIntereses,
            impuestos,
            ctc,
            cae,
          },
        );
        setEscenarioId(id);
      }
      onGuardado();
    } finally {
      setGuardando(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <Text style={styles.cardLabel}>{label}</Text>
        <View style={styles.cardHeaderActions}>
          <TouchableOpacity onPress={onToggleGuardar} hitSlop={8} disabled={guardando}>
            <Ionicons
              name={guardado ? "star" : "star-outline"}
              size={20}
              color={guardado ? colors.accent : colors.textTertiary}
            />
          </TouchableOpacity>
          {onRemove ? (
            <TouchableOpacity onPress={onRemove} hitSlop={8}>
              <Ionicons name="close" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Monto</Text>
        <TextInput
          style={styles.input}
          value={monto}
          onChangeText={(t) => {
            setMonto(t.replace(/[^0-9]/g, ""));
            setEscenarioId(null);
          }}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={colors.textTertiary}
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.field, styles.flex1]}>
          <Text style={styles.label}>Plazo (meses)</Text>
          <TextInput
            style={styles.input}
            value={plazo}
            onChangeText={(t) => {
              setPlazo(t.replace(/[^0-9]/g, ""));
              setEscenarioId(null);
            }}
            keyboardType="numeric"
            placeholder="12"
            placeholderTextColor={colors.textTertiary}
          />
        </View>
        <View style={[styles.field, styles.flex1]}>
          <Text style={styles.label} numberOfLines={1}>
            Tasa anual (%)
          </Text>
          <TextInput
            style={styles.input}
            value={tasa}
            onChangeText={(t) => {
              setTasa(t.replace(/[^0-9.]/g, ""));
              setEscenarioId(null);
            }}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={colors.textTertiary}
          />
        </View>
      </View>

      <View style={styles.resultBox}>
        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>Cuota mensual</Text>
          <Text style={styles.resultValorGrande}>{formatCLP(cuota)}</Text>
        </View>
        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>Total intereses</Text>
          <Text style={styles.resultValor}>{formatCLP(totalIntereses)}</Text>
        </View>
        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>Impuestos</Text>
          <Text style={styles.resultValor}>{formatCLP(impuestos)}</Text>
        </View>
        <View style={styles.resultRow}>
          <View style={styles.resultLabelRow}>
            <Text style={styles.resultLabel}>Costo Total del Crédito</Text>
            <TooltipInfo terminoId="ctc" />
          </View>
          <Text style={styles.resultValor}>{formatCLP(ctc)}</Text>
        </View>
        <View style={styles.resultRow}>
          <View style={styles.resultLabelRow}>
            <Text style={styles.resultLabel}>CAE</Text>
            <TooltipInfo terminoId="cae" />
          </View>
          <Text style={styles.resultValor}>{formatPct(cae)}</Text>
        </View>
      </View>
    </View>
  );
}

// Bloque 4: la tarjeta de un escenario ya guardado — mismo layout que
// EscenarioCard (mismos campos, misma caja de resultados), pero de solo
// lectura (sin TextInput). Mantiene el ícono de estrella (mismo que en
// EscenarioCard, para no perder la intencionalidad visual) — tocarla acá
// siempre elimina, con confirmación porque es una acción terminal.
function GuardadoCard({
  guardado,
  onEliminado,
}: {
  guardado: EscenarioGuardado;
  onEliminado: () => void;
}) {
  const [eliminando, setEliminando] = useState(false);
  const [confirmar, setConfirmar] = useState(false);

  const onEliminar = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid || eliminando) return;
    setEliminando(true);
    try {
      await eliminarEscenario(uid, guardado.id);
      onEliminado();
    } finally {
      setEliminando(false);
      setConfirmar(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <Text style={styles.cardLabel}>Guardado</Text>
        <TouchableOpacity
          onPress={() => setConfirmar(true)}
          hitSlop={8}
          disabled={eliminando}
        >
          <Ionicons name="star" size={20} color={colors.accent} />
        </TouchableOpacity>
      </View>

      <Modal
        visible={confirmar}
        transparent
        animationType="fade"
        onRequestClose={() => !eliminando && setConfirmar(false)}
      >
        <Pressable
          style={modalStyles.backdrop}
          onPress={() => !eliminando && setConfirmar(false)}
        >
          <Pressable style={modalStyles.card} onPress={() => {}}>
            <Text style={modalStyles.title}>¿Eliminar este escenario guardado?</Text>
            <Text style={modalStyles.subtitle}>
              Esta acción no se puede deshacer.
            </Text>
            <View style={modalStyles.actions}>
              <TouchableOpacity
                style={[modalStyles.button, modalStyles.buttonNeutral]}
                activeOpacity={0.85}
                onPress={() => setConfirmar(false)}
                disabled={eliminando}
              >
                <Text style={modalStyles.buttonNeutralText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[modalStyles.button, modalStyles.buttonDanger]}
                activeOpacity={0.85}
                onPress={onEliminar}
                disabled={eliminando}
              >
                <Text style={modalStyles.buttonDangerText}>
                  {eliminando ? "Eliminando…" : "Eliminar"}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <View style={styles.field}>
        <Text style={styles.label}>Monto</Text>
        <View style={styles.inputStatic}>
          <Text style={styles.inputStaticText}>
            {formatCLP(guardado.parametros.monto)}
          </Text>
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.field, styles.flex1]}>
          <Text style={styles.label}>Plazo (meses)</Text>
          <View style={styles.inputStatic}>
            <Text style={styles.inputStaticText}>{guardado.parametros.plazo}</Text>
          </View>
        </View>
        <View style={[styles.field, styles.flex1]}>
          <Text style={styles.label} numberOfLines={1}>
            Tasa anual (%)
          </Text>
          <View style={styles.inputStatic}>
            <Text style={styles.inputStaticText}>{guardado.parametros.tasa}</Text>
          </View>
        </View>
      </View>

      <View style={styles.resultBox}>
        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>Cuota mensual</Text>
          <Text style={styles.resultValorGrande}>
            {formatCLP(guardado.resultado.cuotaMensual)}
          </Text>
        </View>
        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>Total intereses</Text>
          <Text style={styles.resultValor}>
            {formatCLP(guardado.resultado.totalIntereses)}
          </Text>
        </View>
        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>Impuestos</Text>
          <Text style={styles.resultValor}>
            {formatCLP(guardado.resultado.impuestos)}
          </Text>
        </View>
        <View style={styles.resultRow}>
          <View style={styles.resultLabelRow}>
            <Text style={styles.resultLabel}>Costo Total del Crédito</Text>
            <TooltipInfo terminoId="ctc" />
          </View>
          <Text style={styles.resultValor}>
            {formatCLP(guardado.resultado.ctc)}
          </Text>
        </View>
        <View style={styles.resultRow}>
          <View style={styles.resultLabelRow}>
            <Text style={styles.resultLabel}>CAE</Text>
            <TooltipInfo terminoId="cae" />
          </View>
          <Text style={styles.resultValor}>{formatPct(guardado.resultado.cae)}</Text>
        </View>
      </View>
    </View>
  );
}

// Bloque 2 de RF07: un escenario, cálculo en tiempo real. Bloque 3:
// segundo escenario opcional, independiente del primero. Bloque 4:
// guardar cada escenario y ver la lista de guardados.
export default function SimuladorCreditoScreen() {
  const [monto, setMonto] = useState("1000000");
  const [plazo, setPlazo] = useState("12");
  const [tasa, setTasa] = useState("");

  const [comparar, setComparar] = useState(false);
  const [monto2, setMonto2] = useState("1000000");
  const [plazo2, setPlazo2] = useState("12");
  const [tasa2, setTasa2] = useState("");

  const [guardados, setGuardados] = useState<EscenarioGuardado[]>([]);
  const [nombre, setNombre] = useState("");
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    obtenerUsuario(uid).then((usuario) => {
      if (usuario) setNombre(usuario.nombre);
    });
  }, []);

  useEffect(() => {
    obtenerTasaTipConsumo().then((tasaReferencia) => {
      if (tasaReferencia) {
        setTasa(String(tasaReferencia.valor));
        setTasa2(String(tasaReferencia.valor));
      }
    });
    // Se lee una sola vez al abrir — no listener, la tasa no cambia
    // mientras el usuario simula.
  }, []);

  const cargarGuardados = useCallback(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    listarEscenariosGuardados(uid).then(setGuardados);
  }, []);

  // Persistente entre visitas a la pantalla: se recarga cada vez que
  // vuelve a estar en foco, no solo al montar. También vuelve el scroll
  // arriba al volver desde otra sección (mismo fix que Home).
  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      cargarGuardados();
    }, [cargarGuardados]),
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Simuladores</Text>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {nombre ? nombre.charAt(0).toUpperCase() : "?"}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.segmented}>
            <View style={[styles.segmentedOption, styles.segmentedOptionActive]}>
              <Text style={styles.segmentedTextActive}>Crédito de consumo</Text>
            </View>
            <TouchableOpacity
              style={styles.segmentedOption}
              activeOpacity={0.7}
              onPress={() => router.replace("/simulador-ahorro")}
            >
              <Text style={styles.segmentedTextInactive}>Cuenta de ahorro</Text>
            </TouchableOpacity>
          </View>

          <EscenarioCard
            label="Escenario 1"
            monto={monto}
            setMonto={setMonto}
            plazo={plazo}
            setPlazo={setPlazo}
            tasa={tasa}
            setTasa={setTasa}
            onGuardado={cargarGuardados}
            guardados={guardados}
          />

          {comparar ? (
            <EscenarioCard
              label="Escenario 2"
              monto={monto2}
              setMonto={setMonto2}
              plazo={plazo2}
              setPlazo={setPlazo2}
              tasa={tasa2}
              setTasa={setTasa2}
              onRemove={() => setComparar(false)}
              onGuardado={cargarGuardados}
              guardados={guardados}
            />
          ) : (
            <TouchableOpacity
              style={styles.agregarBtn}
              activeOpacity={0.8}
              onPress={() => setComparar(true)}
            >
              <Text style={styles.agregarBtnText}>+ Agregar segundo escenario</Text>
            </TouchableOpacity>
          )}

          {guardados.length > 0 ? (
            <View style={styles.guardadosSection}>
              <Text style={styles.guardadosTitulo}>Escenarios guardados</Text>
              {guardados.map((g) => (
                <GuardadoCard key={g.id} guardado={g} onEliminado={cargarGuardados} />
              ))}
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.card,
  },
  flex: {
    flex: 1,
  },
  flex1: {
    flex: 1,
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
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 16,
  },
  segmented: {
    flexDirection: "row",
    backgroundColor: colors.brandTint,
    borderRadius: 10,
    padding: 3,
    gap: 4,
  },
  segmentedOption: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 8,
  },
  segmentedOptionActive: {
    backgroundColor: colors.card,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  segmentedTextActive: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.brand,
    fontFamily: fonts.bodySemiBold,
  },
  segmentedTextInactive: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    fontFamily: fonts.bodySemiBold,
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: colors.brand,
    textTransform: "uppercase",
    fontFamily: fonts.bodySemiBold,
  },
  field: {
    gap: 8,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textPrimary,
    fontFamily: fonts.bodyRegular,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.card,
    fontFamily: fonts.bodyRegular,
  },
  inputStatic: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.card,
  },
  inputStaticText: {
    fontSize: 15,
    color: colors.textPrimary,
    fontFamily: fonts.bodyRegular,
  },
  resultBox: {
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 12,
    gap: 6,
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  resultLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  resultLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: fonts.bodyRegular,
  },
  resultValor: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    fontFamily: fonts.bodySemiBold,
  },
  resultValorGrande: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.textPrimary,
    fontFamily: fonts.displaySemiBold,
  },
  agregarBtn: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.brandBarTint,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  agregarBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.brand,
    fontFamily: fonts.bodySemiBold,
  },
  guardadosSection: {
    gap: 8,
  },
  guardadosTitulo: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    fontFamily: fonts.bodySemiBold,
  },
});

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(26,26,46,0.4)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 6,
    fontFamily: fonts.displaySemiBold,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 20,
    fontFamily: fonts.bodyRegular,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  button: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonNeutral: {
    backgroundColor: colors.background,
  },
  buttonNeutralText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
    fontFamily: fonts.bodySemiBold,
  },
  buttonDanger: {
    backgroundColor: colors.error,
  },
  buttonDangerText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: fonts.bodySemiBold,
  },
});
