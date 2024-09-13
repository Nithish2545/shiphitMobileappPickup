import { NavigationContainer } from "@react-navigation/native";
import SignIn from "./auth/Screens/SignIn";
import { createStackNavigator } from "@react-navigation/stack";
import Admin from "./Admin/screens/Admin";
import Runsheet from "./Admin/screens/Runsheet";
import IncomingManifest from "./Admin/screens/IncomingManifest";
import IncomingManifestDetails from "./Admin/screens/IncomingManifestDetails";
import PaymentDone from "./Admin/screens/PaymentDone";
import PaymentPending from "./Admin/screens/PaymentPending";
import { FIREBASE_AUTH } from "./FirebaseConfig";
import { useEffect, useState } from "react";
import Pickup from "./Pickup/screens/Pickup";
import AsyncStorage from "@react-native-async-storage/async-storage";
import PickupDetails from "./Pickup/screens/PickupDetails ";
import Testing from "./Pickup/screens/Testing";

export default function App() {
  
  const Stack = createStackNavigator();
  const auth = FIREBASE_AUTH;
  const [currentUser, setcurrentUser] = useState(null); // Change to null initially

  useEffect(() => {
    // Setting up the auth state listener
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const userData = await AsyncStorage.getItem("userData");
          if (userData) {
            const parsedUserData = JSON.parse(userData);
            setcurrentUser(parsedUserData.role); // Set role as currentUser
          } else {
            setcurrentUser(""); // Fallback in case userData is not found
          }
        } catch (error) {
          console.error("Error fetching user data from AsyncStorage:", error);
        }
      } else {
        setcurrentUser(""); // Clear current user if not authenticated
      }
    });

    // Cleanup the listener on unmount
    return () => unsubscribe();
  }, []);

  // Show a loading state while checking auth
  if (currentUser === null) {
    return null; // Or a loading spinner, etc.
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {currentUser === "" ? (
          // If no user is logged in, show SignIn screen
          <Stack.Screen name="SignIn" component={SignIn} />
        ) : currentUser === "admin" ? (
          // If the logged-in user is admin, show Admin screens
          <>
            <Stack.Screen name="Admin" component={Admin} />
            <Stack.Screen name="Runsheet" component={Runsheet} />
            <Stack.Screen name="IncomingManifest" component={IncomingManifest} />
            <Stack.Screen
              name="IncomingManifestDetails"
              component={IncomingManifestDetails}
            />
            <Stack.Screen name="PaymentPending" component={PaymentPending} />
            <Stack.Screen name="PaymentDone" component={PaymentDone} />
          </>
        ) : currentUser === "pickup" ? (
          // If the logged-in user is a pickup person, show Pickup screens
        <>
          <Stack.Screen name="Pickup" component={Pickup} />
          <Stack.Screen name="PickupDetails" component={PickupDetails} />
          </> 
        ) : 
        // <Stack.Screen name="Testing" component={Testing} />
        null
        }
      </Stack.Navigator>
    </NavigationContainer>
  );
}