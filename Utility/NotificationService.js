import messaging from "@react-native-firebase/messaging";
import { db } from "../FirebaseConfig";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";

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

// Save token to Firestore under NotificationToken collection
async function fetchAndStoreToken(username) {
  const token = await getTokenService();
  try {
    await setDoc(doc(db, "NotificationToken", username), {
      token: token,
    });
    console.log("FCM Token successfully stored in Firestore!");
  } catch (error) {
    console.error("Error storing token in Firestore:", error);
  }
}

// Retrieve token for a given user
async function fetchNotificationToken(userEmail) {
  try {
    const tokenDoc = doc(db, "NotificationToken", userEmail);
    const tokenSnapshot = await getDoc(tokenDoc);
    if (tokenSnapshot.exists()) {
      const tokenData = tokenSnapshot.data();
      return tokenData.token;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching notification token:", error);
    return null;
  }
}

// Send notification to pickup executive
async function sendNotification(
  pickupPerson,
  consignorname,
  pickuparea,
  pickupDatetime
) {
  const token = await fetchNotificationToken(`${pickupPerson}@gmail.com`);
  console.log(token);
  axios
    .post("https://shiphit-backend.onrender.com/sendNotification", {
      to: token,
      title: "New Pickup Request",
      body: `🚨 You have a new pickup request:\n\n📍 Location: ${pickuparea}\n👤 Client: ${consignorname}\n🕒 Time: ${pickupDatetime}\n\n➡️ Please review the details and proceed.`,
      image: "",
      link: "",
    })
    .then((result) => {
      console.log(result.data);
    })
    .catch((e) => {
      console.log("error", e.message);
    });
}

// Notify admin when pickup is completed
async function sendNotification_pickupCompleted(pickupPersonName) {
  const userdata = await LoginCredentials();
  axios
    .post("https://shiphit-backend.onrender.com/sendNotification", {
      to: await fetchNotificationToken(userdata[0].email),
      title: "Pickup Completed",
      body: `The pickup has been successfully completed.\n\n👷 Pickup Person: ${pickupPersonName}\n\nPlease review the details in the app. Thank you.`,
      image: "",
      sound: "default", // use "default" if the custom sound is named in channel
      link: "",
      channelId: "default",
    })
    .then((result) => {})
    .catch((e) => {
      console.log("error", e.message);
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

// ✅ Listen and auto-store refreshed FCM tokens
function handleTokenRefreshListener() {
  messaging().onTokenRefresh(async (newToken) => {
    try {
      const userData = await AsyncStorage.getItem("userData");
      const email = JSON.parse(userData)?.email;

      if (email && newToken) {
        await setDoc(doc(db, "NotificationToken", email), {
          token: newToken,
        });
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
  sendNotification,
  sendNotification_pickupCompleted,
  LoginCredentials,
  fetchLoginedUserEmail,
  setupNotificationListeners,
  handleTokenRefreshListener, // ✅ ADDED HERE
};
