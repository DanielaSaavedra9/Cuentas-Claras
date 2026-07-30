import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
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

// --- Autenticación (Firebase Auth) ---
import { createUserWithEmailAndPassword } from "firebase/auth";
// --- Firestore ---
import { addDoc, collection, onSnapshot } from "firebase/firestore";

import { brandColors as colors } from "@/constants/brand-colors";
import { brandFonts as fonts } from "@/constants/brand-fonts";
import { auth, db } from "../../firebaseConfig";

export default function HomeScreen() {
  const router = useRouter();

  // --- Autenticación: estado del formulario de registro ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");

  // --- Firestore: estado del contador de documentos en tiempo real ---
  const [itemCount, setItemCount] = useState(0);
  const [firestoreMessage, setFirestoreMessage] = useState("");

  // --- Firestore: listener en tiempo real sobre la colección "testItems" ---
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "testItems"),
      (snapshot) => {
        setItemCount(snapshot.size);
      },
      (error) => {
        setFirestoreMessage(`Error al escuchar Firestore: ${error.message}`);
      },
    );

    return unsubscribe;
  }, []);

  // --- Autenticación: registro de usuario con correo y contraseña ---
  const handleRegister = async () => {
    setAuthMessage("");
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setAuthMessage("Usuario registrado correctamente.");
      // Tras el login/registro, la sección de gráficos vive en una pantalla
      // aparte (ver app/dashboard.tsx).
      router.push("/dashboard");
    } catch (error: any) {
      setAuthMessage(`Error al registrar: ${error.message}`);
    }
  };

  // --- Firestore: agregar un documento a la colección "testItems" ---
  const handleAddItem = async () => {
    setFirestoreMessage("");
    try {
      await addDoc(collection(db, "testItems"), {
        createdAt: new Date().toISOString(),
      });
    } catch (error: any) {
      setFirestoreMessage(`Error al escribir en Firestore: ${error.message}`);
    }
  };

  const isAuthError = authMessage.startsWith("Error");
  const isFirestoreError = firestoreMessage.startsWith("Error");

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
          {/* --- Marca --- */}
          <View style={styles.brand}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoCheck}>✓</Text>
            </View>
            <Text style={styles.wordmark}>
              <Text style={styles.wordmarkIndigo}>cuentas</Text>
              {"\n"}
              <Text style={styles.wordmarkGold}>claras</Text>
            </Text>
          </View>

          <Text style={styles.title}>Prueba técnica: Firebase</Text>
          <Text style={styles.subtitle}>
            Crea tu cuenta para comenzar a usar Cuentas Claras
          </Text>

          {/* --- Autenticación --- */}
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

            <TouchableOpacity
              style={styles.demoButton}
              onPress={() => router.push("/dashboard")}
              activeOpacity={0.85}
            >
              <Text style={styles.demoButtonText}>Ir a Dashboard (Demo)</Text>
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
                    isAuthError
                      ? styles.alertTextError
                      : styles.alertTextSuccess,
                  ]}
                >
                  {authMessage}
                </Text>
              </View>
            ) : null}
          </View>

          {/* --- Firestore --- */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Firestore en tiempo real</Text>
              <View style={styles.counterPill}>
                <Text style={styles.counterPillText}>{itemCount}</Text>
              </View>
            </View>
            <Text style={styles.counterLabel}>
              Documentos en &quot;testItems&quot;
            </Text>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleAddItem}
              activeOpacity={0.85}
            >
              <Text style={styles.secondaryButtonText}>Agregar documento</Text>
            </TouchableOpacity>

            {firestoreMessage ? (
              <View
                style={[
                  styles.alert,
                  isFirestoreError ? styles.alertError : styles.alertSuccess,
                ]}
              >
                <Text
                  style={[
                    styles.alertText,
                    isFirestoreError
                      ? styles.alertTextError
                      : styles.alertTextSuccess,
                  ]}
                >
                  {firestoreMessage}
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
  logoBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  logoCheck: {
    color: colors.accent,
    fontSize: 22,
    fontWeight: "700",
    fontFamily: fonts.displayBold,
  },
  wordmark: {
    textAlign: "center",
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 24,
    fontFamily: fonts.displayBold,
  },
  wordmarkIndigo: {
    color: colors.brand,
  },
  wordmarkGold: {
    color: colors.accent,
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
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  demoButton: {
    backgroundColor: colors.brandTint,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  demoButtonText: {
    color: colors.brand,
    fontSize: 13,
    fontWeight: "600",
    fontFamily: fonts.bodySemiBold,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.brand,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: colors.brand,
    fontSize: 15,
    fontWeight: "600",
    fontFamily: fonts.bodySemiBold,
  },
  counterPill: {
    backgroundColor: colors.brandTint,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  counterPillText: {
    color: colors.brand,
    fontSize: 13,
    fontWeight: "700",
    fontFamily: fonts.displayBold,
  },
  counterLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 16,
    fontFamily: fonts.bodyRegular,
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
