import { useEffect, useRef } from "react";
import { DeviceEventEmitter } from "react-native";

const EVENTO_TAB_PRESS = "tab-press";

// Fix: reportado por la usuaria — al volver de una pantalla apilada
// sobre un tab (ej. gasto-previsible-detalle, movimiento-detalle) el
// scroll saltaba arriba, como si se hubiera cambiado de tab. Antes el
// reset vivía en un `useFocusEffect(() => scrollToTop())`, pero ese
// hook se dispara igual en dos casos distintos:
//   1. Cambiar a otro tab y volver a este (RF03: acá SÍ debe resetear)
//   2. Navegar a una pantalla apilada desde este tab y volver con
//      back()/replace() (acá NO debe resetear — el usuario espera
//      quedar donde estaba)
// `useFocusEffect` no puede distinguir ambos casos (el foco se pierde y
// se recupera igual en los dos). `tabPress` del tab bar sí: solo se
// dispara al tocar el ícono del tab, nunca al volver de una pantalla
// apilada. Por eso el reset se conecta a `tabPress` (emitido desde
// app/(tabs)/_layout.tsx) en vez de al foco.
export function emitirTabPress(nombreTab: string) {
  DeviceEventEmitter.emit(`${EVENTO_TAB_PRESS}:${nombreTab}`);
}

export function useScrollToTopOnTabPress(nombreTab: string, alTocar: () => void) {
  const alTocarRef = useRef(alTocar);

  // Actualizar el ref en un efecto (no durante el render) — mutar un ref
  // en el cuerpo del componente rompe la regla de refs de React Compiler.
  useEffect(() => {
    alTocarRef.current = alTocar;
  });

  useEffect(() => {
    const suscripcion = DeviceEventEmitter.addListener(
      `${EVENTO_TAB_PRESS}:${nombreTab}`,
      () => alTocarRef.current(),
    );
    return () => suscripcion.remove();
  }, [nombreTab]);
}
