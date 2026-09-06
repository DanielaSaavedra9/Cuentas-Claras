import Svg, { Path } from "react-native-svg";

type GoogleLogoProps = {
  size?: number;
};

// "G" multicolor oficial de Google, replicado desde el kit de diseño
// (.claude/Cuentas Claras Design System-3/ui_kits/mobile-app/index.html,
// componente GoogleG) — el ícono plano de un solo color no coincide con
// el diseño aprobado.
export function GoogleLogo({ size = 18 }: GoogleLogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        fill="#4285F4"
        d="M45.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h11.9c-.5 2.7-2 5-4.3 6.6v5.4h7C42.5 37.3 45.1 31.4 45.1 24.5z"
      />
      <Path
        fill="#34A853"
        d="M24 46c5.9 0 10.9-2 14.6-5.3l-7-5.4c-2 1.3-4.5 2.1-7.6 2.1-5.9 0-10.9-4-12.6-9.3H4.2v5.6C7.9 41 15.3 46 24 46z"
      />
      <Path
        fill="#FBBC05"
        d="M11.4 28.1c-.4-1.3-.7-2.7-.7-4.1s.3-2.8.7-4.1v-5.6H4.2C2.8 17.1 2 20.4 2 24s.8 6.9 2.2 9.7z"
      />
      <Path
        fill="#EA4335"
        d="M24 10.6c3.2 0 6.1 1.1 8.4 3.3l6.2-6.2C34.9 4.1 29.9 2 24 2 15.3 2 7.9 7 4.2 14.3l7.2 5.6C13.1 14.6 18.1 10.6 24 10.6z"
      />
    </Svg>
  );
}
