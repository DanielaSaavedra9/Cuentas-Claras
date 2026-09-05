import { zodResolver } from "@hookform/resolvers/zod";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
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
import { z } from "zod";

import { pad2 } from "@/components/movimiento-form";
import { SelectField } from "@/components/select-field";
import { brandColors as colors } from "@/constants/brand-colors";
import { brandFonts as fonts } from "@/constants/brand-fonts";
import { auth } from "@/firebaseConfig";
import {
  actualizarUsuario,
  eliminarCuentaCompleta,
  obtenerPerfilUsuario,
  PerfilUsuario,
} from "@/services/usuarios";
import { getAuthErrorMessage } from "@/utils/authErrors";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const DIAS = Array.from({ length: 31 }, (_, i) => String(i + 1));
const anioActual = new Date().getFullYear();
const ANIOS = Array.from({ length: 100 }, (_, i) => String(anioActual - i));

const editarPerfilSchema = z
  .object({
    nombre: z.string().trim().min(1, "Ingresa tu nombre"),
    apellido: z.string().trim().min(1, "Ingresa tu apellido"),
    dia: z.string().min(1, "Requerido"),
    mes: z.string().min(1, "Requerido"),
    anio: z.string().min(1, "Requerido"),
    sueldoMensual: z.string(),
  })
  .superRefine((data, ctx) => {
    const dia = Number(data.dia);
    const mes = Number(data.mes);
    const anio = Number(data.anio);
    if (dia && mes && anio) {
      const fecha = new Date(anio, mes - 1, dia);
      const esFechaValida =
        fecha.getFullYear() === anio &&
        fecha.getMonth() === mes - 1 &&
        fecha.getDate() === dia;
      if (!esFechaValida) {
        ctx.addIssue({ code: "custom", path: ["dia"], message: "Fecha inválida" });
      }
    }
  });

type EditarPerfilForm = z.infer<typeof editarPerfilSchema>;

function valoresDesdePerfil(p: PerfilUsuario): EditarPerfilForm {
  const [anio, mes, dia] = p.fechaNacimiento.split("-");
  return {
    nombre: p.nombre,
    apellido: p.apellido,
    dia: String(Number(dia)),
    mes: String(Number(mes)),
    anio,
    sueldoMensual: p.sueldoMensual != null ? String(p.sueldoMensual) : "",
  };
}

// Menú de usuario (.claude/dropdown-cerrar-sesion.md, Bloques 2-3):
// pantalla de "Editar mis datos" — precarga el documento Usuarios/{uid}
// (salvo el correo, de solo lectura por decisión de la usuaria), y al
// final ofrece "Darse de baja" (eliminación completa de la cuenta, con
// confirmación + contraseña).
export default function EditarPerfilScreen() {
  const router = useRouter();
  const correo = auth.currentUser?.email ?? "";

  const [cargando, setCargando] = useState(true);
  const [noEncontrado, setNoEncontrado] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [firebaseError, setFirebaseError] = useState("");

  const [confirmarBaja, setConfirmarBaja] = useState(false);
  const [password, setPassword] = useState("");
  const [eliminandoCuenta, setEliminandoCuenta] = useState(false);
  const [errorBaja, setErrorBaja] = useState("");

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditarPerfilForm>({
    resolver: zodResolver(editarPerfilSchema),
  });

  const cargarPerfil = useCallback(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setNoEncontrado(true);
      setCargando(false);
      return;
    }
    obtenerPerfilUsuario(uid)
      .then((perfil) => {
        if (!perfil) {
          setNoEncontrado(true);
          return;
        }
        reset(valoresDesdePerfil(perfil));
      })
      .catch(() => setNoEncontrado(true))
      .finally(() => setCargando(false));
  }, [reset]);

  // react-hooks/set-state-in-effect (mismo caso que
  // gasto-previsible-detalle.tsx, RF05): el `setState` síncrono de la
  // rama sin uid de `cargarPerfil` se difiere a un microtask para no
  // llamarlo dentro del cuerpo del efecto.
  useEffect(() => {
    Promise.resolve().then(cargarPerfil);
  }, [cargarPerfil]);

  const onSubmit = async (data: EditarPerfilForm) => {
    setFirebaseError("");
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setFirebaseError("Debes iniciar sesión para editar tus datos.");
      return;
    }
    setSubmitting(true);
    try {
      await actualizarUsuario(uid, {
        nombre: data.nombre.trim(),
        apellido: data.apellido.trim(),
        fechaNacimiento: `${data.anio}-${pad2(data.mes)}-${pad2(data.dia)}`,
        sueldoMensual: data.sueldoMensual ? Number(data.sueldoMensual) : null,
      });
      router.back();
    } catch {
      setFirebaseError("No se pudieron guardar los cambios. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  const onConfirmarBaja = async () => {
    setErrorBaja("");
    if (!password) {
      setErrorBaja("Ingresa tu contraseña para confirmar.");
      return;
    }
    setEliminandoCuenta(true);
    try {
      await eliminarCuentaCompleta(password);
      router.replace("/");
    } catch (error) {
      const code = (error as { code?: string }).code;
      setErrorBaja(getAuthErrorMessage(code));
    } finally {
      setEliminandoCuenta(false);
    }
  };

  if (cargando) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.brand} />
        </View>
      </SafeAreaView>
    );
  }

  if (noEncontrado) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>No se pudieron cargar tus datos.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.7}
              hitSlop={8}
            >
              <Ionicons name="close" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.title}>Editar mis datos</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Nombre</Text>
            <Controller
              control={control}
              name="nombre"
              render={({ field: { value, onChange, onBlur } }) => (
                <TextInput
                  style={[styles.input, errors.nombre && styles.inputError]}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Juan"
                  placeholderTextColor={colors.textTertiary}
                />
              )}
            />
            {errors.nombre ? (
              <Text style={styles.fieldErrorText}>{errors.nombre.message}</Text>
            ) : null}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Apellido</Text>
            <Controller
              control={control}
              name="apellido"
              render={({ field: { value, onChange, onBlur } }) => (
                <TextInput
                  style={[styles.input, errors.apellido && styles.inputError]}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Ríos"
                  placeholderTextColor={colors.textTertiary}
                />
              )}
            />
            {errors.apellido ? (
              <Text style={styles.fieldErrorText}>{errors.apellido.message}</Text>
            ) : null}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Correo</Text>
            <View style={styles.inputStatic}>
              <Text style={styles.inputStaticText}>{correo}</Text>
            </View>
            <Text style={styles.helperText}>El correo no se puede editar.</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Fecha de nacimiento</Text>
            <View style={styles.dateRow}>
              <View style={styles.dateCol}>
                <Controller
                  control={control}
                  name="dia"
                  render={({ field: { value, onChange } }) => (
                    <SelectField
                      placeholder="Día"
                      value={value}
                      onChange={onChange}
                      hasError={!!errors.dia}
                      options={DIAS.map((d) => ({ label: d, value: d }))}
                    />
                  )}
                />
              </View>
              <View style={styles.dateColWide}>
                <Controller
                  control={control}
                  name="mes"
                  render={({ field: { value, onChange } }) => (
                    <SelectField
                      placeholder="Mes"
                      value={value}
                      onChange={onChange}
                      hasError={!!errors.mes}
                      options={MESES.map((label, index) => ({
                        label,
                        value: String(index + 1),
                      }))}
                    />
                  )}
                />
              </View>
              <View style={styles.dateCol}>
                <Controller
                  control={control}
                  name="anio"
                  render={({ field: { value, onChange } }) => (
                    <SelectField
                      placeholder="Año"
                      value={value}
                      onChange={onChange}
                      hasError={!!errors.anio}
                      options={ANIOS.map((a) => ({ label: a, value: a }))}
                    />
                  )}
                />
              </View>
            </View>
            {errors.dia ? (
              <Text style={styles.fieldErrorText}>{errors.dia.message}</Text>
            ) : null}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Sueldo mensual (opcional)</Text>
            <Controller
              control={control}
              name="sueldoMensual"
              render={({ field: { value, onChange } }) => (
                <TextInput
                  style={styles.input}
                  value={value}
                  onChangeText={(t) => onChange(t.replace(/[^0-9]/g, ""))}
                  keyboardType="numeric"
                  placeholder="$0"
                  placeholderTextColor={colors.textTertiary}
                />
              )}
            />
          </View>

          {firebaseError ? (
            <Text style={[styles.fieldErrorText, styles.firebaseError]}>
              {firebaseError}
            </Text>
          ) : null}

          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            activeOpacity={0.85}
            onPress={handleSubmit(onSubmit)}
            disabled={submitting}
          >
            <Text style={styles.submitButtonText}>
              {submitting ? "Guardando…" : "Guardar"}
            </Text>
          </TouchableOpacity>

          <View style={styles.bajaSection}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                setPassword("");
                setErrorBaja("");
                setConfirmarBaja(true);
              }}
            >
              <Text style={styles.bajaLink}>Darse de baja</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={confirmarBaja}
        transparent
        animationType="fade"
        onRequestClose={() => !eliminandoCuenta && setConfirmarBaja(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => !eliminandoCuenta && setConfirmarBaja(false)}
        >
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>¿Eliminar tu cuenta?</Text>
            <Text style={styles.modalSubtitle}>
              Se borrarán todos tus datos (movimientos, escenarios guardados y tu
              perfil) de forma permanente. Esta acción no se puede deshacer.
            </Text>
            <Text style={styles.label}>Confirma tu contraseña</Text>
            <TextInput
              style={[styles.input, styles.modalInput]}
              value={password}
              onChangeText={setPassword}
              placeholder="Contraseña"
              placeholderTextColor={colors.textTertiary}
              secureTextEntry
              editable={!eliminandoCuenta}
            />
            {errorBaja ? (
              <Text style={styles.fieldErrorText}>{errorBaja}</Text>
            ) : null}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonNeutral]}
                activeOpacity={0.85}
                onPress={() => setConfirmarBaja(false)}
                disabled={eliminandoCuenta}
              >
                <Text style={styles.modalButtonNeutralText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonDanger]}
                activeOpacity={0.85}
                onPress={onConfirmarBaja}
                disabled={eliminandoCuenta}
              >
                <Text style={styles.modalButtonDangerText}>
                  {eliminandoCuenta ? "Eliminando…" : "Eliminar cuenta"}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textPrimary,
    marginBottom: 8,
    fontFamily: fonts.bodySemiBold,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.card,
    fontFamily: fonts.bodyRegular,
  },
  inputError: {
    borderColor: colors.error,
  },
  inputStatic: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
  },
  inputStaticText: {
    fontSize: 15,
    color: colors.textSecondary,
    fontFamily: fonts.bodyRegular,
  },
  helperText: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 6,
    fontFamily: fonts.bodyRegular,
  },
  dateRow: {
    flexDirection: "row",
    gap: 8,
  },
  dateCol: {
    flex: 1,
  },
  dateColWide: {
    flex: 1.4,
  },
  fieldErrorText: {
    fontSize: 12.5,
    color: colors.error,
    marginTop: 6,
    fontFamily: fonts.bodyRegular,
  },
  errorText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: fonts.bodyRegular,
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
  bajaSection: {
    marginTop: 24,
    alignItems: "center",
  },
  bajaLink: {
    fontSize: 13.5,
    fontWeight: "600",
    color: colors.error,
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
    marginBottom: 16,
    lineHeight: 18,
    fontFamily: fonts.bodyRegular,
  },
  modalInput: {
    marginBottom: 4,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
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
