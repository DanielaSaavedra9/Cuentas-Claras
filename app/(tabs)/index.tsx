import { useEffect, useState } from "react";
import { Button, StyleSheet, TextInput } from "react-native";

// --- Autenticación (Firebase Auth) ---
import { createUserWithEmailAndPassword } from "firebase/auth";
// --- Firestore ---
import { addDoc, collection, onSnapshot } from "firebase/firestore";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { auth, db } from "../../firebaseConfig";

export default function HomeScreen() {
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

  const textColor = useThemeColor({}, "text");
  const placeholderColor = useThemeColor({ light: "#687076", dark: "#9BA1A6" }, "icon");

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Prueba técnica: Firebase</ThemedText>

      {/* --- Autenticación --- */}
      <ThemedView style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Registro de usuario</ThemedText>
        <TextInput
          style={[styles.input, { color: textColor }]}
          placeholder="Correo electrónico"
          placeholderTextColor={placeholderColor}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={[styles.input, { color: textColor }]}
          placeholder="Contraseña"
          placeholderTextColor={placeholderColor}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <Button title="Registrarme" onPress={handleRegister} />
        {authMessage ? <ThemedText style={styles.message}>{authMessage}</ThemedText> : null}
      </ThemedView>

      {/* --- Firestore --- */}
      <ThemedView style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Firestore en tiempo real</ThemedText>
        <ThemedText style={styles.counter}>
          Documentos en "testItems": {itemCount}
        </ThemedText>
        <Button title="Agregar documento" onPress={handleAddItem} />
        {firestoreMessage ? (
          <ThemedText style={styles.message}>{firestoreMessage}</ThemedText>
        ) : null}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  counter: {
    fontSize: 16,
    marginBottom: 12,
  },
  message: {
    marginTop: 12,
  },
});
