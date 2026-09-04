import { Ionicons } from "@expo/vector-icons";
import { Controller, useWatch, UseFormReturn } from "react-hook-form";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { z } from "zod";

import { SelectField } from "@/components/select-field";
import { TooltipInfo } from "@/components/tooltip-info";
import { brandColors as colors } from "@/constants/brand-colors";
import { brandFonts as fonts } from "@/constants/brand-fonts";
import { CategoriaMovimiento } from "@/services/movimientos";

export const CATEGORIAS: { value: CategoriaMovimiento; label: string }[] = [
  { value: "ahorro", label: "Ahorro" },
  { value: "cuentas", label: "Cuentas" },
  { value: "comida", label: "Comida" },
  { value: "transporte", label: "Transporte" },
  { value: "salud", label: "Salud" },
  { value: "otros", label: "Otros" },
];

export const CATEGORIA_ICONS: Record<
  CategoriaMovimiento,
  keyof typeof Ionicons.glyphMap
> = {
  ahorro: "wallet-outline",
  cuentas: "receipt-outline",
  comida: "fast-food-outline",
  transporte: "car-outline",
  salud: "medkit-outline",
  otros: "grid-outline",
};

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const DIAS = Array.from({ length: 31 }, (_, i) => String(i + 1));
const anioActual = new Date().getFullYear();
const ANIOS = Array.from({ length: 6 }, (_, i) => String(anioActual - i));
const ANIOS_FUTUROS = Array.from({ length: 6 }, (_, i) => String(anioActual + i));

export const movimientoSchema = z
  .object({
    tipo: z.enum(["ingreso", "gasto"]),
    monto: z
      .string()
      .trim()
      .min(1, "Ingresa el monto")
      .refine(
        (v) => !Number.isNaN(Number(v)) && Number(v) > 0,
        "El monto debe ser mayor a 0",
      ),
    descripcion: z.string().trim().min(1, "Ingresa una descripción"),
    categoria: z.string().min(1, "Selecciona una categoría"),
    dia: z.string().min(1, "Requerido"),
    mes: z.string().min(1, "Requerido"),
    anio: z.string().min(1, "Requerido"),
    compartido: z.boolean(),
    numeroPersonas: z.string(),
    esPrevisible: z.boolean(),
    diaLimite: z.string(),
    mesLimite: z.string(),
    anioLimite: z.string(),
  })
  .superRefine((data, ctx) => {
    const dia = Number(data.dia);
    const mes = Number(data.mes);
    const anio = Number(data.anio);
    if (dia && mes && anio) {
      const fecha = new Date(anio, mes - 1, dia);
      const esFechaValida =
        fecha.getFullYear() === anio &&
        fecha.getMonth() === mes - 1 &&
        fecha.getDate() === dia;
      if (!esFechaValida) {
        ctx.addIssue({ code: "custom", path: ["dia"], message: "Fecha inválida" });
      }
    }

    if (data.tipo !== "gasto") return;

    if (data.compartido) {
      const personas = Number(data.numeroPersonas);
      if (!personas || personas < 2) {
        ctx.addIssue({
          code: "custom",
          path: ["numeroPersonas"],
          message: "Mínimo 2 personas",
        });
      }
    }

    if (data.esPrevisible) {
      const diaL = Number(data.diaLimite);
      const mesL = Number(data.mesLimite);
      const anioL = Number(data.anioLimite);
      if (!diaL || !mesL || !anioL) {
        ctx.addIssue({
          code: "custom",
          path: ["diaLimite"],
          message: "Requerido",
        });
        return;
      }
      const fechaLimite = new Date(anioL, mesL - 1, diaL);
      const esFechaLimiteValida =
        fechaLimite.getFullYear() === anioL &&
        fechaLimite.getMonth() === mesL - 1 &&
        fechaLimite.getDate() === diaL;
      if (!esFechaLimiteValida) {
        ctx.addIssue({
          code: "custom",
          path: ["diaLimite"],
          message: "Fecha inválida",
        });
        return;
      }
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      if (fechaLimite <= hoy) {
        ctx.addIssue({
          code: "custom",
          path: ["diaLimite"],
          message: "La fecha debe ser posterior a hoy",
        });
      }
    }
  });

export type MovimientoFormValues = z.infer<typeof movimientoSchema>;

export function pad2(value: string) {
  return value.padStart(2, "0");
}

export function valoresPorDefecto(hoy: Date): MovimientoFormValues {
  return {
    tipo: "gasto",
    monto: "",
    descripcion: "",
    categoria: "",
    dia: String(hoy.getDate()),
    mes: String(hoy.getMonth() + 1),
    anio: String(hoy.getFullYear()),
    compartido: false,
    numeroPersonas: "2",
    esPrevisible: false,
    diaLimite: "",
    mesLimite: "",
    anioLimite: "",
  };
}

function Switch({ value, onChange }: { value: boolean; onChange: () => void }) {
  return (
    <Pressable
      style={[styles.switchTrack, value && styles.switchTrackActive]}
      onPress={onChange}
    >
      <View style={[styles.switchThumb, value && styles.switchThumbActive]} />
    </Pressable>
  );
}

export function MovimientoFormFields({
  form,
}: {
  form: UseFormReturn<MovimientoFormValues>;
}) {
  const {
    control,
    setValue,
    formState: { errors },
  } = form;

  // `watch()` sólo dispara un re-render del componente donde se llamó
  // useForm() — acá `control` llega por props desde otro componente, así
  // que hay que usar useWatch() para que este componente se re-renderice
  // cuando cambien estos campos (si no, los toggles cambian el valor por
  // dentro pero la UI se queda pegada en el estado anterior).
  const tipo = useWatch({ control, name: "tipo" });
  const compartido = useWatch({ control, name: "compartido" });
  const esPrevisible = useWatch({ control, name: "esPrevisible" });
  const numeroPersonas = useWatch({ control, name: "numeroPersonas" });
  const montoColor = tipo === "ingreso" ? colors.success : colors.error;

  return (
    <>
      <View style={styles.segmented}>
        <TouchableOpacity
          style={[
            styles.segmentedOption,
            tipo === "ingreso" && styles.segmentedOptionActive,
          ]}
          activeOpacity={0.85}
          onPress={() => setValue("tipo", "ingreso")}
        >
          <Text
            style={[
              styles.segmentedText,
              tipo === "ingreso" && styles.segmentedTextActive,
            ]}
          >
            Ingreso
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.segmentedOption,
            tipo === "gasto" && styles.segmentedOptionActive,
          ]}
          activeOpacity={0.85}
          onPress={() => setValue("tipo", "gasto")}
        >
          <Text
            style={[
              styles.segmentedText,
              tipo === "gasto" && styles.segmentedTextActive,
            ]}
          >
            Gasto
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.montoRow}>
        <Text style={[styles.montoSign, { color: montoColor }]}>$</Text>
        <Controller
          control={control}
          name="monto"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextInput
              style={[styles.montoInput, { color: montoColor }]}
              placeholder="0"
              placeholderTextColor={colors.textTertiary}
              value={value}
              onChangeText={(text) => onChange(text.replace(/[^0-9]/g, ""))}
              onBlur={onBlur}
              keyboardType="numeric"
              selectionColor={montoColor}
              cursorColor={montoColor}
            />
          )}
        />
      </View>
      {errors.monto ? (
        <Text style={[styles.errorText, styles.montoError]}>
          {errors.monto.message}
        </Text>
      ) : null}

      <View style={styles.field}>
        <Text style={styles.label}>Descripción</Text>
        <Controller
          control={control}
          name="descripcion"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextInput
              style={[styles.input, errors.descripcion && styles.inputError]}
              placeholder="Ej: Almuerzo"
              placeholderTextColor={colors.textTertiary}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
            />
          )}
        />
        {errors.descripcion ? (
          <Text style={styles.errorText}>{errors.descripcion.message}</Text>
        ) : null}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Categoría</Text>
        <Controller
          control={control}
          name="categoria"
          render={({ field: { value, onChange } }) => (
            <View style={styles.categoriaGrid}>
              {CATEGORIAS.map((c) => {
                const esSueldo = c.value === "cuentas" && tipo === "ingreso";
                const icon = esSueldo ? "cash-outline" : CATEGORIA_ICONS[c.value];
                const label = esSueldo ? "Sueldo" : c.label;
                const selected = value === c.value;
                return (
                  <TouchableOpacity
                    key={c.value}
                    style={[
                      styles.categoriaButton,
                      selected && styles.categoriaButtonActive,
                    ]}
                    activeOpacity={0.85}
                    onPress={() => onChange(c.value)}
                  >
                    <Ionicons
                      name={icon}
                      size={20}
                      color={selected ? colors.brand : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.categoriaLabel,
                        selected && styles.categoriaLabelActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        />
        {errors.categoria ? (
          <Text style={styles.errorText}>{errors.categoria.message}</Text>
        ) : null}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Fecha</Text>
        <View style={styles.dateRow}>
          <View style={styles.dateCol}>
            <Controller
              control={control}
              name="dia"
              render={({ field: { value, onChange } }) => (
                <SelectField
                  placeholder="Día"
                  value={value}
                  onChange={onChange}
                  hasError={!!errors.dia}
                  options={DIAS.map((d) => ({ label: d, value: d }))}
                />
              )}
            />
          </View>
          <View style={styles.dateColWide}>
            <Controller
              control={control}
              name="mes"
              render={({ field: { value, onChange } }) => (
                <SelectField
                  placeholder="Mes"
                  value={value}
                  onChange={onChange}
                  hasError={!!errors.mes}
                  options={MESES.map((label, index) => ({
                    label,
                    value: String(index + 1),
                  }))}
                />
              )}
            />
          </View>
          <View style={styles.dateCol}>
            <Controller
              control={control}
              name="anio"
              render={({ field: { value, onChange } }) => (
                <SelectField
                  placeholder="Año"
                  value={value}
                  onChange={onChange}
                  hasError={!!errors.anio}
                  options={ANIOS.map((a) => ({ label: a, value: a }))}
                />
              )}
            />
          </View>
        </View>
        {errors.dia ? (
          <Text style={styles.errorText}>{errors.dia.message}</Text>
        ) : null}
      </View>

      {tipo === "gasto" ? (
        <>
          <View style={styles.toggleRow}>
            <View style={styles.toggleLabelRow}>
              <Text style={styles.toggleLabel}>Es un gasto previsible</Text>
              <TooltipInfo terminoId="gastoPrevisible" />
            </View>
            <Controller
              control={control}
              name="esPrevisible"
              render={({ field: { value, onChange } }) => (
                <Switch
                  value={value}
                  onChange={() => {
                    const activando = !value;
                    onChange(activando);
                    // Fecha propuesta editable: un mes desde hoy, solo si
                    // el usuario todavía no eligió ninguna fecha.
                    if (activando && !form.getValues("diaLimite")) {
                      const propuesta = new Date();
                      propuesta.setMonth(propuesta.getMonth() + 1);
                      setValue("diaLimite", String(propuesta.getDate()));
                      setValue("mesLimite", String(propuesta.getMonth() + 1));
                      setValue("anioLimite", String(propuesta.getFullYear()));
                    }
                  }}
                />
              )}
            />
          </View>

          {esPrevisible ? (
            <View style={styles.expandBox}>
              <Text style={styles.label}>Fecha en que debe pagarse</Text>
              <View style={styles.dateRow}>
                <View style={styles.dateCol}>
                  <Controller
                    control={control}
                    name="diaLimite"
                    render={({ field: { value, onChange } }) => (
                      <SelectField
                        placeholder="Día"
                        value={value}
                        onChange={onChange}
                        hasError={!!errors.diaLimite}
                        options={DIAS.map((d) => ({ label: d, value: d }))}
                      />
                    )}
                  />
                </View>
                <View style={styles.dateColWide}>
                  <Controller
                    control={control}
                    name="mesLimite"
                    render={({ field: { value, onChange } }) => (
                      <SelectField
                        placeholder="Mes"
                        value={value}
                        onChange={onChange}
                        hasError={!!errors.mesLimite}
                        options={MESES.map((label, index) => ({
                          label,
                          value: String(index + 1),
                        }))}
                      />
                    )}
                  />
                </View>
                <View style={styles.dateCol}>
                  <Controller
                    control={control}
                    name="anioLimite"
                    render={({ field: { value, onChange } }) => (
                      <SelectField
                        placeholder="Año"
                        value={value}
                        onChange={onChange}
                        hasError={!!errors.anioLimite}
                        options={ANIOS_FUTUROS.map((a) => ({ label: a, value: a }))}
                      />
                    )}
                  />
                </View>
              </View>
              {errors.diaLimite ? (
                <Text style={styles.errorText}>{errors.diaLimite.message}</Text>
              ) : null}
            </View>
          ) : null}

          <View style={styles.toggleRow}>
            <View style={styles.toggleLabelRow}>
              <Text style={styles.toggleLabel}>Gasto compartido</Text>
              <TooltipInfo terminoId="gastoCompartido" />
            </View>
            <Controller
              control={control}
              name="compartido"
              render={({ field: { value, onChange } }) => (
                <Switch value={value} onChange={() => onChange(!value)} />
              )}
            />
          </View>

          {compartido ? (
            <View style={styles.stepperRow}>
              <Text style={styles.stepperLabel}>Número de personas</Text>
              <View style={styles.stepperControls}>
                <TouchableOpacity
                  style={styles.stepperButton}
                  activeOpacity={0.7}
                  onPress={() =>
                    setValue(
                      "numeroPersonas",
                      String(Math.max(2, Number(numeroPersonas || 2) - 1)),
                    )
                  }
                >
                  <Text style={styles.stepperButtonText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.stepperValue}>{numeroPersonas}</Text>
                <TouchableOpacity
                  style={styles.stepperButton}
                  activeOpacity={0.7}
                  onPress={() =>
                    setValue("numeroPersonas", String(Number(numeroPersonas || 2) + 1))
                  }
                >
                  <Text style={styles.stepperButtonText}>+</Text>
                </TouchableOpacity>
              </View>
              {errors.numeroPersonas ? (
                <Text style={styles.errorText}>{errors.numeroPersonas.message}</Text>
              ) : null}
            </View>
          ) : null}
        </>
      ) : null}
    </>
  );
}

export const styles = StyleSheet.create({
  segmented: {
    flexDirection: "row",
    backgroundColor: colors.brandTint,
    borderRadius: 10,
    padding: 3,
  },
  segmentedOption: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 8,
  },
  segmentedOptionActive: {
    backgroundColor: colors.card,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  segmentedText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    fontFamily: fonts.bodySemiBold,
  },
  segmentedTextActive: {
    color: colors.brand,
  },
  montoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 12,
  },
  montoSign: {
    fontSize: 40,
    fontWeight: "600",
    fontFamily: fonts.displayBold,
  },
  montoInput: {
    fontSize: 40,
    fontWeight: "600",
    fontFamily: fonts.displayBold,
    width: 140,
    textAlign: "left",
    padding: 0,
  },
  montoError: {
    textAlign: "center",
    marginTop: -8,
    marginBottom: 8,
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
    borderWidth: 0,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.background,
    fontFamily: fonts.bodyRegular,
  },
  inputError: {
    backgroundColor: colors.errorTint,
  },
  categoriaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  categoriaButton: {
    width: "31%",
    alignItems: "center",
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "transparent",
    backgroundColor: colors.background,
  },
  categoriaButtonActive: {
    borderColor: colors.brand,
    backgroundColor: colors.brandTint,
  },
  categoriaLabel: {
    fontSize: 11,
    color: colors.textPrimary,
    fontFamily: fonts.bodyRegular,
  },
  categoriaLabelActive: {
    color: colors.brand,
    fontFamily: fonts.bodySemiBold,
  },
  dateRow: {
    flexDirection: "row",
    gap: 8,
  },
  dateCol: {
    flex: 1,
  },
  dateColWide: {
    flex: 1.4,
  },
  errorText: {
    fontSize: 12.5,
    color: colors.error,
    marginTop: 6,
    fontFamily: fonts.bodyRegular,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  toggleLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textPrimary,
    fontFamily: fonts.bodyRegular,
  },
  switchTrack: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.border,
    justifyContent: "center",
  },
  switchTrackActive: {
    backgroundColor: colors.brand,
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.card,
    marginLeft: 3,
  },
  switchThumbActive: {
    marginLeft: 21,
  },
  expandBox: {
    backgroundColor: "#FFF8E8",
    borderWidth: 1,
    borderColor: "#FDE4A6",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  stepperLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: fonts.bodyRegular,
  },
  stepperControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  stepperButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  stepperButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  stepperValue: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
    fontFamily: fonts.bodySemiBold,
  },
});
