import { signOut } from "firebase/auth";
import { Text, View } from "react-native";
import { FIREBASE_AUTH } from "../../FirebaseConfig";

const Signout = () => {
  const handleSignOut = () => {
    signOut(FIREBASE_AUTH)
      .then(() => {
        console.log("Sign-out successful.");
      })
      .catch((error) => {
        console.error("Error signing out:", error);
      });
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
