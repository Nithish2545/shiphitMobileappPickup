import { signOut } from "firebase/auth";
import { Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FIREBASE_AUTH } from "../../FirebaseConfig";
import NotificationService from "../../Utility/NotificationService";

const Signout = () => {
  const handleSignOut = async () => {
    try {
      const stored = await AsyncStorage.getItem("userData");
      const email = stored ? JSON.parse(stored)?.email : null;
      if (email) await NotificationService.removeTokenOnLogout(email);
      await signOut(FIREBASE_AUTH);
      console.log("Sign-out successful.");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <View>
      <Text
        style={{
          paddingVertical: 10,
          paddingHorizontal: 20,
          backgroundColor: "#8647D3", // The primary purple color
          color: "white",
          fontWeight: "bold",
          borderRadius: 8, // Rounded corners
          textAlign: "center",
          borderWidth: 2,
          borderColor: "#5A2E91", // Darker purple for the border
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
          elevation: 5, // Elevation for Android shadow
        }}
        onPress={handleSignOut}
      >
        Sign out
      </Text>
    </View>
  );
};

export default Signout;
