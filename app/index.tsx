import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GoogleLogo } from "@/components/google-logo";
import { brandColors as colors } from "@/constants/brand-colors";
import { brandFonts as fonts } from "@/constants/brand-fonts";

// Pantalla de Bienvenida (RF01 Bloque 1) — layout replicado desde el kit
// de diseño (.claude/Cuentas Claras Design System-3/ui_kits/mobile-app/
// index.html, componente LoginScreen, modo "options"): logo y botones van
// en el MISMO bloque centrado (flex: 1 + gap), no en bloques separados.
//
// "Continuar con Google" sin acción todavía. Google Sign-In está pausado
// (ver PROJECT_CONTEXT.md): requiere un development build que aún no
// existe, así que NO se importa hooks/useGoogleAuth aquí — importarlo
// rompe Expo Go porque @react-native-google-signin/google-signin no tiene
// módulo nativo ahí. El hook queda listo para reconectar cuando se retome
// ese bloque.
//
// "Continuar con E-mail" lleva al login (Bloque 3); el registro se
// alcanza desde ahí vía "¿No tienes cuenta? Regístrate".
export default function BienvenidaScreen() {
  const router = useRouter();
  return (
    <LinearGradient
      colors={["#FFFFFF", "#F1EEFE", "#E4DEFC"]}
      locations={[0, 0.55, 1]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.content}>
          <View style={styles.centerGroup}>
            <Image
              source={require("../assets/images/logo-cuentas-claras.png")}
              style={styles.logo}
              resizeMode="contain"
            />

            <View style={styles.actionsBlock}>
              <TouchableOpacity style={styles.googleButton} activeOpacity={0.85}>
                <GoogleLogo size={18} />
                <Text style={styles.googleButtonText}>Continuar con Google</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => router.push("/login")}
              >
                <Text style={styles.emailLink}>Continuar con E-mail</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              © 2026 Cuentas Claras. Todos los derechos reservados.
            </Text>
            <Text style={styles.footerText}>
              Privacidad | Términos de Servicio | Contacto
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 16,
  },
  centerGroup: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: 44,
  },
  logo: {
    width: 180,
    height: 80,
  },
  actionsBlock: {
    width: "100%",
    maxWidth: 280,
    alignItems: "stretch",
    gap: 12,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.textPrimary,
    fontFamily: fonts.bodyMedium,
  },
  emailLink: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.brand,
    textAlign: "center",
    paddingVertical: 10,
    fontFamily: fonts.bodySemiBold,
  },
  footer: {
    alignItems: "center",
    gap: 2,
  },
  footerText: {
    fontSize: 11,
    lineHeight: 17,
    color: colors.textTertiary,
    textAlign: "center",
    fontFamily: fonts.bodyRegular,
  },
});
