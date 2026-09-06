/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  // Chore SDK 57: `ColorSchemeName` ahora incluye 'unspecified' (estado de
  // tema no definido de Android) además de 'light' | 'dark' | null |
  // undefined — el `?? 'light'` de antes dejaba pasar 'unspecified' y
  // rompía el índice de {light, dark}. Cualquier valor que no sea 'dark'
  // cae a 'light'.
  const theme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}
