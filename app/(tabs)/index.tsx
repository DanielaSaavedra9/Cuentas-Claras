import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { brandColors as colors } from "@/constants/brand-colors";
import { brandFonts as fonts } from "@/constants/brand-fonts";

// Placeholder del área autenticada (Home). Se reemplaza cuando se
// implemente RF03 (balance mensual). El botón de abajo es un acceso
// temporal a RF02 mientras no existe Home real.
export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.content}>
        <Text style={styles.title}>Home</Text>
        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.85}
          onPress={() => router.push("/movimiento-nuevo")}
        >
          <Text style={styles.buttonText}>+ Nuevo movimiento</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.buttonSecondary}
          activeOpacity={0.85}
          onPress={() => router.push("/movimientos-lista")}
        >
          <Text style={styles.buttonSecondaryText}>Ver mis movimientos</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
    fontFamily: fonts.displayBold,
    marginBottom: 20,
  },
  button: {
    backgroundColor: colors.brand,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    fontFamily: fonts.bodySemiBold,
  },
  buttonSecondary: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  buttonSecondaryText: {
    color: colors.brand,
    fontSize: 14,
    fontWeight: "600",
    fontFamily: fonts.bodySemiBold,
  },
});
