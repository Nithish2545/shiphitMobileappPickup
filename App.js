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
import PickupDetails from "./Pickup/screens/PickupDetails";
import VendorDetails from "./Admin/screens/VendorDetails";
import CardDetails from "./Admin/screens/CardDetails";
import ShipmentConnected from "./Admin/screens/ShipmentConnected";
import messaging from "@react-native-firebase/messaging";
import * as Notifications from "expo-notifications";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NotificationService from "./Utility/NotificationService";
import RealTimeNavigation from "./Pickup/screens/RealTimeNavigation";
import VerifyPassword from "./Pickup/screens/VerifyPassword";
import Profile from "./Admin/screens/Profile";
export default function App() {
  useEffect(() => {
    console.log("useEffect testing!");
    // Handle when the app is opened from a notification
    const onNotificationOpenedAppListener = messaging().onNotificationOpenedApp(
      (remoteMessage) => {
        console.log(
          "Notification opened from background:",
          remoteMessage.notification
        );
      }
    );

    // Handle background messages
    const backgroundMessageHandler = messaging().setBackgroundMessageHandler(
      async (remoteMessage) => {
        console.log("Message handled in the background:", remoteMessage);
      }
    );

    // Handle foreground notifications
    const onMessageListener = messaging().onMessage(async (remoteMessage) => {
      console.log("Foreground Notification:", remoteMessage);

      // Display the notification in the foreground
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });

      await Notifications.scheduleNotificationAsync({
        content: {
          title: remoteMessage.notification.title,
          body: remoteMessage.notification.body,
        },
        trigger: null,
      });
    });

    // Cleanup listeners when the component unmounts
    return () => {
      console.log("Cleaning up listeners...");
      onNotificationOpenedAppListener();
      onMessageListener();
      // setBackgroundMessageHandler does not require cleanup
    };
  }, []);

  const Stack = createStackNavigator();
  const auth = FIREBASE_AUTH;
  const [currentUserRole, setCurrentUserRole] = useState(null); // Change to null initially

  useEffect(() => {
    // Setting up the auth state listener
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        const userEmail = user.email;
        // Check if the email is 'deepak@gmail.com' and set role accordingly
        if (userEmail === "jaga.opshead@gmail.com") {
          setCurrentUserRole("admin");
        } else {
          setCurrentUserRole("pickup");
        }
      } else {
        setCurrentUserRole(""); // Clear the user role if not authenticated
      }
    });

    // Cleanup the listener on unmount
    return () => unsubscribe();
  }, [auth]);

  // Show a loading state while checking auth
  if (currentUserRole === null) {
    return null; // Or a loading spinner, etc.
  }

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {currentUserRole === "" ? (
          // If no user is logged in, show SignIn screen
          <Stack.Screen name="SignIn" component={SignIn} />
        ) : currentUserRole === "admin" ? (
          // If the logged-in user is admin, show Admin screens
          <>
            <Stack.Screen name="Admin" component={Admin} />
            <Stack.Screen name="Profile" component={Profile} />
            <Stack.Screen name="Runsheet" component={Runsheet} />
            <Stack.Screen
              name="IncomingManifest"
              component={IncomingManifest}
            />
            <Stack.Screen
              name="IncomingManifestDetails"
              component={IncomingManifestDetails}
            />
            <Stack.Screen name="CardDetails" component={CardDetails} />
            <Stack.Screen name="PaymentPending" component={PaymentPending} />
            <Stack.Screen name="PaymentDone" component={PaymentDone} />
            <Stack.Screen name="VendorDetails" component={VendorDetails} />
            <Stack.Screen
              name="Shipmentconnected"
              component={ShipmentConnected}
            />
          </>
        ) : currentUserRole === "pickup" ? (
          // If the logged-in user is a pickup person, show Pickup screens
          <>
            <Stack.Screen name="Pickup" component={Pickup} />
            <Stack.Screen
              name="RealTimeNavigation"
              component={RealTimeNavigation}
            />
            <Stack.Screen name="verifyotp" component={VerifyPassword} />
            <Stack.Screen name="PickupDetails" component={PickupDetails} />
          </>
        ) : null}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
