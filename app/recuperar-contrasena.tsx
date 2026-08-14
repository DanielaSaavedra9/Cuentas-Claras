import { zodResolver } from "@hookform/resolvers/zod";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { sendPasswordResetEmail } from "firebase/auth";
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
import { getAuthErrorMessage } from "@/utils/authErrors";

export const resetSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Ingresa tu correo")
    .pipe(z.email("Correo inválido")),
});

type ResetForm = z.infer<typeof resetSchema>;

// Pantalla de recuperación de contraseña (RF01 Bloque 4) — llegan acá
// desde "¿Olvidaste tu contraseña?" en el Login.
export default function RecuperarContrasenaScreen() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [firebaseError, setFirebaseError] = useState("");
  const [enviado, setEnviado] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
    defaultValues: { email: "" },
  });

  const email = watch("email");
  const canSubmit = !!email;

  const onSubmit = async (data: ResetForm) => {
    setFirebaseError("");
    setSubmitting(true);
    try {
      await sendPasswordResetEmail(auth, data.email.trim());
      setEnviado(true);
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

          <Text style={styles.title}>Recuperar contraseña</Text>
          <Text style={styles.subtitle}>
            Ingresa tu correo y te enviaremos un enlace para restablecer tu
            contraseña.
          </Text>

          {enviado ? (
            <Text style={styles.successText}>
              Te enviamos un enlace a tu correo. Revisa tu bandeja de entrada
              (y la carpeta de spam) para restablecer tu contraseña.
            </Text>
          ) : (
            <>
              <View style={styles.field}>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { value, onChange, onBlur } }) => (
                    <TextInput
                      style={[
                        styles.input,
                        errors.email && styles.inputError,
                      ]}
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
                  {submitting ? "Enviando…" : "Enviar enlace"}
                </Text>
              </TouchableOpacity>
            </>
          )}
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
    marginBottom: 8,
    fontFamily: fonts.displayBold,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
    fontFamily: fonts.bodyRegular,
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
  successText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontFamily: fonts.bodyRegular,
    lineHeight: 20,
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
});
