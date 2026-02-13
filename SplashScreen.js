import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { checkForUpdate } from "./services/updateService";

export default function SplashScreen({ navigation, route }) {
  useEffect(() => {
    init();
  }, []);

  const { currentUserRole } = route.params ?? {};
  const init = async () => {
    const updateResult = await checkForUpdate();
    console.log("updateResult.updateAvailable", updateResult.updateAvailable);
    if (updateResult.updateAvailable) {
      navigation.replace("Update", updateResult);
      return;
    }
    if (currentUserRole == "guest") {
      navigation.replace("SignIn", updateResult);
    }

    if (currentUserRole == "admin") {
      navigation.replace("Admin", updateResult);
    }

    if (currentUserRole == "pickup") {
      navigation.replace("Pickup", updateResult);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
