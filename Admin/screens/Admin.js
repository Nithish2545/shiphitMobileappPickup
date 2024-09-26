import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import axios from "axios";
import apiURLs from "../../utility/googlescreen/apiURLs";
import { useEffect, useState } from "react";
import Runsheet from "./Runsheet";
import Incomingmanifest from "../screens/IncomingManifest";
import PaymentPending from "./PaymentPending";
import PaymentDone from "./PaymentDone";
import ShipmentConnected from "./ShipmentConnected";
import Ionicons from "@expo/vector-icons/Ionicons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { signOut } from "firebase/auth";
import { FIREBASE_AUTH } from "../../FirebaseConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Admin() {
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState([]);
  const [error, setError] = useState("");
  const [userRole, setUserRole] = useState(null);
  const [assignments, setAssignments] = useState({});
  const [refreshing, setRefreshing] = useState(false); // Add refreshing state
  const API_URL = apiURLs.sheetDB;
  const kovai = apiURLs.kovai;
  const pondy = apiURLs.sheetDB;
  const chennai = apiURLs.sheetDB;
  const pickupPersons = ["Unassigned", "sangeetha", "sathish"];
  const [currentTab, setcurrentTab] = useState("RUN SHEET");

  const onRefresh = async () => {
    setRefreshing(true); // Start refreshing
    await fetchData(); // Fetch new data
    setRefreshing(false); // Stop refreshing
  };

  const handleSignOut = () => {
    signOut(FIREBASE_AUTH)
      .then(() => {
        console.log("Sign-out successful.");
      })
      .catch((error) => {
        console.error("Error signing out:", error);
      });
  };

  const fetchAssignments = async () => {
    try {
      const result = await axios.get(API_URL);
      const assignmentsData = result.data.sheet1.reduce((acc, item) => {
        acc[item.AWB_NUMBER] = item.PickUpPersonName;
        return acc;
      }, {});
      setAssignments(assignmentsData);
    } catch (error) {
      console.error("Error fetching assignments from Google Sheets:", error);
    }
  };

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");
        if (token) {
          const user = JSON.parse(token);
          setUserRole(user.role); // Correctly set the user role
        }
      } catch (error) {
        console.error("Error fetching user role from AsyncStorage", error);
      }
    };
    fetchUserRole();
  }, []);

  const parsePickupDateTime = (dateTimeString) => {
    const [datePart, timePart] = dateTimeString.split("&"); // Split date and time
    const [year, month, day] = datePart.split("-"); // Get year, month, day
    const [hour, minute] = timePart.split(" ")[0].split(":"); // Get hour and minute

    // Convert hour to 24-hour format if it's PM
    const isPM = timePart.includes("PM") && hour !== "12";
    const adjustedHour = isPM ? parseInt(hour, 10) + 12 : hour;
    const date = new Date(year, month - 1, day, adjustedHour, minute || 0); // Create Date object
    return date;
  };

  const fetchData = async () => {
    setLoading(true);

    try {
      const result = await axios.get(API_URL);
      const sortedData = result.data.sheet1.sort((a, b) => {
        const dateTimeA = parsePickupDateTime(a.pickupDatetime);
        const dateTimeB = parsePickupDateTime(b.pickupDatetime);
        return dateTimeA - dateTimeB; // Sort by date and time
      });
      setUserData(sortedData);
      console.log(sortedData);
      parsePickupDateTime;
      await fetchAssignments(); // Fetch assignments
    } catch (error) {
      if (error.response) {
        setError(
          `Error ${error.response.status}: ${
            error.response.data.message || error.message
          }`
        );
      } else if (error.request) {
        setError("Network error. Please check your connection.");
      } else {
        setError(`Error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(); // Fetch data initially
  }, [userRole]);

  // Filter data based on STATUS
  const currentItems = userData.filter((user) => user.status === "RUN SHEET");
  const incomingManifestItems = userData.filter(
    (user) => user.status === "INCOMING MANIFEST"
  );
  const paymentPending = userData.filter(
    (user) => user.status === "PAYMENT PENDING"
  );
  const paymentDone = userData.filter((user) => user.status === "PAYMENT DONE");
  const shipmentconnected = userData.filter(
    (user) => user.status === "SHIPMENT CONNECTED"
  );

  const handleTabChange = (tab) => {
    setcurrentTab(tab);
  };

  return (
    <View style={styles.container}>
      <View style={styles.signout}>
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
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => handleTabChange("RUN SHEET")}>
          <FontAwesome5
            name="running"
            size={32}
            color={currentTab === "RUN SHEET" ? "#8647D3" : "#A985D4"}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleTabChange("INCOMING MANIFEST")}>
          <MaterialCommunityIcons
            name="warehouse"
            size={32}
            color={currentTab === "INCOMING MANIFEST" ? "#8647D3" : "#A985D4"}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleTabChange("PAYMENT PENDING")}>
          <MaterialIcons
            name="pending-actions"
            size={32}
            color={currentTab === "PAYMENT PENDING" ? "#8647D3" : "#A985D4"}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleTabChange("PAYMENT DONE")}>
          <Ionicons
            name="checkmark-done-circle"
            size={32}
            color={currentTab === "PAYMENT DONE" ? "#8647D3" : "#A985D4"}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleTabChange("SHIPMENT CONNECTED")}>
          <MaterialIcons
            name="flight"
            size={32}
            color={currentTab === "SHIPMENT CONNECTED" ? "#8647D3" : "#A985D4"}
          />
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
            <Runsheet userData={currentItems} pickupPersons={pickupPersons} />
          ) : currentTab === "INCOMING MANIFEST" ? (
            <Incomingmanifest userData={incomingManifestItems} />
          ) : currentTab === "PAYMENT PENDING" ? (
            <PaymentPending userData={paymentPending} />
          ) : currentTab === "PAYMENT DONE" ? (
            <PaymentDone userData={paymentDone} />
          ) : currentTab === "SHIPMENT CONNECTED" ? (
            <ShipmentConnected userData={shipmentconnected} />
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  signout: {
    display: "flex",
    padding: 10,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    height: 70,

    borderBottomWidth: 1, // Adds the bottom border
    borderBottomColor: "lightgrey",
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
    paddingBottom: 50,
    padding: 16,
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
});