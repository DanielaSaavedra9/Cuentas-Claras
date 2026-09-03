import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { brandColors as colors } from "@/constants/brand-colors";
import { brandFonts as fonts } from "@/constants/brand-fonts";

// Menú de navegación (.claude/menu-navegacion-checklist.md): tab bar real
// con las 4 secciones del kit de diseño (ver navigation.card.html y
// TabBar en ui_kits/mobile-app/index.html) — fondo brand, ícono activo en
// accent/dorado, inactivo blanco translúcido.
const ACTIVO = colors.accent;
const INACTIVO = "rgba(255,255,255,0.55)";
const DESHABILITADO = "rgba(255,255,255,0.35)";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVO,
        tabBarInactiveTintColor: INACTIVO,
        tabBarStyle: {
          backgroundColor: colors.brand,
          borderTopWidth: 0,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          fontFamily: fonts.bodySemiBold,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="movimientos-lista"
        options={{
          title: "Movimientos",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "list" : "list-outline"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="simulador-credito"
        options={{
          title: "Simuladores",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "calculator" : "calculator-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="aprender"
        listeners={{
          // Bloque 2: visible pero sin pantalla de destino — no navega.
          tabPress: (e) => e.preventDefault(),
        }}
        options={{
          title: "Próximamente",
          tabBarActiveTintColor: DESHABILITADO,
          tabBarInactiveTintColor: DESHABILITADO,
          tabBarIcon: () => (
            <Ionicons name="book-outline" size={22} color={DESHABILITADO} />
          ),
        }}
      />
    </Tabs>
  );
}
