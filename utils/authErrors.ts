const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "auth/email-already-in-use": "Ese correo ya está registrado. Intenta iniciar sesión.",
  "auth/invalid-email": "El correo ingresado no es válido.",
  "auth/invalid-credential": "Correo o contraseña incorrectos.",
  "auth/wrong-password": "Correo o contraseña incorrectos.",
  "auth/user-not-found": "No existe una cuenta con ese correo.",
  "auth/weak-password": "La contraseña es muy débil. Usa al menos 8 caracteres.",
  "auth/too-many-requests": "Demasiados intentos. Espera un momento antes de volver a intentar.",
  "auth/network-request-failed": "Sin conexión. Revisa tu internet e intenta de nuevo.",
  "auth/user-disabled": "Esta cuenta fue deshabilitada. Contacta a soporte.",
};

const DEFAULT_MESSAGE = "Ocurrió un error inesperado. Intenta de nuevo.";

// Firebase entrega el código como "auth/xxx" en `error.code`; en algunos
// casos (ej. errores de red) el código puede venir vacío o distinto.
export function getAuthErrorMessage(code: string | undefined): string {
  if (!code) return DEFAULT_MESSAGE;
  return AUTH_ERROR_MESSAGES[code] ?? DEFAULT_MESSAGE;
}
