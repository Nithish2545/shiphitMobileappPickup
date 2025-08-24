import { initializeApp } from "firebase/app";
import { getAuth, browserLocalPersistence } from "firebase/auth"; // Web-specific imports
import { initializeAuth, getReactNativePersistence } from "firebase/auth"; // React Native-specific imports
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getStorage } from "firebase/storage";
import { Platform } from "react-native"; // Import Platform to detect mobile/web
import { getFirestore } from "firebase/firestore";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA-9aTFjb0DWeouH72awQqQvg55LsDduBg",
  authDomain: "shiphitmobileapppickup-fb7e2.firebaseapp.com",
  projectId: "shiphitmobileapppickup-fb7e2",
  storageBucket: "shiphitmobileapppickup-fb7e2.firebasestorage.app",
  messagingSenderId: "119835219554",
  appId: "1:119835219554:web:d2d3de90ae318b1c92633b",
};

// Initialize Firebase

export const FIREBASE_APP = initializeApp(firebaseConfig);

// Conditionally initialize Firebase Auth based on the platform
export let FIREBASE_AUTH;

if (Platform.OS === "web") {
  // Web-based Firebase Auth with browser persistence
  FIREBASE_AUTH = getAuth(FIREBASE_APP);

  // Optionally, set the persistence to localStorage or sessionStorage
  FIREBASE_AUTH.setPersistence(browserLocalPersistence) // You can also use browserSessionPersistence here
    .then(() => {
      console.log("Web auth persistence set to local storage");
    })
    .catch((error) => {
      console.error("Error setting auth persistence on web: ", error);
    });
} else {
  // React Native-based Firebase Auth with AsyncStorage persistence
  FIREBASE_AUTH = initializeAuth(FIREBASE_APP, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}

// Initialize Firebase Storage
export const storage = getStorage(FIREBASE_APP);
export const db = getFirestore(FIREBASE_APP); // Initialize Firestore
