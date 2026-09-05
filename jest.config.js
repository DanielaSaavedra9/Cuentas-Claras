module.exports = {
  preset: "jest-expo",
  transformIgnorePatterns: [
    // Chore SDK 57: expo-router trae ahora `standard-navigation` como
    // dependencia anidada (paquete ESM), que Jest no transformaba por
    // defecto — se agrega al allow-list igual que el resto.
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|standard-navigation)",
  ],
};
