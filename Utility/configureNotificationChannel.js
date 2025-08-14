import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export async function configureNotificationChannel() {
  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.HIGH,
        sound: "alert.wav", // Must match the file name in assets
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }
    console.log("success!")
  } catch (error) {
    console.log("error", error);
  }
}
