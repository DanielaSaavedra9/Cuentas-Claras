# Menú de usuario — cerrar sesión, editar perfil, darse de baja (evidencia)

Fecha: 2026-09-06
Checklist: `.claude/dropdown-cerrar-sesion.md`
Comando: ver `evidencia/menu-usuario-tests-output.txt` (`npm test`) / `evidencia/menu-usuario-tests-coverage.txt` (`npx jest --coverage --collectCoverageFrom='services/usuarios.ts'`)

## Qué se implementó

### 1. Bottom sheet de opciones — `components/user-menu-sheet.tsx`
Reproduce el mockup `SettingsSheet` del kit "Cuentas Claras Design System-5": overlay `rgba(26,26,46,0.4)`, hoja blanca con esquinas superiores 24px, handle de arrastre, fila de perfil (avatar 44px + nombre/apellido + correo), separadores `brandTint` de 1px, y 3 acciones — "Editar mis datos" (brand), "Cerrar sesión" (error), "Cancelar" (textSecondary). Se cierra al tocar el overlay, "Cancelar", o cualquiera de las otras dos opciones.

Wireado en las 5 pantallas con header (Home, Movimientos, los 2 simuladores, Aprender) — se agregó `Pressable` alrededor del avatar existente en cada una, estado local `menuAbierto`/`apellido`, y `cerrarSesion()` (`signOut(auth)` + `router.replace("/login")`, sin nada que limpiar de `AsyncStorage` — no se usa).

### 2. Pantalla "Editar mis datos" — `app/editar-perfil.tsx`
Precarga nombre, apellido, fecha de nacimiento y sueldo mensual desde `obtenerPerfilUsuario()` (función nueva en `services/usuarios.ts`, separada de `obtenerUsuario()` para no cambiar el contrato de una función ya usada en 5 pantallas). El correo se muestra de solo lectura (decisión de la usuaria) — no hay campo editable para él. Guardar llama a `actualizarUsuario()` (nueva) y vuelve atrás.

### 3. "Darse de baja" — eliminación completa de la cuenta
Al final de "Editar mis datos", un enlace en rojo abre un modal de confirmación (mismo patrón que `movimiento-detalle.tsx`/RF04: backdrop + card, botón neutro/destructivo) que pide la contraseña actual. Al confirmar, `eliminarCuentaCompleta()` (nueva en `services/usuarios.ts`):

1. Reautentica con `reauthenticateWithCredential` (requerido por Firebase para poder llamar `deleteUser()` con una sesión no reciente)
2. Borra todos los documentos de `Usuarios/{uid}/movimientos` y `Usuarios/{uid}/escenariosGuardados`, en tandas de `writeBatch` (máx. 500 por lote)
3. Borra el documento `Usuarios/{uid}`
4. Borra el usuario de Firebase Auth (`deleteUser`)
5. Redirige a `/` (Bienvenida) sin sesión

Si la contraseña es incorrecta, `reauthenticateWithCredential` rechaza antes de tocar cualquier dato — no hay borrado parcial en ese caso. Solo aplica a cuentas de email/contraseña (Google Sign-In sigue diferido, RF01).

### Hallazgo durante la implementación — regla de Firestore faltante
`firestore.rules` no tenía **ninguna** regla `allow delete` para `Usuarios/{userId}` (solo `read`/`create`/`update`) — sin esto, `deleteDoc(refUsuario(uid))` habría sido rechazado por las reglas de seguridad en producción, aunque el código y las pruebas (con Firestore mockeado) no lo detectan. Se agregó:
```
allow delete: if request.auth != null && request.auth.uid == userId;
```
**Este archivo requiere que la usuaria lo despliegue** (`firebase deploy --only firestore:rules`) — no se modificó Firebase remoto desde acá.

## Resultado
- Total de suites: 17 (sin suites nuevas — los tests se agregaron a `services/__tests__/usuarios.test.ts` ya existente)
- Total de tests: 164 (154 previos + 10 nuevos: 3 `obtenerUsuario`/`obtenerPerfilUsuario`, 2 `actualizarUsuario`, 3 `eliminarCuentaCompleta`, y 2 ajustes al mock de `registro.integration.test.ts` por el nuevo import de `firebase/auth` en `services/usuarios.ts`)
- Pasaron: 164, fallaron: 0
- Cobertura de `services/usuarios.ts`: 100% statements/functions/lines, 94.44% branch (única rama sin cubrir: línea 76, el caso `consentimientoAceptado: false` de `crearUsuarioSiNoExiste`, código preexistente de RF01, no tocado en este trabajo)
- `tsc --noEmit` limpio · `eslint` 0 errores en los 9 archivos nuevos/tocados (7 warnings preexistentes sin cambios, ninguno nuevo)

## Unitario nuevo (`services/__tests__/usuarios.test.ts`)
- `obtenerUsuario` / `obtenerPerfilUsuario` — devuelven los datos cuando el documento existe, `null` cuando no
- `actualizarUsuario` — actualiza los 4 campos editables; `sueldoMensual` ausente se normaliza a `null`
- `eliminarCuentaCompleta` — reautentica → borra ambas subcolecciones → borra el documento → borra el usuario de Auth, verificando el **orden exacto**; con contraseña incorrecta no borra nada; sin sesión de email/contraseña activa rechaza antes de reautenticar

## Fuera de alcance a propósito
- No se testeó el render de `UserMenuSheet`, `editar-perfil.tsx` ni la integración del `Pressable` en las 5 pantallas — mismo criterio que todo el proyecto (RF01-RF08, fix RF05): solo se automatiza lógica de servicios y funciones puras, no render de componentes.
- No se implementó reautenticación con Google para la baja de cuenta — Google Sign-In sigue diferido (RF01); si se retoma, `eliminarCuentaCompleta` necesita una rama para `reauthenticateWithPopup`/credential de Google.
- No se creó pantalla de recuperación/reactivación de cuenta dada de baja — explícitamente fuera de alcance en el documento de definición.

## Verificación en dispositivo (2026-09-07) — "Darse de baja"

Se creó una cuenta real de prueba (Juan Perez), con un gasto marcado como previsible y un escenario de crédito guardado, confirmados en Firestore antes de la prueba. Tras ejecutar "Darse de baja" con la contraseña correcta:

- `Usuarios/{uid}` ya no existe (`firestore_get_document` → "not found")
- `movimientos` y `escenariosGuardados` quedaron vacías (sin documentos huérfanos)
- La cuenta ya no existe en Firebase Auth (`auth_get_users` por correo → `[]`)

**Eliminación completa verificada de punta a punta contra datos reales.**

### Efecto secundario encontrado y corregido: `permission-denied` en consola

Durante esa prueba apareció un `FirebaseError: permission-denied` en la consola — no afectó el borrado (ya confirmado completo arriba), pero quedaba como error sin capturar. Causa: `escucharMovimientosDelMes()` (`services/movimientos.ts`) es el único listener en tiempo real del proyecto (usado por Home) y no tenía manejador de error en su `onSnapshot`. Al eliminar la cuenta, Firebase Auth invalida la sesión del cliente antes de que React alcance a desmontar Home y cancelar el listener, así que llega un último evento del servidor ya sin permisos — mismo caso esperado al cerrar sesión con Home montado. Se agregó un manejador de error vacío (con comentario explicando por qué no se propaga ni reintenta) para que deje de aparecer en consola. No requirió cambios de rules ni de datos — es puramente de manejo de errores del listener.

### Reglas de Firestore — desplegadas por la usuaria en la consola

El deploy vía la herramienta MCP de Firebase reportaba éxito pero no se reflejaba en la base con nombre `cuentas-claras-db` (esta base no se llama `(default)`, y la herramienta de lectura de reglas solo lee la instancia por defecto — no se investigó si el deploy en sí también estaba afectado por esa misma limitación). La usuaria publicó el archivo completo directamente en la consola de Firebase, lo que sí quedó confirmado por la prueba de eliminación real.

## Pendiente de la usuaria
- Verificar el resto de la interacción en dispositivo: bottom sheet en las 5 pantallas, "Editar mis datos" guardando cambios reales, "Cerrar sesión", y "Darse de baja" con contraseña incorrecta (debe mostrar error sin borrar nada).
