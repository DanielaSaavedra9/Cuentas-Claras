import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { brandColors as colors } from "@/constants/brand-colors";
import { brandFonts as fonts } from "@/constants/brand-fonts";

export type SelectOption = {
  label: string;
  value: string;
};

type SelectFieldProps = {
  placeholder: string;
  value: string | undefined;
  options: SelectOption[];
  onChange: (value: string) => void;
  hasError?: boolean;
};

// Selector tipo dropdown (RN no tiene <select> nativo) — usado para
// Día/Mes/Año de fecha de nacimiento (RF01 Bloque 2). Modal con lista en
// vez de @react-native-picker/picker para no sumar una dependencia nativa
// nueva solo por esto.
export function SelectField({
  placeholder,
  value,
  options,
  onChange,
  hasError,
}: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <>
      <Pressable
        style={[styles.field, hasError && styles.fieldError]}
        onPress={() => setOpen(true)}
      >
        <Text style={selected ? styles.valueText : styles.placeholderText}>
          {selected ? selected.label : placeholder}
        </Text>
        <Ionicons name="chevron-expand" size={16} color={colors.textTertiary} />
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <SafeAreaView style={styles.sheet} edges={["bottom"]}>
          <Text style={styles.sheetTitle}>{placeholder}</Text>
          <FlatList
            data={options}
            keyExtractor={(item) => item.value}
            style={styles.list}
            renderItem={({ item }) => (
              <Pressable
                style={styles.option}
                onPress={() => {
                  onChange(item.value);
                  setOpen(false);
                }}
              >
                <Text
                  style={
                    item.value === value
                      ? styles.optionTextSelected
                      : styles.optionText
                  }
                >
                  {item.label}
                </Text>
              </Pressable>
            )}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.card,
  },
  fieldError: {
    borderColor: colors.error,
  },
  placeholderText: {
    fontSize: 15,
    color: colors.textTertiary,
    fontFamily: fonts.bodyRegular,
  },
  valueText: {
    fontSize: 15,
    color: colors.textPrimary,
    fontFamily: fonts.bodyRegular,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(26,26,46,0.4)",
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "60%",
    paddingTop: 12,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: 8,
    fontFamily: fonts.displayBold,
  },
  list: {
    paddingHorizontal: 20,
  },
  option: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionText: {
    fontSize: 15,
    color: colors.textPrimary,
    fontFamily: fonts.bodyRegular,
  },
  optionTextSelected: {
    fontSize: 15,
    color: colors.brand,
    fontFamily: fonts.bodySemiBold,
  },
});
