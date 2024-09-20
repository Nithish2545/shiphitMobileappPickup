import { initializeApp } from "firebase/app";
import { getAuth, browserLocalPersistence, browserSessionPersistence } from "firebase/auth"; // Web-specific imports
import { initializeAuth, getReactNativePersistence } from "firebase/auth"; // React Native-specific imports
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStorage } from "firebase/storage";
import { Platform } from 'react-native'; // Import Platform to detect mobile/web

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCXT0P7ORMI7WFf0yU6anrqRlnGywLDwRE",
  authDomain: "shiphitmobileapppickup.firebaseapp.com",
  projectId: "shiphitmobileapppickup",
  storageBucket: "shiphitmobileapppickup.appspot.com",
  messagingSenderId: "591798517548",
  appId: "1:591798517548:web:f205493abadedf270d3689"
};

// Initialize Firebase
export const FIREBASE_APP = initializeApp(firebaseConfig);

// Conditionally initialize Firebase Auth based on the platform
export let FIREBASE_AUTH;

if (Platform.OS === 'web') {
  // Web-based Firebase Auth with browser persistence
  FIREBASE_AUTH = getAuth(FIREBASE_APP);

  // Optionally, set the persistence to localStorage or sessionStorage
  FIREBASE_AUTH.setPersistence(browserLocalPersistence)  // You can also use browserSessionPersistence here
    .then(() => {
      console.log("Web auth persistence set to local storage");
    })
    .catch((error) => {
      console.error("Error setting auth persistence on web: ", error);
    });
} else {
  // React Native-based Firebase Auth with AsyncStorage persistence
  FIREBASE_AUTH = initializeAuth(FIREBASE_APP, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
}

// Initialize Firebase Storage
export const storage = getStorage(FIREBASE_APP);