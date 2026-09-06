# Chore — Upgrade Expo SDK 54 → 57 (evidencia)

Fecha: 2026-09-05
Checklist: `.claude/chore-upgrade-expo-sdk-57.md` (skill `expo-upgrade`)
Comando: ver `evidencia/chore-upgrade-sdk57-output.txt` (`expo-doctor`, `tsc --noEmit`, `npm test`, `npm run lint`)

## Versiones finales

| Paquete | 54 → 57 |
|---|---|
| `expo` | `~54.0.35` → `^57.0.20` |
| `react` / `react-dom` | `19.1.0` → `19.2.3` |
| `react-native` | `0.81.5` → `0.86.3` |
| `react-native-reanimated` | `~4.1.1` → `4.5.1` |
| `react-native-worklets` | `0.5.1` → `0.10.1` |
| `typescript` | `~5.9.2` → `~6.0.3` |
| `jest-expo` | `^54.0.17` → `~57.0.5` |
| `eslint-config-expo` | `~10.0.0` → `~57.0.2` |

Se usó `expo@latest` (resolvió a `57.0.20`) en vez de `expo@^57.0.0` como decía el checklist original, para no depender del rango y quedar explícitamente por sobre `57.0.9` (regresión de memoria de Hermes V1 con reanimated/worklets en versiones anteriores).

## Lo que el checklist anticipaba y salió como esperado
- `npx expo install --fix` alineó 26 paquetes nativos a SDK 57 sin intervención manual.
- `npx expo-doctor`: **21/21 checks** al cerrar (1 falló en el camino, ver abajo).
- No había carpetas `ios`/`android` (proyecto CNG puro) — el paso de borrarlas no aplicaba.
- Link de documentación versionada en `AGENTS.md` actualizado de `v54.0.0` a `v57.0.0`.

## Problemas encontrados durante el upgrade (no estaban en el checklist original)

1. **`app.json` con 2 campos que SDK 57 ya no acepta** (detectado por `expo-doctor`): `newArchEnabled` (New Architecture es el único modo, el campo se eliminó del schema) y `android.edgeToEdgeEnabled` (edge-to-edge pasó a ser obligatorio, no configurable). Se quitaron ambos.

2. **`tsc --noEmit` con ~500 líneas de error**, dos causas distintas:
   - **TypeScript 6.0.3 dejó de auto-incluir los paquetes de `node_modules/@types`** cuando `compilerOptions.types` no está declarado — sin esto, `describe`/`it`/`expect`/`jest` desaparecían de los 17 archivos de test (aunque `@types/jest` seguía instalado). Se agregó `"types": ["jest", "node"]` a `tsconfig.json` (`react` no hace falta ahí, se resuelve solo vía el import automático de `react/jsx-runtime`).
   - **Dos cambios de tipos reales de RN 0.86 / expo-symbols 57**, ambos en código del scaffold original (no de ningún RF): `ColorSchemeName` ahora incluye `'unspecified'` (rompía `hooks/use-theme-color.ts` y `components/parallax-scroll-view.tsx`, que indexaban `{light, dark}` directo con el resultado de `useColorScheme()`); y `SymbolViewProps['name']` de `expo-symbols` pasó a aceptar también un objeto `{ios, android, web}` además del string plano, rompiendo su uso como key de un `Record` en `components/ui/icon-symbol.tsx` — se cambió a usar el tipo `SFSymbol` (símbolo iOS plano) que `expo-symbols` re-exporta para este caso.

3. **`npm test`: los 17 suites fallaban** con `Cannot find module 'expo-modules-core'`. La causa fue una colocación subóptima en el árbol de `node_modules` (quedó anidado en `node_modules/expo/node_modules/expo-modules-core` en vez de en la raíz) heredada del `package-lock.json` tras la secuencia de instalaciones del upgrade — se confirmó regenerando el lockfile desde cero (`rm -rf node_modules package-lock.json && npm install`), que sí lo deja en la raíz sin necesidad de declararlo como dependencia directa (`expo-doctor` de hecho lo marca como error si se declara explícito).

4. **3 suites fallaban aparte** con `SyntaxError: Cannot use import statement outside a module`, por `node_modules/expo-router/node_modules/standard-navigation` — dependencia anidada nueva de `expo-router` en SDK 57, paquete ESM que Jest no transformaba por defecto. Se agregó `standard-navigation` al allow-list de `transformIgnorePatterns` en `jest.config.js`.

5. **`npm run lint`: 1 error nuevo** — `react-hooks/set-state-in-effect` en `app/gasto-previsible-detalle.tsx:82` (RF05), regla nueva que trae `eslint-config-expo@57`: el efecto llamaba `setNoEncontrado`/`setCargando` de forma síncrona en la rama `if (!uid || !id)`. Se envolvió la llamada en un microtask (`Promise.resolve().then(cargarMovimiento)`) y se memoizó `cargarMovimiento` con `useCallback` para poder declararla en las dependencias del efecto — mismo comportamiento, sin tocar la lógica de carga.

6. **Bloqueaba abrir la app en Expo Go (encontrado en dispositivo, después de que los checks de arriba ya estaban en verde):** Metro tiraba `expo-router is no longer compatible with react-navigation` — desde SDK 56, `expo-router` no acepta imports directos de `@react-navigation/*` en código de la app. Dos archivos los tenían: `app/_layout.tsx` (`DefaultTheme`/`ThemeProvider`, el que efectivamente disparaba el error porque se carga siempre) y `components/haptic-tab.tsx` (`BottomTabBarButtonProps`/`PlatformPressable`, scaffold **sin usar** — no wireado a ningún tab bar real). Fix:
   - `app/_layout.tsx`: import movido a `expo-router/react-navigation` (verificado contra `node_modules/expo-router/build/react-navigation/index.d.ts` — re-exporta `./native` + `./elements`, trae `DefaultTheme`/`ThemeProvider`).
   - `components/haptic-tab.tsx`: **eliminado**. Su tipo `BottomTabBarButtonProps` no tenía reemplazo directo (`expo-router/js-tabs` solo exporta el layout `Tabs`, no es un barrel de `@react-navigation/bottom-tabs`), y al no estar en uso no tenía sentido forzar un import roto.
   - `package.json`: quitados `@react-navigation/bottom-tabs`, `@react-navigation/elements`, `@react-navigation/native` — ya no quedaba ningún import directo. Tras reinstalar, `@react-navigation` desapareció por completo de `node_modules` (SDK 57 dejó de traerlo también como dependencia transitiva de `expo-router`).
   - Verificado con `npx expo export -p ios`, que ejercita el mismo chequeo de Metro que rompía en el dispositivo — exportó sin errores.

## Resultado final
- `npx expo-doctor`: **21/21 checks**, sin errores
- `npx tsc --noEmit`: sin errores
- `npm test`: **17 suites / 154 tests**, 0 fallos
- `npm run lint`: **0 errores**, 7 warnings (3 preexistentes `import/first` en tests de esquema + 4 nuevos `react-hooks/incompatible-library` — informativos: React Compiler no puede memoizar componentes que usan `watch()` de `react-hook-form`, no es un error ni cambia el comportamiento; no se tocó, es un patrón usado en 4 pantallas y migrarlo fuera de `watch()` sería un cambio de alcance mayor a este chore)
- `npx expo export -p ios`: exporta sin errores (confirma que el chequeo de `expo-router`/`react-navigation` de Metro ya no bloquea)

## Pendiente de la usuaria
- Abrir la app en Expo Go (SDK 57) en el iPhone físico y confirmar que ya no aparece ningún error (ni el de incompatibilidad de SDK, ni el de `expo-router`/`react-navigation`).
- Confirmar que el tema de navegación fijo (fix del fondo negro en modo oscuro, comentado en `app/_layout.tsx`) se ve igual tras mover el import.
- Probar rápidamente Home, Movimientos, Simuladores (crédito y ahorro) y Aprender para descartar regresiones visuales/de navegación.
- Este upgrade **no resuelve** el pendiente de Google Sign-In (RF01) — sigue igual de diferido, requiere development build sin importar el SDK.
