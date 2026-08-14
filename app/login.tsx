import { zodResolver } from "@hookform/resolvers/zod";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
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

import { brandColors as colors } from "@/constants/brand-colors";
import { brandFonts as fonts } from "@/constants/brand-fonts";
import { auth } from "@/firebaseConfig";
import { crearUsuarioSiNoExiste } from "@/services/usuarios";
import { getAuthErrorMessage } from "@/utils/authErrors";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Ingresa tu correo")
    .pipe(z.email("Correo inválido")),
  password: z.string().min(1, "Ingresa tu contraseña"),
});

type LoginForm = z.infer<typeof loginSchema>;

// Pantalla de Login por email (RF01 Bloque 3) — llegan acá desde
// "Continuar con E-mail" de la Bienvenida. "¿Olvidaste tu contraseña?"
// queda sin acción todavía (Bloque 4, no construido).
export default function LoginScreen() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [firebaseError, setFirebaseError] = useState("");

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const email = watch("email");
  const password = watch("password");
  const canSubmit = !!email && !!password;

  const onSubmit = async (data: LoginForm) => {
    setFirebaseError("");
    setSubmitting(true);
    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        data.email.trim(),
        data.password,
      );

      try {
        await crearUsuarioSiNoExiste(credential.user.uid, {
          nombre: "",
          apellido: "",
          correo: credential.user.email ?? data.email.trim(),
          fechaNacimiento: "",
          sueldoMensual: null,
          consentimientoAceptado: false,
        });
      } catch {
        // Idempotente — si falla, se reintenta en el próximo login.
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

          <Text style={styles.title}>Ingresa con tu e-mail</Text>

          <View style={styles.field}>
            <Controller
              control={control}
              name="email"
              render={({ field: { value, onChange, onBlur } }) => (
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  placeholder="Correo electrónico"
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
            <Controller
              control={control}
              name="password"
              render={({ field: { value, onChange, onBlur } }) => (
                <TextInput
                  style={styles.input}
                  placeholder="Contraseña"
                  placeholderTextColor={colors.textTertiary}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureTextEntry
                />
              )}
            />
          </View>

          <Text style={styles.forgotPasswordLink}>
            ¿Olvidaste tu contraseña?
          </Text>

          {firebaseError ? (
            <Text style={[styles.errorText, styles.firebaseError]}>
              {firebaseError}
            </Text>
          ) : null}

          <TouchableOpacity
            style={[
              styles.submitButton,
              (!canSubmit || submitting) && styles.submitButtonDisabled,
            ]}
            activeOpacity={0.85}
            onPress={handleSubmit(onSubmit)}
            disabled={!canSubmit || submitting}
          >
            <Text style={styles.submitButtonText}>
              {submitting ? "Ingresando…" : "Continuar"}
            </Text>
          </TouchableOpacity>

          <View style={styles.registerRow}>
            <Text style={styles.registerText}>¿No tienes cuenta? </Text>
            <TouchableOpacity
              onPress={() => router.push("/registro")}
              activeOpacity={0.7}
            >
              <Text style={styles.registerLink}>Regístrate</Text>
            </TouchableOpacity>
          </View>
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
  },
  backLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginBottom: 28,
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
    marginBottom: 20,
    fontFamily: fonts.displayBold,
  },
  field: {
    marginBottom: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.card,
    fontFamily: fonts.bodyRegular,
  },
  inputError: {
    borderColor: colors.error,
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
  forgotPasswordLink: {
    alignSelf: "flex-end",
    fontSize: 13,
    fontWeight: "600",
    color: colors.brand,
    marginBottom: 8,
    fontFamily: fonts.bodySemiBold,
  },
  submitButton: {
    backgroundColor: colors.brand,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: colors.brandBarTint,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    fontFamily: fonts.bodySemiBold,
  },
  registerRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  registerText: {
    fontSize: 13.5,
    color: colors.textSecondary,
    fontFamily: fonts.bodyRegular,
  },
  registerLink: {
    fontSize: 13.5,
    fontWeight: "600",
    color: colors.brand,
    fontFamily: fonts.bodySemiBold,
  },
});
