# Instrucciones para Claude — Cuentas Claras

## Contexto obligatorio

Antes de planificar, desarrollar, depurar o revisar código, leer completamente [`PROJECT_CONTEXT.md`](./PROJECT_CONTEXT.md).

Tratar ese archivo como fuente de verdad para alcance, arquitectura, modelo Firestore, seguridad, privacidad y funcionalidades excluidas. No copiar todo su contenido aquí ni mantener definiciones duplicadas.

## Forma de trabajo

1. Inspeccionar primero el código, `package.json`, configuración de Expo/Firebase y archivos relacionados con la tarea.
2. Separar explícitamente:
   - lo que exige el alcance;
   - lo que actualmente hace el código;
   - lo que se propone mejorar.
3. No implementar mejoras no solicitadas. Si una mejora cambia dependencias, arquitectura, navegación, autenticación, persistencia o alcance, proponerla con impacto y esperar aprobación.
4. Hacer cambios mínimos, coherentes y reversibles.
5. No inventar requisitos, archivos, endpoints, variables, colecciones ni campos.
6. No usar comandos destructivos ni modificar Firebase remoto sin autorización explícita.
7. No colocar secretos en el cliente, `EXPO_PUBLIC_*`, código fuente o logs.
8. Mantener la aplicación orientada a iOS y Android; la web no es un canal de usuario final.
9. Verificar compatibilidad real con la versión instalada de Expo y React Native antes de recomendar una librería.
10. Ejecutar las comprobaciones relevantes y comunicar exactamente cuáles pasaron, fallaron o no pudieron ejecutarse.

## Skills relevantes

Cuando estén instaladas y la tarea corresponda, utilizar las skills oficiales o especializadas de:

- Expo y development builds.
- React Native y rendimiento.
- Firebase Authentication.
- Cloud Firestore.
- Auditoría de Firebase Security Rules.
- Google Sign-In específico de la librería elegida.

Las skills orientan el procedimiento, pero no reemplazan la inspección del repositorio ni autorizan ampliar el alcance.

## Autenticación

- No elegir un flujo OAuth únicamente porque funciona en Expo Go.
- Diferenciar Google ID token, access token y Firebase ID token.
- No pedir scopes de Google que el producto no necesita.
- No guardar tokens manualmente cuando Firebase ya administra la sesión.
- Informar cuándo una librería exige development build o configuración nativa.
- No migrar el flujo de autenticación sin aprobación.

## Revisiones

Al revisar código, priorizar seguridad, integridad de datos, cálculos, autenticación, compatibilidad móvil y desviaciones del alcance. Entregar hallazgos concretos con severidad, archivo, ubicación, escenario, impacto y corrección.

Evitar comentarios puramente estilísticos si no afectan funcionamiento, mantenibilidad, accesibilidad o cumplimiento del proyecto.

## Documentación académica

Si una implementación contradice la tesis —por ejemplo React Navigation frente a Expo Router— señalar la discrepancia. No corregir automáticamente el código ni el documento sin que la usuaria elija cuál representa la decisión vigente.

# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.

## Project scope

- This is a mobile-only Expo application targeting Android and iOS.
- Web support is explicitly out of scope.
- Do not report issues that affect only `expo web` or `npm run web`.

# Esto es lo que hará el agente y tu debes hacer code review sobre eso

# RF01 — Login funcionando (checklist paso a paso)

Objetivo único de este archivo: dejar el login (email + Google), el documento `Usuarios` y el consentimiento funcionando de punta a punta. Nada de movimientos, balance ni simuladores todavía.

---

## Ya está resuelto (no pedir de nuevo)

- [x] Google Sign-In configurado (Web Client ID en Firebase Console + `.env`)
- [x] Firebase Auth + Firestore validados técnicamente en dispositivo físico
- [x] Logo final (`logo-cuentas-claras-recortado.png`)
- [x] Layout de Bienvenida y de Registro ya diseñados

---

## Bloque 0 — Setup base (persistencia + utilidades de error) — retirada la persistencia

- [x] `utils/authErrors.ts` con `getAuthErrorMessage(code)`
- [x] ~~Persistencia con `@react-native-async-storage/async-storage`~~ — **retirada (2026-08-14)**: `initializeAuth` + `getReactNativePersistence` causaba errores recurrentes de Metro/`@firebase/auth` no resueltos de forma estable en dispositivo. Se volvió a `getAuth(app)` simple. La sesión no sobrevive a cerrar la app por completo — aceptado. Ver PROJECT_CONTEXT.md.
- **Revisar:** ya no aplica el punto de persistencia entre reinicios.

## Bloque 1 — Pantalla Bienvenida — ✅ hecho

- Referencia visual: `.claude/Login Layout/layout-login-vista-princiapl.png` + kit `.claude/Cuentas Claras Design System-3`
- [x] `app/index.tsx`: logo, botón "Continuar con Google" (visual, ver Bloque 5), link "Continuar con E-mail" (sin acción, ver Bloque 3), footer
- [x] Logo recortado (`assets/images/logo-cuentas-claras.png`, fondo transparente)
- **Revisar:** aprobado — layout coincide con el kit de diseño.

## Bloque 2 — Registro por email

- Referencia visual: `.claude/Login Layout/Formulario_de_registro.png`
- [ ] Formulario: nombre, apellido, email, contraseña (mínimo 8 caracteres, ajustar validación), fecha de nacimiento (selectores día/mes/año), sueldo mensual (opcional, placeholder "$0")
- [ ] Usar `react-hook-form` + `zod` para el schema de validación en vez de `useState` por campo — con 6 campos + selectores de fecha reduce re-renders y centraliza las reglas de validación
- [ ] Checkbox obligatorio: "He leído y acepto los Términos y Condiciones y la Política de Privacidad, conforme a la Ley N°19.628" — el botón "Continuar" queda deshabilitado hasta marcarlo
- [ ] Validaciones (en el schema de zod, antes de tocar la red): campos obligatorios (excepto sueldo mensual), formato de correo, contraseña ≥ 8 caracteres (Firebase por defecto solo exige 6, así que este mínimo hay que validarlo en cliente), fecha no futura
- [ ] Al enviar: crea el usuario en Firebase Auth **y** llama `crearUsuarioSiNoExiste()` con `consentimientoAceptado: true` y `fechaConsentimiento` directamente (el checkbox ya capturó el consentimiento, no hace falta pantalla aparte para este flujo). Si falla `crearUsuarioSiNoExiste()` (ej. sin red) no reintentar ahí mismo — el próximo login ya vuelve a llamarlo por ser idempotente (Bloque 6)
- [ ] Errores de Firebase (ej. `auth/email-already-in-use`) mostrarse vía `getAuthErrorMessage()` (Bloque 0)
- **Revisar:** el usuario queda creado en Firebase Auth y en Firestore con el consentimiento ya marcado, errores de validación y de Firebase se muestran bien y en español.

## Bloque 3 — Login por email

- Referencia visual: `.claude/Login Layout/Layout_login_con_emal.png`
- [ ] Formulario: correo + contraseña
- [ ] Link "¿Olvidaste tu contraseña?" y "¿No tienes cuenta? Regístrate"
- [ ] Manejo de error si las credenciales son incorrectas, vía `getAuthErrorMessage()` (Bloque 0)
- **Revisar:** puedes iniciar sesión con el usuario creado en el Bloque 2, cerrar y reabrir la app mantiene la sesión (persistencia del Bloque 0).

## Bloque 4 — Recuperar contraseña

- Referencia visual: `.claude/Login Layout/recuperar_contraseña.png`
- [ ] Pantalla con un campo correo → `sendPasswordResetEmail`
- [ ] Mensaje de confirmación tras enviar; error de correo no registrado vía `getAuthErrorMessage()` (Bloque 0)
- **Revisar:** llega el correo de reseteo.

## Bloque 5 — Google Sign-In — **PAUSADO**

**Decisión (2026-08-14):** por PROJECT_CONTEXT.md ("preferir SDKs del proveedor... antes que OAuth implícito", "no forzar una implementación insegura únicamente para conservar Expo Go"), se usa `@react-native-google-signin/google-signin` en vez de `expo-auth-session`. Esto significa dejar Expo Go para probar este flujo — hace falta un development build.

Se pausó el bloque porque el bloqueo de infraestructura (bundle identifiers, apps iOS/Android en Firebase Console, dev build) frenaba el resto del checklist. El botón "Continuar con Google" queda solo visual (sin `onPress`, sin importar `hooks/useGoogleAuth`) hasta retomarlo explícitamente.

- [x] `hooks/useGoogleAuth.ts` ya escrito con `GoogleSignin.configure()` / `signIn()` del SDK oficial — no está importado en ningún lado todavía (importarlo rompe Expo Go)
- [ ] Botón "Continuar con Google" — visual únicamente por ahora
- [ ] **Pendiente de tu lado antes de retomar:** definir `ios.bundleIdentifier`/`android.package` en `app.json`, registrar apps iOS/Android en Firebase Console, descargar `GoogleService-Info.plist`/`google-services.json`, generar development build
- **Revisar:** puedes iniciar sesión con una cuenta Google real en el development build y llegas autenticado.

## Bloque 6 — Documento `Usuarios` en Firestore

- [ ] Crear `services/usuarios.ts` con:
  - `crearUsuarioSiNoExiste(uid, datos)` — idempotente, inicializa:
    ```
    nombre, apellido, correo, fechaNacimiento,
    fechaRegistro: serverTimestamp(),
    sueldoMensual: <valor ingresado o null>, diaPago: null, repiteSueldo: false,
    consentimientoAceptado: <true si viene del registro por email, false si viene de Google>,
    fechaConsentimiento: <serverTimestamp() si aplica, si no null>
    ```
  - `necesitaConsentimiento(uid)` — true si `consentimientoAceptado` es false o no existe
  - `aceptarConsentimiento(uid)` — marca `consentimientoAceptado: true` + `fechaConsentimiento`
- [ ] Enganchar `crearUsuarioSiNoExiste()` después de cualquier login/registro exitoso (email y Google), pasando el sueldo mensual y el consentimiento cuando corresponda (registro por email)
- **Revisar:** en Firestore aparece el documento `Usuarios/{uid}` con los campos correctos, y no se duplica si vuelves a iniciar sesión.

## Bloque 7 — Pantalla Consentimiento (solo flujo Google)

- [ ] Pantalla bloqueante con el texto de tratamiento de datos (Ley N°19.628), solo botón "Aceptar y continuar"
- [ ] Se muestra automáticamente si `necesitaConsentimiento()` es true — **esto solo puede pasar con usuarios que entraron por Google**, ya que el registro por email captura el consentimiento en el mismo formulario (Bloque 2)
- [ ] Al aceptar, llama `aceptarConsentimiento()` y navega a Home (placeholder está bien por ahora)
- **Revisar:** un usuario nuevo por Google pasa por consentimiento una sola vez; en logins siguientes no vuelve a aparecer. Un usuario que se registró por email nunca ve esta pantalla, porque ya aceptó en el formulario.

## Bloque 8 — Reglas de seguridad Firestore

- [ ] Publicar regla base:
  ```
  match /Usuarios/{userId} {
    allow read: if request.auth != null && request.auth.uid == userId;
    allow create: if request.auth != null && request.auth.uid == userId;
    allow update: if request.auth != null && request.auth.uid == userId
      && !request.resource.data.diff(resource.data).affectedKeys()
           .hasAny(['fechaRegistro', 'consentimientoAceptado', 'fechaConsentimiento']);
  }
  ```
- [ ] Estos tres campos solo deben poder cambiar vía `aceptarConsentimiento()`, que corre con el mismo `request.auth.uid` del dueño — si se quiere blindar aún más (que ni el propio dueño los pise desde un `update` directo), habría que moverlos a una Cloud Function con Admin SDK; para el alcance de RF01 la regla de arriba es suficiente
- **Revisar:** un usuario no puede leer/escribir el documento de otro (probar con dos cuentas); un `update` directo desde el cliente que intente tocar `consentimientoAceptado` sin pasar por `aceptarConsentimiento()` es rechazado.

## Bloque 9 — Pruebas mínimas

- [ ] Unitaria: `crearUsuarioSiNoExiste()` no sobrescribe si ya existe
- [ ] Unitaria: `necesitaConsentimiento()` responde bien en ambos casos
- [ ] Integración: registro por email → documento creado → Consentimiento → Aceptar → Home

---
