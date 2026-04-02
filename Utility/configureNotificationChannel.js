import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export async function configureNotificationChannel() {
  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("shiphit_alerts", {
        name: "ShipHit Alerts",
        importance: Notifications.AndroidImportance.HIGH,
        sound: "custom_sound.wav", // Must match the file name in assets
        vibrationPattern: [0, 500, 200, 500, 200, 500],
        lightColor: "#FF231F7C",
      });
    }
    console.log("success!")
  } catch (error) {
    console.log("error", error);
  }
}
