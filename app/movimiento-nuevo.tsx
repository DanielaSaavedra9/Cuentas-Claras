import { zodResolver } from "@hookform/resolvers/zod";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Platform,
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
  valoresPorDefecto,
} from "@/components/movimiento-form";
import { brandColors as colors } from "@/constants/brand-colors";
import { brandFonts as fonts } from "@/constants/brand-fonts";
import { auth } from "@/firebaseConfig";
import { CategoriaMovimiento, crearMovimiento } from "@/services/movimientos";

export default function MovimientoNuevoScreen() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [firebaseError, setFirebaseError] = useState("");

  const form = useForm<MovimientoFormValues>({
    resolver: zodResolver(movimientoSchema),
    defaultValues: valoresPorDefecto(new Date()),
  });
  const { handleSubmit, watch } = form;

  const monto = watch("monto");
  const descripcion = watch("descripcion");
  const categoria = watch("categoria");
  const puedeGuardar = !!monto && !!descripcion.trim() && !!categoria;

  const onSubmit = async (data: MovimientoFormValues) => {
    setFirebaseError("");
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setFirebaseError("Debes iniciar sesión para registrar movimientos.");
      return;
    }

    setSubmitting(true);
    try {
      const fecha = `${data.anio}-${pad2(data.mes)}-${pad2(data.dia)}`;
      const previsibleFechaLimite =
        data.tipo === "gasto" && data.esPrevisible
          ? `${data.anioLimite}-${pad2(data.mesLimite)}-${pad2(data.diaLimite)}`
          : undefined;

      const id = await crearMovimiento(uid, {
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
      // Todavía no existe la lista de movimientos (RF03) desde donde
      // llegar al detalle — mientras tanto, navegamos directo al que se
      // acaba de crear para poder probar editar/eliminar (Bloque 2).
      router.replace(`/movimiento-detalle?id=${id}`);
    } catch {
      setFirebaseError("No se pudo guardar el movimiento. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

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
              onPress={() => router.back()}
              activeOpacity={0.7}
              hitSlop={8}
            >
              <Ionicons name="close" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
            <Text style={screenStyles.title}>Nuevo movimiento</Text>
            <View style={screenStyles.headerSpacer} />
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
              {submitting ? "Guardando…" : "Guardar"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
  headerSpacer: {
    width: 18,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.textPrimary,
    fontFamily: fonts.displaySemiBold,
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
});
