import messaging from "@react-native-firebase/messaging";
import { db } from "../FirebaseConfig";
import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";

function isValidToken(token) {
  return (
    typeof token === "string" &&
    token.length > 0 &&
    !token.startsWith("Error") &&
    !token.startsWith("Permission")
  );
}

// Utility: Find admin users from LoginCredentials
function findAdminRole(data) {
  const adminData = [];
  for (const [key, value] of Object.entries(data[0])) {
    if (Array.isArray(value) && value[2] === "admin") {
      adminData.push({
        email: key,
        name: value[0],
        role: value[2],
        location: value[3],
      });
    }
  }
  return adminData;
}

// Fetch LoginCredentials from Firestore
async function LoginCredentials() {
  try {
    const querySnapshot = await getDocs(collection(db, "LoginCredentials"));
    const credentials = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return findAdminRole(credentials);
  } catch (error) {
    console.error("Error fetching LoginCredentials:", error.message);
    return null;
  }
}

// Request notification permission
async function requestUserPermission() {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;
  if (enabled) {
    console.log("Authorization status:", authStatus);
    return authStatus;
  }
}

// Get current token (used in fetchAndStoreToken)
async function getTokenService() {
  let fcm_token;
  const permissionGranted = await requestUserPermission();
  if (permissionGranted) {
    try {
      fcm_token = await messaging().getToken();
      return fcm_token;
    } catch (error) {
      return "Error getting token!";
    }
  } else {
    return "Permission not granted!";
  }
}

// Save this device's token under NotificationToken/{username}.tokens (array)
async function fetchAndStoreToken(username) {
  const token = await getTokenService();
  if (!isValidToken(token)) {
    console.warn("Skipping token store; invalid token:", token);
    return;
  }
  try {
    await setDoc(
      doc(db, "NotificationToken", username),
      { tokens: arrayUnion(token) },
      { merge: true },
    );
    console.log("FCM Token added to Firestore tokens array.");
  } catch (error) {
    console.error("Error storing token in Firestore:", error);
  }
}

// Retrieve all device tokens for a given user (handles legacy single-token docs)
async function fetchNotificationTokens(userEmail) {
  try {
    const snapshot = await getDoc(doc(db, "NotificationToken", userEmail));
    if (!snapshot.exists()) return [];
    const data = snapshot.data();
    const tokens = Array.isArray(data.tokens) ? data.tokens : [];
    if (tokens.length === 0 && isValidToken(data.token)) {
      return [data.token];
    }
    return tokens.filter(isValidToken);
  } catch (error) {
    console.error("Error fetching notification tokens:", error);
    return [];
  }
}

// Remove this device's token on logout so it stops receiving pushes
async function removeTokenOnLogout(userEmail) {
  if (!userEmail) return;
  try {
    const token = await messaging().getToken();
    if (!isValidToken(token)) return;
    await setDoc(
      doc(db, "NotificationToken", userEmail),
      { tokens: arrayRemove(token) },
      { merge: true },
    );
    console.log("FCM Token removed from Firestore on logout.");
  } catch (error) {
    console.error("Error removing token on logout:", error);
  }
}

// Send the same payload to every device token registered for a user
async function sendToAllUserDevices(userEmail, payload) {
  const tokens = await fetchNotificationTokens(userEmail);
  console.log("tokens", tokens);
  if (tokens.length === 0) {
    console.log("No tokens registered for", userEmail);
    return;
  }
  const body = { ...payload, to: tokens };
  console.log(body);
  axios
    .post(
      "https://notification-opt-service-f5f3ec066fe8.herokuapp.com/sendNotification",
      body,
    )
    .then((result) => console.log("notify ok", result.data))
    .catch((e) =>
      console.log("notify error", e?.response?.status, e?.response?.data),
    );
}

// Send notification to pickup executive (all of their devices)
async function sendNotification(
  pickupPerson,
  consignorname,
  pickuparea,
  pickupDatetime,
) {
  await sendToAllUserDevices(`${pickupPerson}@gmail.com`, {
    title: "New Pickup Request",
    body: `The pickup has been successfully completed.\n\n👷 Pickup Person: ${pickupPerson}\n\nPlease review the details in the app. Thank you.`,
    image: "",
    link: "",
    sound: "custom_sound.wav",
    channelId: "shiphit_alerts",
  });
}

// Notify admin (all of their devices) when pickup is completed
async function sendNotification_pickupCompleted(pickupPersonName) {
  const userdata = await LoginCredentials();
  if (!userdata || !userdata[0]) return;
  await sendToAllUserDevices(userdata[0].email, {
    title: "Pickup Completed",
    body: `The pickup has been successfully completed.\n\n👷 Pickup Person: ${pickupPersonName}\n\nPlease review the details in the app. Thank you.`,
    image: "",
    sound: "custom_sound.wav",
    link: "",
    channelId: "shiphit_alerts",
  });
}

// Fetch current user email from AsyncStorage
async function fetchLoginedUserEmail() {
  return JSON.parse(await AsyncStorage.getItem("userData")).email;
}

// 🔔 Setup all notification listeners (foreground, background, launch)
function setupNotificationListeners() {
  messaging().onMessage(async (remoteMessage) => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    await Notifications.scheduleNotificationAsync({
      content: {
        title: remoteMessage.notification?.title || "New Message",
        body: remoteMessage.notification?.body || "",
        sound: "custom_sound.wav",
        channelId: "shiphit_alerts",
      },
      trigger: null,
    });
  });

  messaging().onNotificationOpenedApp((remoteMessage) => {
    console.log("Notification opened from background:", remoteMessage);
  });

  messaging()
    .getInitialNotification()
    .then((remoteMessage) => {
      if (remoteMessage) {
        console.log("App launched from notification:", remoteMessage);
      }
    });

  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log("Background message received:", remoteMessage);
  });
}

// ✅ Listen and auto-append refreshed FCM tokens
function handleTokenRefreshListener() {
  messaging().onTokenRefresh(async (newToken) => {
    try {
      const userData = await AsyncStorage.getItem("userData");
      const email = JSON.parse(userData)?.email;

      if (email && isValidToken(newToken)) {
        await setDoc(
          doc(db, "NotificationToken", email),
          { tokens: arrayUnion(newToken) },
          { merge: true },
        );
        console.log("🔁 Token refreshed and stored:", newToken);
      }
    } catch (error) {
      console.error("Error refreshing FCM token:", error.message);
    }
  });
}

export default {
  getTokenService,
  fetchAndStoreToken,
  removeTokenOnLogout,
  fetchNotificationTokens,
  sendNotification,
  sendNotification_pickupCompleted,
  LoginCredentials,
  fetchLoginedUserEmail,
  setupNotificationListeners,
  handleTokenRefreshListener,
};
