import { useRouter } from "expo-router";
import { useState } from "react";
import {
    Image,
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

import { createUserWithEmailAndPassword } from "firebase/auth";

import { brandColors as colors } from "@/constants/brand-colors";
import { brandFonts as fonts } from "@/constants/brand-fonts";
import { auth } from "../../firebaseConfig";

export default function HomeScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");

  const handleRegister = async () => {
    setAuthMessage("");
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setAuthMessage("Usuario registrado correctamente.");
      router.push("/dashboard");
    } catch (error: any) {
      setAuthMessage(`Error al registrar: ${error.message}`);
    }
  };

  const isAuthError = authMessage.startsWith("Error");

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
          <View style={styles.brand}>
            <Image
              source={require("../../assets/images/logo-cuentas-claras.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.title}>Bienvenido</Text>
          <Text style={styles.subtitle}>
            Crea tu cuenta para comenzar a usar Cuentas Claras
          </Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Registro de usuario</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="hola@correo.com"
                placeholderTextColor={colors.textTertiary}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Contraseña</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={colors.textTertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleRegister}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>Registrarme</Text>
            </TouchableOpacity>

            {authMessage ? (
              <View
                style={[
                  styles.alert,
                  isAuthError ? styles.alertError : styles.alertSuccess,
                ]}
              >
                <Text
                  style={[
                    styles.alertText,
                    isAuthError ? styles.alertTextError : styles.alertTextSuccess,
                  ]}
                >
                  {authMessage}
                </Text>
              </View>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: "center",
  },
  brand: {
    alignItems: "center",
    marginBottom: 16,
  },
  logo: {
    width: 180,
    height: 80,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
    marginTop: 16,
    fontFamily: fonts.displayBold,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 24,
    fontFamily: fonts.bodyRegular,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: colors.textPrimary,
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 16,
    fontFamily: fonts.displayBold,
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
  primaryButton: {
    backgroundColor: colors.brand,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    fontFamily: fonts.bodySemiBold,
  },
  alert: {
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  alertSuccess: {
    backgroundColor: colors.successTint,
  },
  alertError: {
    backgroundColor: colors.errorTint,
  },
  alertText: {
    fontSize: 13,
    fontFamily: fonts.bodyRegular,
  },
  alertTextSuccess: {
    color: colors.success,
  },
  alertTextError: {
    color: colors.error,
  },
});
