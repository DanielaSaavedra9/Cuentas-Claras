import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { brandColors as colors } from "@/constants/brand-colors";
import { brandFonts as fonts } from "@/constants/brand-fonts";
import { emitirTabPress } from "@/hooks/use-scroll-to-top-on-tab-press";

// Menú de navegación (.claude/menu-navegacion-checklist.md): tab bar real
// con las 4 secciones del kit de diseño (ver navigation.card.html y
// TabBar en ui_kits/mobile-app/index.html) — fondo brand, ícono activo en
// accent/dorado, inactivo blanco translúcido.
const ACTIVO = colors.accent;
const INACTIVO = "rgba(255,255,255,0.55)";

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
        listeners={{ tabPress: () => emitirTabPress("index") }}
        options={{
          title: "Inicio",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="movimientos-lista"
        listeners={{ tabPress: () => emitirTabPress("movimientos-lista") }}
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
      {/* RF08: se llega por el segmentado dentro de "Simuladores", no por
          un tab propio — href:null lo mantiene fuera de la tab bar. */}
      <Tabs.Screen name="simulador-ahorro" options={{ href: null }} />
      {/* RF06: glosario educativo — el tab se activó al cerrar el
          simulador de ahorro; antes estaba deshabilitado (tabPress
          bloqueado, label "Próximamente"). */}
      <Tabs.Screen
        name="aprender"
        options={{
          title: "Aprender",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "book" : "book-outline"} size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
