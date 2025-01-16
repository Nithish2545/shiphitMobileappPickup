import messaging from "@react-native-firebase/messaging";
import { db } from "../FirebaseConfig";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

function findAdminRole(data) {
  const adminData = [];
  // Iterate through each key-value pair in the object
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

async function LoginCredentials() {
  try {
    const querySnapshot = await getDocs(collection(db, "LoginCredentials"));
    const credentials = querySnapshot.docs.map((doc) => ({
      id: doc.id, // Document ID
      ...doc.data(), // Document data
    }));

    return findAdminRole(credentials);
  } catch (error) {
    console.error("Error fetching LoginCredentials:", error.message);
    return null; // Return null in case of an error
  }
}

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

async function getTokenService() {
  // Declare fcm_token as undefined initially
  let fcm_token;
  // Request user permission before getting the token
  const permissionGranted = await requestUserPermission();
  if (permissionGranted) {
    try {
      // Get the token asynchronously
      fcm_token = await messaging().getToken();
      return fcm_token; // Return the token after it's retrieved
    } catch (error) {
      return "Error getting token!";
    }
  } else {
    return "Permission not granted!";
  }
}

async function fetchAndStoreToken(username) {
  const token = await getTokenService();
  // Store the token in Firestore under the NotificationToken collection
  try {
    await setDoc(doc(db, "NotificationToken", username), {
      token: token, // Store the token under the user's username
    });
    console.log("FCM Token successfully stored in Firestore!");
  } catch (error) {
    console.error("Error storing token in Firestore:", error);
  }
}

async function fetchNotificationToken(userEmail) {
  try {
    const tokenDoc = doc(db, "NotificationToken", userEmail);
    const tokenSnapshot = await getDoc(tokenDoc);
    if (tokenSnapshot.exists()) {
      const tokenData = tokenSnapshot.data();
      return tokenData.token; // Return the token
    } else {
      console.log(`No token found for userEmail: ${userEmail}`);
      return null; // Return null if no token exists
    }
  } catch (error) {
    console.error("Error fetching notification token:", error);
    return null; // Return null in case of an error
  }
}

async function sendNotification(consignorname, pickuparea, pickupDatetime) {
  const token = await fetchNotificationToken(await fetchLoginedUserEmail());
  console.log("token", token);
  axios
    .post("https://shiphit-backend.onrender.com/sendNotification", {
      to: token,
      title: "New Pickup Request",
      body: `🚨 You have a new pickup request:\n\n📍 Location: ${pickuparea}\n👤 Client: ${consignorname}\n🕒 Time: ${pickupDatetime}\n\n➡️ Please review the details and proceed.`,
      image: "https://www.shiphit.in/images/logo.png",
      link: "",
    })
    .then((result) => {
      console.log(result.data);
    })
    .catch((e) => {
      console.log("error", e.message);
    });
}

async function sendNotification_pickupCompleted(pickupPersonName) {
  console.log("pickupPersonName", pickupPersonName);
  const userdata = await LoginCredentials();
  console.log("token", await fetchNotificationToken(userdata[0].email));
  axios
    .post("https://shiphit-backend.onrender.com/sendNotification", {
      to: await fetchNotificationToken(userdata[0].email), // Token for the Ops head
      title: "Pickup Completed",
      body: `The pickup has been successfully completed.\n\n👷 Pickup Person: ${pickupPersonName}\n\nPlease review the details in the app. Thank you.`,
      image: "https://www.shiphit.in/images/logo.png",
      link: "",
    })
    .then((result) => {
      console.log(result.data);
    })
    .catch((e) => {
      console.log("error", e.message);
    });
}

async function fetchLoginedUserEmail() {
  return JSON.parse(await AsyncStorage.getItem("userData")).email;
}

export default {
  getTokenService: getTokenService,
  fetchAndStoreToken: fetchAndStoreToken,
  sendNotification: sendNotification,
  sendNotification_pickupCompleted: sendNotification_pickupCompleted,
  LoginCredentials: LoginCredentials,
  fetchLoginedUserEmail: fetchLoginedUserEmail,
};
