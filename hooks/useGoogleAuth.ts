import { useCallback, useState } from "react";
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";

import { auth } from "../firebaseConfig";
import { getAuthErrorMessage } from "@/utils/authErrors";

// SDK oficial del proveedor (no OAuth implícito) — requiere código nativo,
// por lo tanto un development build de Expo; no funciona en Expo Go
// (ver PROJECT_CONTEXT.md, sección "Autenticación con Google").
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
});

export function useGoogleAuth() {
  const [signingIn, setSigningIn] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const signInWithGoogle = useCallback(async () => {
    setErrorMessage("");
    setSigningIn(true);
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      if (!isSuccessResponse(response)) {
        // Usuario canceló el flujo, no es un error.
        return;
      }

      const { idToken } = response.data;
      if (!idToken) {
        setErrorMessage("No se pudo obtener el token de Google.");
        return;
      }

      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, credential);
      setSignedIn(true);
    } catch (error) {
      if (
        isErrorWithCode(error) &&
        error.code === statusCodes.SIGN_IN_CANCELLED
      ) {
        return;
      }
      const code = isErrorWithCode(error) ? error.code : undefined;
      setErrorMessage(getAuthErrorMessage(code));
    } finally {
      setSigningIn(false);
    }
  }, []);

  return { signingIn, signedIn, errorMessage, signInWithGoogle };
}
