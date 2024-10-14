import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  RefreshControl, // Import RefreshControl
} from "react-native";
import { useEffect, useState } from "react";
import Runsheet from "./Runsheet";
import PickupCompleted from "./PickupCompleted";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { db, FIREBASE_AUTH } from "../../FirebaseConfig";
import { signOut } from "firebase/auth";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Ionicons from "@expo/vector-icons/Ionicons";
import { collection, onSnapshot } from "firebase/firestore";

export default function Admin() {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false); // Add refreshing state
  const [userData, setUserData] = useState([]);
  const [error, setError] = useState("");
  const [userName, setUserName] = useState("");
  const [currentTab, setcurrentTab] = useState("RUN SHEET");

  const handleSignOut = () => {
    signOut(FIREBASE_AUTH)
      .then(() => {
        console.log("Sign-out successful.");
      })
      .catch((error) => {
        console.error("Error signing out:", error);
      });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const getData = async (key) => {
          const value = await AsyncStorage.getItem(key);
          return value ? JSON.parse(value) : null;
        };

        const local_S_userData = await getData("userData");

        if (local_S_userData) {
          setUserName(local_S_userData.name);
        } else {
          console.log("No data found for key 'userData'");
        }
      } catch (e) {
        console.error("Failed to load data from AsyncStorage", e);
      }
    };
    fetchData();
  }, []);

  const fetchData = async () => {
    const unsubscribe = onSnapshot(
      collection(db, "pickup"),
      (querySnapshot) => {
        const sortedData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })); // Map through documents to get data
        setUserData(sortedData);
      },
      (error) => {
        setError(`Error: ${error.message}`);
        setLoading(false); // Stop loading on error
      }
    );

    // Cleanup the listener on component unmount
    return () => unsubscribe();
  };

  useEffect(() => {
    fetchData(); // Fetch data initially
    setLoading(false); // Set loading to false after fetching data
  }, [userName]);

  // Refresh Handler
  const onRefresh = async () => {
    setRefreshing(true); // Start refreshing
    await fetchData(); // Fetch new data
    setRefreshing(false); // Stop refreshing
  };

  const currentItems = userData.filter(
    (user) => user.status === "RUN SHEET" && user.pickUpPersonName === userName
  );

  const incomingManifestItems = userData.filter(
    (user) =>
      (user.status === "INCOMING MANIFEST" ||
        user.status === "PAYMENT PENDING" ||
        user.status === "PAYMENT DONE" ||
        user.status === "SHIPMENT CONNECTED") &&
      user.pickUpPersonName === userName
  );
  console.log(incomingManifestItems, userName);
  const handleTabChange = (tab) => {
    setcurrentTab(tab);
  };

  return (
    <View style={styles.container}>
      <View style={styles.signout}>
        <Text style={{ color: "black", fontWeight: "600", fontSize: 18 }}>
          {currentTab}
        </Text>

        <Text
          style={{
            paddingVertical: 10,
            paddingHorizontal: 20,
            backgroundColor: "#8647D3", // The primary purple color
            color: "white",
            fontWeight: "bold",
            borderRadius: 8, // Rounded corners
            textAlign: "center",
            borderWidth: 2,
            borderColor: "#5A2E91", // Darker purple for the border
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 5, // Elevation for Android shadow
          }}
          onPress={handleSignOut}
        >
          Sign out
        </Text>
      </View>
      {/* Navigation Tabs */}
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => handleTabChange("RUN SHEET")}>
          <Text>
            <FontAwesome5
              name="truck-pickup"
              size={32}
              color={currentTab === "RUN SHEET" ? "#8647D3" : "#A985D4"}
            />
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleTabChange("INCOMING MANIFEST")}>
          <Text>
            <Ionicons
              name="checkmark-done-circle-outline"
              size={32}
              color={currentTab === "INCOMING MANIFEST" ? "#8647D3" : "#A985D4"}
            />
          </Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {currentTab === "RUN SHEET" ? (
            <Runsheet userData={currentItems} />
          ) : currentTab === "INCOMING MANIFEST" ? (
            <PickupCompleted userData={incomingManifestItems} />
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  signout: {
    display: "flex",
    paddingRight: 15,
    paddingLeft: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 70,
    borderBottomWidth: 1, // Adds the bottom border
    borderBottomColor: "lightgrey", // Use a color for the border (you can adjust it as needed)
  },
  container: {
    flex: 1,
    paddingTop: 0,
    backgroundColor: "#fff",
    paddingTop: 50,
    paddingBottom: 50,
    position: "relative",
  },
  scrollContainer: {
    padding: 10,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginTop: 10,
  },
  nav: {
    backgroundColor: "white",
    position: "absolute",
    height: 80,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    bottom: 0,
    zIndex: 10,
    left: 0,
    right: 0,
  },
  navText: {
    color: "black",
    fontSize: 16,
  },
  highlight: {
    color: "red",
    fontWeight: "bold",
    fontSize: 16,
  },
});
