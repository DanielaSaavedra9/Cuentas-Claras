import { zodResolver } from "@hookform/resolvers/zod";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";

import { SelectField } from "@/components/select-field";
import { brandColors as colors } from "@/constants/brand-colors";
import { brandFonts as fonts } from "@/constants/brand-fonts";
import { auth } from "@/firebaseConfig";
import { crearUsuarioSiNoExiste } from "@/services/usuarios";
import { getAuthErrorMessage } from "@/utils/authErrors";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const DIAS = Array.from({ length: 31 }, (_, i) => String(i + 1));
const anioActual = new Date().getFullYear();
const ANIOS = Array.from({ length: 100 }, (_, i) => String(anioActual - i));

export const registroSchema = z
  .object({
    nombre: z.string().trim().min(1, "Ingresa tu nombre"),
    apellido: z.string().trim().min(1, "Ingresa tu apellido"),
    email: z
      .string()
      .trim()
      .min(1, "Ingresa tu correo")
      .pipe(z.email("Correo inválido")),
    password: z.string().min(8, "Mínimo 8 caracteres"),
    dia: z.string().min(1, "Requerido"),
    mes: z.string().min(1, "Requerido"),
    anio: z.string().min(1, "Requerido"),
    sueldoMensual: z.string().optional(),
    aceptaTerminos: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (!data.aceptaTerminos) {
      ctx.addIssue({
        code: "custom",
        path: ["aceptaTerminos"],
        message: "Debes aceptar para continuar",
      });
    }

    const dia = Number(data.dia);
    const mes = Number(data.mes);
    const anio = Number(data.anio);
    if (!dia || !mes || !anio) return;

    const fecha = new Date(anio, mes - 1, dia);
    const esFechaValida =
      fecha.getFullYear() === anio &&
      fecha.getMonth() === mes - 1 &&
      fecha.getDate() === dia;

    if (!esFechaValida) {
      ctx.addIssue({ code: "custom", path: ["dia"], message: "Fecha inválida" });
      return;
    }
    if (fecha.getTime() > Date.now()) {
      ctx.addIssue({
        code: "custom",
        path: ["dia"],
        message: "La fecha no puede ser futura",
      });
    }
  });

type RegistroForm = z.infer<typeof registroSchema>;

function pad2(value: string) {
  return value.padStart(2, "0");
}

export default function RegistroScreen() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [firebaseError, setFirebaseError] = useState("");

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegistroForm>({
    resolver: zodResolver(registroSchema),
    defaultValues: {
      nombre: "",
      apellido: "",
      email: "",
      password: "",
      dia: "",
      mes: "",
      anio: "",
      sueldoMensual: "",
      aceptaTerminos: false,
    },
  });

  const onSubmit = async (data: RegistroForm) => {
    setFirebaseError("");
    setSubmitting(true);
    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        data.email.trim(),
        data.password,
      );

      const fechaNacimiento = `${data.anio}-${pad2(data.mes)}-${pad2(data.dia)}`;
      const sueldoMensual = data.sueldoMensual
        ? Number(data.sueldoMensual)
        : null;

      try {
        await crearUsuarioSiNoExiste(credential.user.uid, {
          nombre: data.nombre.trim(),
          apellido: data.apellido.trim(),
          correo: data.email.trim(),
          fechaNacimiento,
          sueldoMensual,
          consentimientoAceptado: true,
        });
      } catch {
        // Si falla el guardado en Firestore (ej. sin red) no se reintenta
        // aquí: el próximo login vuelve a llamar a esta función, que es
        // idempotente (RF01 Bloque 6).
      }

      router.replace("/(tabs)");
    } catch (error) {
      const code = (error as { code?: string }).code;
      setFirebaseError(getAuthErrorMessage(code));
    } finally {
      setSubmitting(false);
    }
  };

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
          <TouchableOpacity
            style={styles.backLink}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={20} color={colors.brand} />
            <Text style={styles.backLinkText}>Volver</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Cuéntanos de ti</Text>
          <Text style={styles.subtitle}>
            Así personalizamos tu experiencia en Cuentas Claras.
          </Text>

          <View style={styles.field}>
            <Text style={styles.label}>Nombre</Text>
            <Controller
              control={control}
              name="nombre"
              render={({ field: { value, onChange, onBlur } }) => (
                <TextInput
                  style={[styles.input, errors.nombre && styles.inputError]}
                  placeholder="Juan"
                  placeholderTextColor={colors.textTertiary}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
            {errors.nombre ? (
              <Text style={styles.errorText}>{errors.nombre.message}</Text>
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
                  placeholder="Ríos"
                  placeholderTextColor={colors.textTertiary}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
            {errors.apellido ? (
              <Text style={styles.errorText}>{errors.apellido.message}</Text>
            ) : null}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { value, onChange, onBlur } }) => (
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  placeholder="email@email.com"
                  placeholderTextColor={colors.textTertiary}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              )}
            />
            {errors.email ? (
              <Text style={styles.errorText}>{errors.email.message}</Text>
            ) : null}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Contraseña</Text>
            <Controller
              control={control}
              name="password"
              render={({ field: { value, onChange, onBlur } }) => (
                <TextInput
                  style={[styles.input, errors.password && styles.inputError]}
                  placeholder="Mínimo 8 caracteres"
                  placeholderTextColor={colors.textTertiary}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureTextEntry
                />
              )}
            />
            {errors.password ? (
              <Text style={styles.errorText}>{errors.password.message}</Text>
            ) : null}
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
              <Text style={styles.errorText}>{errors.dia.message}</Text>
            ) : null}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Sueldo mensual (opcional)</Text>
            <Controller
              control={control}
              name="sueldoMensual"
              render={({ field: { value, onChange, onBlur } }) => (
                <TextInput
                  style={styles.input}
                  placeholder="$0"
                  placeholderTextColor={colors.textTertiary}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="numeric"
                />
              )}
            />
            <Text style={styles.helperText}>
              Lo usamos solo para sugerir cuotas y metas de ahorro realistas —
              nunca se comparte.
            </Text>
          </View>

          <Controller
            control={control}
            name="aceptaTerminos"
            render={({ field: { value, onChange } }) => (
              <TouchableOpacity
                style={styles.checkboxRow}
                activeOpacity={0.8}
                onPress={() => onChange(!value)}
              >
                <View style={[styles.checkbox, value && styles.checkboxChecked]}>
                  {value ? (
                    <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                  ) : null}
                </View>
                <Text style={styles.checkboxLabel}>
                  He leído y acepto los Términos y Condiciones y la Política
                  de Privacidad, conforme a la Ley N°19.628
                </Text>
              </TouchableOpacity>
            )}
          />
          {errors.aceptaTerminos ? (
            <Text style={styles.errorText}>
              {errors.aceptaTerminos.message}
            </Text>
          ) : null}

          {firebaseError ? (
            <Text style={[styles.errorText, styles.firebaseError]}>
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
              {submitting ? "Creando cuenta…" : "Continuar"}
            </Text>
          </TouchableOpacity>
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
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  backLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginBottom: 16,
    alignSelf: "flex-start",
  },
  backLinkText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.brand,
    fontFamily: fonts.bodySemiBold,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 4,
    fontFamily: fonts.displayBold,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 20,
    fontFamily: fonts.bodyRegular,
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
  helperText: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 6,
    fontFamily: fonts.bodyRegular,
  },
  errorText: {
    fontSize: 12.5,
    color: colors.error,
    marginTop: 6,
    fontFamily: fonts.bodyRegular,
  },
  firebaseError: {
    textAlign: "center",
    marginBottom: 8,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 4,
    marginBottom: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.brandBarTint,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: colors.brand,
    borderWidth: 0,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textPrimary,
    fontFamily: fonts.bodyRegular,
  },
  submitButton: {
    backgroundColor: colors.brand,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
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
