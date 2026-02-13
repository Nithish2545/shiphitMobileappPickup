import Constants from "expo-constants";

export function getCurrentVersion() {
  return (
    Constants.expoConfig?.android?.versionCode ??
    Constants.manifest?.android?.versionCode ??
    1
  );
}
