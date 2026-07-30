import { useEffect, useState } from "react";
import {
    Dimensions,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
// --- Prueba técnica: gráfico dinámico (Chart Kit, validación técnica 3.8.2.3) ---
import { BarChart } from "react-native-chart-kit";

// --- Firestore ---
import { collection, onSnapshot } from "firebase/firestore";

import { brandColors as colors } from "@/constants/brand-colors";
import { brandFonts as fonts } from "@/constants/brand-fonts";
import { db } from "../firebaseConfig";

// react-native-svg (usado por Chart Kit) renderiza con CoreText/Skia
// directamente y NO reconoce el alias "System" que usa el <Text> de React
// Native — si no encuentra la familia, cae de forma silenciosa a "Times".
// Hay que pasar un nombre de fuente real registrado en el SO.
const chartLabelFontFamily = Platform.select({
  ios: "Fredoka_700Bold",
  android: "sans-serif",
  default: "Fredoka_700Bold",
});

// Ancho del gráfico ajustado al ancho de pantalla, descontando el padding
// del scroll (24px) y de la card (20px) a cada lado.
const screenWidth = Dimensions.get("window").width;
const chartWidth = screenWidth - 2 * 24 - 2 * 20;

// Datos de ejemplo de "gastos mensuales" (CLP). El último monto suma
// `itemCount` (multiplicado para que el cambio sea visible en la escala del
// gráfico) para demostrar que se redibuja con datos en tiempo real desde
// Firestore, no con datos estáticos.
const monthlyExpensesLabels = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul"];
const monthlyExpensesBase = [
  120000, 210000, 260000, 190000, 230000, 140000, 205000,
];
const highlightedIndex = monthlyExpensesBase.length - 1;

export default function DashboardScreen() {
  // --- Firestore: estado del contador de documentos en tiempo real ---
  const [itemCount, setItemCount] = useState(0);

  // --- Firestore: listener en tiempo real sobre la colección "testItems" ---
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "testItems"), (snapshot) => {
      setItemCount(snapshot.size);
    });

    return unsubscribe;
  }, []);

  const monthlyExpensesData = monthlyExpensesBase.map((amount, index) =>
    index === highlightedIndex ? amount + itemCount * 10000 : amount,
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Gastos</Text>
        <Text style={styles.subtitle}>
          El último mes suma el contador en tiempo real de &quot;testItems&quot;
          ({itemCount}) para probar el redibujo dinámico
        </Text>

        {/* --- Prueba técnica: gráfico dinámico (Chart Kit, 3.8.2.3) --- */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Gastos</Text>
            <View style={styles.monthPill}>
              <Text style={styles.monthPillText}>Julio</Text>
            </View>
          </View>

          <BarChart
            data={{
              labels: monthlyExpensesLabels,
              datasets: [
                {
                  data: monthlyExpensesData,
                  colors: monthlyExpensesData.map(
                    (_, index) =>
                      (opacity = 1) =>
                        index === highlightedIndex
                          ? `rgba(59, 42, 217, ${opacity})`
                          : `rgba(220, 212, 251, ${opacity})`,
                  ),
                },
              ],
            }}
            width={chartWidth}
            height={200}
            fromZero
            withCustomBarColorFromData
            flatColor
            withInnerLines={false}
            showValuesOnTopOfBars={false}
            yAxisLabel="$"
            yAxisSuffix=""
            chartConfig={{
              backgroundColor: colors.card,
              backgroundGradientFrom: colors.card,
              backgroundGradientTo: colors.card,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(59, 42, 217, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(26, 26, 46, ${opacity})`,
              barPercentage: 0.6,
              propsForLabels: {
                fontFamily: chartLabelFontFamily,
                fontSize: 12,
              },
              propsForBackgroundLines: {
                stroke: "transparent",
              },
            }}
            style={styles.chart}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 4,
    fontFamily: fonts.displayBold,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 20,
    fontFamily: fonts.bodyRegular,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
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
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    fontFamily: fonts.displayBold,
  },
  monthPill: {
    backgroundColor: colors.brandTint,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  monthPillText: {
    color: colors.brand,
    fontSize: 13,
    fontWeight: "600",
    fontFamily: fonts.bodySemiBold,
  },
  chart: {
    borderRadius: 12,
    paddingRight: 24,
  },
});
