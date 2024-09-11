// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
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
export const FIREBASE_AUTH = getAuth(FIREBASE_APP);