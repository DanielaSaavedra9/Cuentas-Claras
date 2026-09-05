import { router, useFocusEffect } from "expo-router";
import { signOut } from "firebase/auth";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
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
import { UserMenuSheet } from "@/components/user-menu-sheet";
import { brandColors as colors } from "@/constants/brand-colors";
import { brandFonts as fonts } from "@/constants/brand-fonts";
import { auth } from "@/firebaseConfig";
import {
  obtenerTasaCuentaAhorro,
  obtenerTasaCuentaRemunerada,
} from "@/services/tasasReferencia";
import { obtenerUsuario } from "@/services/usuarios";
import {
  calcularInteresGanado,
  calcularSaldoFinal,
  calcularTotalAportado,
  compararRendimiento,
} from "@/utils/cuentaAhorro";

function formatCLP(valor: number) {
  return "$" + Math.round(valor).toLocaleString("es-CL");
}

// Campos de monto: el estado guarda solo dígitos; se muestran con
// separador de miles es-CL (kit "Cuentas Claras Design System-5").
function formatMiles(digitos: string) {
  return digitos === "" ? "" : Number(digitos).toLocaleString("es-CL");
}

// Mismo toggle 44×26 que el resto de la app (movimiento-form.tsx,
// gasto-previsible-detalle.tsx) — no el Switch nativo. Riel apagado en
// colors.switchOff (valor del kit), no en colors.border, que sobre el
// fondo gris casi no se distingue.
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

type Unidad = "meses" | "anios";

// RF08 Bloque 2/3: simulador de cuenta de ahorro. La sub-pestaña se
// activa desde el segmentado del header (la de "Crédito de consumo"
// vuelve a app/(tabs)/simulador-credito.tsx). El cálculo usa
// utils/cuentaAhorro.ts —interés compuesto, aporte anticipado, tasa
// anual EFECTIVA (raíz 12, no dividir entre 12)—, no la fórmula low-fi
// del mockup del kit. Layout tomado de "Cuentas Claras Design System-4".
export default function SimuladorAhorroScreen() {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [menuAbierto, setMenuAbierto] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const [inicial, setInicial] = useState("500000");
  const [mensual, setMensual] = useState("0");
  const [plazo, setPlazo] = useState("3");
  const [unidad, setUnidad] = useState<Unidad>("anios");

  const [comparar, setComparar] = useState(false);
  const [tasaAhorro, setTasaAhorro] = useState("4.2");
  const [tasaRemunerada, setTasaRemunerada] = useState("4.8");

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

  useEffect(() => {
    // Se leen una sola vez al abrir — no listener, las tasas de referencia
    // no cambian mientras el usuario simula.
    obtenerTasaCuentaAhorro().then((tasa) => {
      if (tasa) setTasaAhorro(String(tasa.valor));
    });
    obtenerTasaCuentaRemunerada().then((tasa) => {
      if (tasa) setTasaRemunerada(String(tasa.valor));
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, []),
  );

  const P = Number(inicial) || 0;
  const M = Number(mensual) || 0;
  const meses = unidad === "anios" ? (Number(plazo) || 0) * 12 : Number(plazo) || 0;

  // Bloque 2: no calcular si el ahorro inicial o el plazo están vacíos o
  // inválidos. El ahorro mensual en 0 sí calcula.
  const inicialValido = inicial.trim() !== "" && Number.isFinite(Number(inicial)) && P >= 0;
  const puedeCalcular = inicialValido && meses > 0;

  const proyectar = (tasaAnual: string) => {
    const t = Number(tasaAnual) || 0;
    const saldoFinal = calcularSaldoFinal(P, M, t, meses);
    const totalAportado = calcularTotalAportado(P, M, meses);
    return {
      total: saldoFinal,
      aportado: totalAportado,
      interes: calcularInteresGanado(saldoFinal, totalAportado),
    };
  };

  const ahorro = proyectar(tasaAhorro);
  const remunerada = proyectar(tasaRemunerada);
  const comparacion = compararRendimiento(ahorro.total, remunerada.total);
  const mensualAportado = M * meses;

  const onlyNum = (t: string) => t.replace(/[^0-9]/g, "");
  const onlyDecimal = (t: string) => t.replace(/[^0-9.]/g, "");

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Simuladores</Text>
        <Pressable onPress={() => setMenuAbierto(true)}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {nombre ? nombre.charAt(0).toUpperCase() : "?"}
            </Text>
          </View>
        </Pressable>
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
            <TouchableOpacity
              style={styles.segmentedOption}
              activeOpacity={0.7}
              onPress={() => router.replace("/simulador-credito")}
            >
              <Text style={styles.segmentedTextInactive}>Crédito de consumo</Text>
            </TouchableOpacity>
            <View style={[styles.segmentedOption, styles.segmentedOptionActive]}>
              <Text style={styles.segmentedTextActive}>Cuenta de ahorro</Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.field}>
              <Text style={styles.label}>Ahorro inicial</Text>
              <TextInput
                style={styles.input}
                value={formatMiles(inicial)}
                onChangeText={(t) => setInicial(onlyNum(t))}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Ahorro mensual</Text>
              <TextInput
                style={styles.input}
                value={formatMiles(mensual)}
                onChangeText={(t) => setMensual(onlyNum(t))}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Plazo</Text>
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, styles.flex1]}
                  value={plazo}
                  onChangeText={(t) => setPlazo(onlyNum(t))}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textTertiary}
                />
                <View style={styles.unidadToggle}>
                  {(["meses", "anios"] as Unidad[]).map((u) => {
                    const activo = unidad === u;
                    return (
                      <TouchableOpacity
                        key={u}
                        activeOpacity={0.7}
                        onPress={() => setUnidad(u)}
                        style={[styles.unidadOption, activo && styles.unidadOptionActive]}
                      >
                        <Text
                          style={[
                            styles.unidadText,
                            activo && styles.unidadTextActive,
                          ]}
                        >
                          {u === "anios" ? "Años" : "Meses"}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            <View style={styles.compararRow}>
              <Text style={styles.label}>Comparar con cuenta remunerada</Text>
              <Switch value={comparar} onChange={() => setComparar((v) => !v)} />
            </View>

            {comparar ? (
              <>
                <Text style={styles.helpText}>
                  La cuenta remunerada paga rendimiento diario, sin plazo fijo — aquí
                  se proyecta al mismo horizonte para comparar.
                </Text>
                <View style={styles.row}>
                  <View style={[styles.field, styles.flex1]}>
                    <Text style={styles.label} numberOfLines={1}>
                      Tasa ahorro (%)
                    </Text>
                    <TextInput
                      style={styles.input}
                      value={tasaAhorro}
                      onChangeText={(t) => setTasaAhorro(onlyDecimal(t))}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor={colors.textTertiary}
                    />
                  </View>
                  <View style={[styles.field, styles.flex1]}>
                    <Text style={styles.label} numberOfLines={1}>
                      Tasa remunerada (%)
                    </Text>
                    <TextInput
                      style={styles.input}
                      value={tasaRemunerada}
                      onChangeText={(t) => setTasaRemunerada(onlyDecimal(t))}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor={colors.textTertiary}
                    />
                  </View>
                </View>
              </>
            ) : (
              <View style={styles.field}>
                <Text style={styles.label}>Tasa anual (%)</Text>
                <TextInput
                  style={styles.input}
                  value={tasaAhorro}
                  onChangeText={(t) => setTasaAhorro(onlyDecimal(t))}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={colors.textTertiary}
                />
                <Text style={styles.fieldHint}>
                  Prellenada con la tasa promedio de mercado — puedes editarla.
                </Text>
              </View>
            )}

            {!puedeCalcular ? (
              <View style={styles.placeholderBox}>
                <Text style={styles.placeholderText}>
                  Ingresa un monto inicial y un plazo para ver la proyección.
                </Text>
              </View>
            ) : comparar ? (
              <>
                <View style={styles.comparaGrid}>
                  {[
                    { label: "Cuenta de ahorro", r: ahorro, tint: colors.brandTint, ink: colors.brand },
                    { label: "Cuenta remunerada", r: remunerada, tint: colors.successTint, ink: colors.success },
                  ].map((c) => (
                    <View key={c.label} style={[styles.comparaCard, { backgroundColor: c.tint }]}>
                      <Text style={[styles.comparaLabel, { color: c.ink }]}>{c.label}</Text>
                      <Text style={styles.comparaSubLabel}>Total reunido</Text>
                      <Text style={styles.comparaTotal}>{formatCLP(c.r.total)}</Text>
                      <View style={styles.comparaDivider} />
                      <Text style={styles.comparaSubLabel}>
                        Aportado: {formatCLP(c.r.aportado)}
                      </Text>
                      <Text style={[styles.comparaInteres, { color: c.ink }]}>
                        Interés: {formatCLP(c.r.interes)}
                      </Text>
                    </View>
                  ))}
                </View>
                <Text
                  style={[
                    styles.comparaFrase,
                    { color: comparacion.mejor === "remunerada" ? colors.success : colors.brand },
                  ]}
                >
                  {comparacion.mejor === "iguales"
                    ? "Ambas opciones rinden lo mismo en este plazo."
                    : `${
                        comparacion.mejor === "remunerada"
                          ? "La cuenta remunerada"
                          : "La cuenta de ahorro"
                      } rinde ${formatCLP(comparacion.diferencia)} más en este plazo.`}
                </Text>
              </>
            ) : (
              <View style={styles.resultBox}>
                <View style={styles.resultCaptionRow}>
                  <Text style={styles.resultCaption}>Con interés compuesto</Text>
                  <TooltipInfo terminoId="interesCompuesto" />
                </View>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Total reunido</Text>
                  <Text style={styles.resultValorGrande}>{formatCLP(ahorro.total)}</Text>
                </View>

                <View style={styles.resultRow}>
                  <Text style={styles.resultSubLabel}>Abono inicial</Text>
                  <Text style={styles.resultSubLabel}>{formatCLP(P)}</Text>
                </View>

                <View style={styles.desgloseRow}>
                  <View style={[styles.desgloseCard, styles.desgloseCardRentabilidad]}>
                    <Text style={styles.desgloseTitulo}>Rentabilidad total</Text>
                    <Text style={styles.desgloseValor}>{formatCLP(ahorro.interes)}</Text>
                    <Text style={styles.desgloseNota}>
                      sobre tu abono inicial y tus aportes mensuales
                    </Text>
                  </View>
                  <View style={[styles.desgloseCard, styles.desgloseCardCompuesto]}>
                    <Text style={styles.desgloseTitulo}>Ahorro mensual acumulado</Text>
                    <Text style={styles.desgloseValor}>{formatCLP(mensualAportado)}</Text>
                    <Text style={styles.desgloseNota}>lo que ahorraste mes a mes</Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Bloque 2: aviso educativo obligatorio (RNF03, Ley Fintech
              N°21.521), visible desde el primer render. */}
          <Text style={styles.aviso}>
            Los montos son una estimación educativa calculada con interés compuesto
            sobre la tasa que ingreses. No consideran impuestos, comisiones ni
            retiros anticipados, y no constituyen una oferta ni asesoría financiera.
            La rentabilidad efectiva depende de las condiciones de cada institución
            (Ley N°21.521).
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

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
  fieldHint: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: fonts.bodyRegular,
  },
  helpText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    fontFamily: fonts.bodyRegular,
  },
  unidadToggle: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    overflow: "hidden",
  },
  unidadOption: {
    paddingHorizontal: 14,
    justifyContent: "center",
    backgroundColor: colors.card,
  },
  unidadOptionActive: {
    backgroundColor: colors.brand,
  },
  unidadText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
    fontFamily: fonts.bodySemiBold,
  },
  unidadTextActive: {
    color: "#FFFFFF",
  },
  switchTrack: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.switchOff,
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
  compararRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  placeholderBox: {
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    fontFamily: fonts.bodyRegular,
  },
  resultBox: {
    backgroundColor: colors.successTint,
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  resultCaptionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  resultCaption: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: fonts.bodyRegular,
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  resultLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: fonts.bodyRegular,
  },
  resultSubLabel: {
    fontSize: 11.5,
    color: colors.textSecondary,
    fontFamily: fonts.bodyRegular,
  },
  resultValorGrande: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.textPrimary,
    fontFamily: fonts.displaySemiBold,
  },
  desgloseRow: {
    flexDirection: "row",
    gap: 8,
  },
  desgloseCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 10,
    gap: 3,
    borderWidth: 1.5,
  },
  desgloseCardRentabilidad: {
    borderColor: colors.success,
  },
  desgloseCardCompuesto: {
    borderColor: colors.successStrong,
  },
  desgloseTitulo: {
    fontSize: 11.5,
    fontWeight: "600",
    lineHeight: 15,
    color: colors.successStrong,
    fontFamily: fonts.bodySemiBold,
  },
  desgloseValor: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.successStrong,
    fontFamily: fonts.displaySemiBold,
  },
  desgloseNota: {
    fontSize: 10.5,
    lineHeight: 14,
    color: colors.textSecondary,
    fontFamily: fonts.bodyRegular,
  },
  comparaGrid: {
    flexDirection: "row",
    gap: 10,
  },
  comparaCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  comparaLabel: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: fonts.bodySemiBold,
  },
  comparaSubLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: fonts.bodyRegular,
  },
  comparaTotal: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
    fontFamily: fonts.displaySemiBold,
  },
  comparaDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 2,
  },
  comparaInteres: {
    fontSize: 12.5,
    fontWeight: "700",
    fontFamily: fonts.bodySemiBold,
  },
  comparaFrase: {
    fontSize: 12,
    textAlign: "center",
    fontWeight: "600",
    fontFamily: fonts.bodySemiBold,
  },
  aviso: {
    fontSize: 11,
    lineHeight: 16,
    color: colors.textSecondary,
    fontFamily: fonts.bodyRegular,
  },
});
