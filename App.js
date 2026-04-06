import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";

import messaging from "@react-native-firebase/messaging";
import * as Notifications from "expo-notifications";
import { Audio } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { FIREBASE_AUTH } from "./FirebaseConfig";
import NotificationService from "./Utility/NotificationService";
import { configureNotificationChannel } from "./Utility/configureNotificationChannel";

// Must be called at top level BEFORE component mounts (Expo docs requirement)
configureNotificationChannel();
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/* ---------- Screens ---------- */
import SplashScreen from "./SplashScreen";
import UpdateScreen from "./UpdateScreen";
import SignIn from "./auth/Screens/SignIn";

/* Admin */
import Admin from "./Admin/screens/Admin";
import Runsheet from "./Admin/screens/Runsheet";
import IncomingManifest from "./Admin/screens/IncomingManifest";
import IncomingManifestDetails from "./Admin/screens/IncomingManifestDetails";
import PaymentDone from "./Admin/screens/PaymentDone";
import PaymentPending from "./Admin/screens/PaymentPending";
import VendorDetails from "./Admin/screens/VendorDetails";
import CardDetails from "./Admin/screens/CardDetails";
import ShipmentConnected from "./Admin/screens/ShipmentConnected";
import Profile from "./Admin/screens/Profile";

/* Pickup */
import Pickup from "./Pickup/screens/Pickup";
import PickupDetails from "./Pickup/screens/PickupDetails";
import RealTimeNavigation from "./Pickup/screens/RealTimeNavigation";
import VerifyPassword from "./Pickup/screens/VerifyPassword";
import PEProfile from "./Pickup/screens/PEProfile";

const Stack = createStackNavigator();

function SplashExitScreen() {
  return null;
}

export default function App() {
  /* ---------- AUTH STATE ---------- */
  const [authReady, setAuthReady] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState(null);

  /* ---------- FIREBASE AUTH ---------- */
  useEffect(() => {
    const unsubscribe = FIREBASE_AUTH.onAuthStateChanged((user) => {
      if (user) {
        if (user.email === "jaga.opshead@gmail.com") {
          setCurrentUserRole("admin");
        } else {
          setCurrentUserRole("pickup");
        }
      } else {
        setCurrentUserRole("guest");
      }

      setAuthReady(true); // ✅ critical
    });

    return unsubscribe;
  }, []);

  /* ---------- NOTIFICATIONS ---------- */
  useEffect(() => {
    const openedListener = messaging().onNotificationOpenedApp((msg) => {
      console.log("Notification opened:", msg?.notification);
    });

    const messageListener = messaging().onMessage(async (msg) => {
      // Play custom sound manually — guaranteed to work in foreground
      try {
        const { sound } = await Audio.Sound.createAsync(
          require("./assets/notifications/custom_sound.wav")
        );
        await sound.playAsync();
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) sound.unloadAsync();
        });
      } catch (e) {
        console.log("Sound play error:", e.message);
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: msg.notification?.title,
          body: msg.notification?.body,
          channelId: "shiphit_alerts",
        },
        trigger: null,
      });
    });

    const tokenRefreshListener = messaging().onTokenRefresh(async (token) => {
      try {
        const userData = await AsyncStorage.getItem("userData");
        const user = JSON.parse(userData);
        if (user?.email) {
          await NotificationService.fetchAndStoreToken(user.email);
        }
      } catch (e) {
        console.log("Token refresh error:", e.message);
      }
    });

    return () => {
      openedListener();
      messageListener();
      tokenRefreshListener();
    };
  }, []);

  /* ---------- AUTH LOADING UI ---------- */
  if (!authReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  /* ---------- NAVIGATION ---------- */
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Always available */}
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
          initialParams={{ currentUserRole }}
        />
        <Stack.Screen name="Update" component={UpdateScreen} />
        {/* Guest */}
        {currentUserRole === "guest" && (
          <Stack.Screen name="SignIn" component={SignIn} />
        )}

        {/* Admin */}
        {currentUserRole === "admin" && (
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
        )}

        {/* Pickup */}
        {currentUserRole === "pickup" && (
          <>
            <Stack.Screen name="Pickup" component={Pickup} />
            <Stack.Screen name="Profile" component={PEProfile} />
            <Stack.Screen
              name="RealTimeNavigation"
              component={RealTimeNavigation}
            />
            <Stack.Screen name="verifyotp" component={VerifyPassword} />
            <Stack.Screen name="PickupDetails" component={PickupDetails} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
