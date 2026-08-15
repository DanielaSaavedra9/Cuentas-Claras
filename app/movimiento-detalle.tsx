import { zodResolver } from "@hookform/resolvers/zod";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  MovimientoFormFields,
  MovimientoFormValues,
  movimientoSchema,
  pad2,
  styles as formStyles,
} from "@/components/movimiento-form";
import { brandColors as colors } from "@/constants/brand-colors";
import { brandFonts as fonts } from "@/constants/brand-fonts";
import { auth } from "@/firebaseConfig";
import {
  actualizarMovimiento,
  CategoriaMovimiento,
  eliminarMovimiento,
  Movimiento,
  obtenerMovimiento,
} from "@/services/movimientos";

function valoresDesdeMovimiento(m: Movimiento): MovimientoFormValues {
  const [anio, mes, dia] = m.fecha.split("-");
  const [anioLimite = "", mesLimite = "", diaLimite = ""] = (
    m.previsibleFechaLimite ?? ""
  ).split("-");

  return {
    tipo: m.tipo,
    monto: String(m.monto),
    descripcion: m.descripcion,
    categoria: m.categoria,
    dia: String(Number(dia)),
    mes: String(Number(mes)),
    anio,
    compartido: !!m.compartido,
    numeroPersonas: m.numeroPersonas ? String(m.numeroPersonas) : "2",
    esPrevisible: !!m.esPrevisible,
    diaLimite: diaLimite ? String(Number(diaLimite)) : "",
    mesLimite: mesLimite ? String(Number(mesLimite)) : "",
    anioLimite,
  };
}

export default function MovimientoDetalleScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [cargando, setCargando] = useState(true);
  const [noEncontrado, setNoEncontrado] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const [firebaseError, setFirebaseError] = useState("");

  const form = useForm<MovimientoFormValues>({
    resolver: zodResolver(movimientoSchema),
  });
  const { handleSubmit, watch, reset } = form;

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid || !id) {
      setNoEncontrado(true);
      setCargando(false);
      return;
    }
    obtenerMovimiento(uid, id)
      .then((movimiento) => {
        if (!movimiento) {
          setNoEncontrado(true);
          return;
        }
        reset(valoresDesdeMovimiento(movimiento));
      })
      .catch(() => setNoEncontrado(true))
      .finally(() => setCargando(false));
  }, [id, reset]);

  const monto = watch("monto");
  const descripcion = watch("descripcion");
  const categoria = watch("categoria");
  const puedeGuardar = !!monto && !!descripcion?.trim() && !!categoria;

  const onSubmit = async (data: MovimientoFormValues) => {
    setFirebaseError("");
    const uid = auth.currentUser?.uid;
    if (!uid || !id) {
      setFirebaseError("No se pudo identificar el movimiento.");
      return;
    }

    setSubmitting(true);
    try {
      const fecha = `${data.anio}-${pad2(data.mes)}-${pad2(data.dia)}`;
      const previsibleFechaLimite =
        data.tipo === "gasto" && data.esPrevisible
          ? `${data.anioLimite}-${pad2(data.mesLimite)}-${pad2(data.diaLimite)}`
          : undefined;

      await actualizarMovimiento(uid, id, {
        tipo: data.tipo,
        monto: Number(data.monto),
        descripcion: data.descripcion.trim(),
        categoria: data.categoria as CategoriaMovimiento,
        fecha,
        compartido: data.tipo === "gasto" ? data.compartido : undefined,
        numeroPersonas:
          data.tipo === "gasto" && data.compartido
            ? Number(data.numeroPersonas)
            : undefined,
        esPrevisible: data.tipo === "gasto" ? data.esPrevisible : undefined,
        previsibleFechaLimite,
      });
      router.replace("/(tabs)");
    } catch {
      setFirebaseError("No se pudo actualizar el movimiento. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  const onEliminar = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid || !id) return;

    setEliminando(true);
    try {
      await eliminarMovimiento(uid, id);
      router.replace("/(tabs)");
    } catch {
      setFirebaseError("No se pudo eliminar el movimiento. Intenta de nuevo.");
      setConfirmarEliminar(false);
    } finally {
      setEliminando(false);
    }
  };

  if (cargando) {
    return (
      <SafeAreaView style={screenStyles.safeArea} edges={["top", "bottom"]}>
        <View style={screenStyles.centered}>
          <ActivityIndicator color={colors.brand} />
        </View>
      </SafeAreaView>
    );
  }

  if (noEncontrado) {
    return (
      <SafeAreaView style={screenStyles.safeArea} edges={["top", "bottom"]}>
        <View style={screenStyles.centered}>
          <Text style={screenStyles.title}>Movimiento no encontrado</Text>
          <TouchableOpacity
            style={screenStyles.backLink}
            onPress={() => router.replace("/(tabs)")}
          >
            <Text style={screenStyles.backLinkText}>Volver al inicio</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={screenStyles.safeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={screenStyles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={screenStyles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={screenStyles.header}>
            <TouchableOpacity
              onPress={() => router.replace("/(tabs)")}
              activeOpacity={0.7}
              hitSlop={8}
            >
              <Ionicons name="close" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
            <Text style={screenStyles.title}>Editar movimiento</Text>
            <TouchableOpacity
              onPress={() => setConfirmarEliminar(true)}
              activeOpacity={0.7}
              hitSlop={8}
            >
              <Ionicons name="trash-outline" size={18} color={colors.error} />
            </TouchableOpacity>
          </View>

          <MovimientoFormFields form={form} />

          {firebaseError ? (
            <Text style={[formStyles.errorText, screenStyles.firebaseError]}>
              {firebaseError}
            </Text>
          ) : null}

          <TouchableOpacity
            style={[
              screenStyles.submitButton,
              (!puedeGuardar || submitting) && screenStyles.submitButtonDisabled,
            ]}
            activeOpacity={0.85}
            onPress={handleSubmit(onSubmit)}
            disabled={!puedeGuardar || submitting}
          >
            <Text style={screenStyles.submitButtonText}>
              {submitting ? "Guardando…" : "Guardar cambios"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={confirmarEliminar}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmarEliminar(false)}
      >
        <Pressable
          style={screenStyles.modalBackdrop}
          onPress={() => !eliminando && setConfirmarEliminar(false)}
        >
          <Pressable style={screenStyles.modalCard} onPress={() => {}}>
            <Text style={screenStyles.modalTitle}>¿Eliminar movimiento?</Text>
            <Text style={screenStyles.modalSubtitle}>
              Esta acción no se puede deshacer.
            </Text>
            <View style={screenStyles.modalActions}>
              <TouchableOpacity
                style={[screenStyles.modalButton, screenStyles.modalButtonNeutral]}
                activeOpacity={0.85}
                onPress={() => setConfirmarEliminar(false)}
                disabled={eliminando}
              >
                <Text style={screenStyles.modalButtonNeutralText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[screenStyles.modalButton, screenStyles.modalButtonDanger]}
                activeOpacity={0.85}
                onPress={onEliminar}
                disabled={eliminando}
              >
                <Text style={screenStyles.modalButtonDangerText}>
                  {eliminando ? "Eliminando…" : "Eliminar"}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const screenStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.card,
  },
  flex: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.textPrimary,
    fontFamily: fonts.displaySemiBold,
  },
  backLink: {
    marginTop: 4,
  },
  backLinkText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.brand,
    fontFamily: fonts.bodySemiBold,
  },
  firebaseError: {
    textAlign: "center",
    marginBottom: 8,
  },
  submitButton: {
    backgroundColor: colors.brand,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    fontFamily: fonts.bodySemiBold,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(26,26,46,0.4)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 6,
    fontFamily: fonts.displaySemiBold,
  },
  modalSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 20,
    fontFamily: fonts.bodyRegular,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
  },
  modalButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalButtonNeutral: {
    backgroundColor: colors.background,
  },
  modalButtonNeutralText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
    fontFamily: fonts.bodySemiBold,
  },
  modalButtonDanger: {
    backgroundColor: colors.error,
  },
  modalButtonDangerText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: fonts.bodySemiBold,
  },
});
