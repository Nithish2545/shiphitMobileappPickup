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
import { useState } from "react";

export default function App() {
  const Stack = createStackNavigator();
  const auth = FIREBASE_AUTH;
  const [user, setuser] = useState({});
  auth.onAuthStateChanged((d) => {
    setuser({ email: d.email, UID: d.uid });
  });
  
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* <Stack.Screen name="SignIn" component={SignIn} /> */}
        <Stack.Screen name="Admin" component={Admin} />
        <Stack.Screen name="Runsheet" component={Runsheet} />
        <Stack.Screen name="IncomingManifest" component={IncomingManifest} />
        <Stack.Screen
          name="IncomingManifestDetails"
          component={IncomingManifestDetails}
        />
        <Stack.Screen name="PaymentPending" component={PaymentPending} />
        <Stack.Screen name="PaymentDone" component={PaymentDone} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
