import {
    Fredoka_600SemiBold,
    Fredoka_700Bold,
} from "@expo-google-fonts/fredoka";
import {
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
} from "@expo-google-fonts/inter";
import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";

import { brandColors } from "@/constants/brand-colors";

SplashScreen.preventAutoHideAsync();

// brandColors es una paleta fija que no depende del modo de color del
// sistema (ver constants/brand-colors.ts) — el tema de navegación no
// puede alternar entre Dark/DefaultTheme como en el scaffold original,
// porque el fondo casi negro de DarkTheme se filtra detrás de las
// esquinas redondeadas de la tab bar cuando el teléfono está en modo
// oscuro. Se fuerza siempre un tema claro con los colores de la marca.
const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: brandColors.background,
    card: brandColors.card,
    primary: brandColors.brand,
    border: brandColors.border,
    text: brandColors.textPrimary,
  },
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Fredoka_600SemiBold,
    Fredoka_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider value={navigationTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="registro" options={{ headerShown: false }} />
        <Stack.Screen
          name="recuperar-contrasena"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="movimiento-nuevo"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="movimiento-detalle"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="gasto-previsible-detalle"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
