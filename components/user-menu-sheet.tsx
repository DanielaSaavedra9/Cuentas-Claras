import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { brandColors as colors } from "@/constants/brand-colors";
import { brandFonts as fonts } from "@/constants/brand-fonts";

// Menú de usuario (.claude/dropdown-cerrar-sesion.md, Bloque 1): bottom
// sheet que se abre al tocar el avatar en las 5 pantallas con header
// (Home, Movimientos, los 2 simuladores, Aprender). Reproduce el mockup
// `SettingsSheet` del kit "Cuentas Claras Design System-5" — overlay
// oscuro + hoja blanca con esquinas superiores redondeadas, handle de
// arrastre, fila de perfil, y 3 acciones separadas por líneas finas.
export function UserMenuSheet({
  visible,
  onClose,
  nombre,
  apellido,
  correo,
  onEditarPerfil,
  onCerrarSesion,
}: {
  visible: boolean;
  onClose: () => void;
  nombre: string;
  apellido: string;
  correo: string;
  onEditarPerfil: () => void;
  onCerrarSesion: () => void;
}) {
  const nombreCompleto = [nombre, apellido].filter(Boolean).join(" ");

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />

          <View style={styles.perfilRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {nombre ? nombre.charAt(0).toUpperCase() : "?"}
              </Text>
            </View>
            <View style={styles.flex1}>
              <Text style={styles.nombre} numberOfLines={1}>
                {nombreCompleto || "Sin nombre"}
              </Text>
              <Text style={styles.correo} numberOfLines={1}>
                {correo || "Sin correo registrado"}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />
          <Pressable
            onPress={() => {
              onClose();
              onEditarPerfil();
            }}
            style={styles.opcion}
          >
            <Text style={styles.opcionEditar}>Editar mis datos</Text>
          </Pressable>

          <View style={styles.divider} />
          <Pressable
            onPress={() => {
              onClose();
              onCerrarSesion();
            }}
            style={styles.opcion}
          >
            <Text style={styles.opcionCerrarSesion}>Cerrar sesión</Text>
          </Pressable>

          <View style={styles.divider} />
          <Pressable onPress={onClose} style={styles.opcion}>
            <Text style={styles.opcionCancelar}>Cancelar</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(26,26,46,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: 16,
  },
  perfilRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingBottom: 16,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: fonts.displaySemiBold,
  },
  nombre: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
    fontFamily: fonts.displaySemiBold,
  },
  correo: {
    fontSize: 12.5,
    color: colors.textSecondary,
    fontFamily: fonts.bodyRegular,
  },
  divider: {
    height: 1,
    backgroundColor: colors.brandTint,
  },
  opcion: {
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  opcionEditar: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.brand,
    fontFamily: fonts.bodySemiBold,
  },
  opcionCerrarSesion: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.error,
    fontFamily: fonts.bodySemiBold,
  },
  opcionCancelar: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.textSecondary,
    fontFamily: fonts.bodyMedium,
  },
});
