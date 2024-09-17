import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity, // Use TouchableOpacity for clickable items
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
import EvilIcons from "@expo/vector-icons/EvilIcons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

export default function Admin() {
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState([]);
  const [error, setError] = useState("");
  const [userRole, setUserRole] = useState(null);
  const [assignments, setAssignments] = useState({});
  const API_URL = apiURLs.sheetDB;
  const pickupPersons = ["Unassigned", "anish", "sathish"];
  const [currentTab, setcurrentTab] = useState("RUN SHEET");

  // Fetch assignments from Google Sheets
  const fetchAssignments = async () => {
    try {
      const result = await axios.get(API_URL);
      const assignmentsData = result.data.sheet1.reduce((acc, item) => {
        acc[item.AWB_NUMBER] = item.PickUpPersonName; // Adjust based on your sheet structure
        return acc;
      }, {});
      setAssignments(assignmentsData);
    } catch (error) {
      console.error("Error fetching assignments from Google Sheets:", error);
    }
  };

  // Fetch user role from local storage
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (token) {
          const user = JSON.parse(token);
          setUserRole(user.role);
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
      }
    };
    fetchUserRole();
  }, []);

  // Fetch data and assignments
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await axios.get(API_URL);
        setUserData(result.data.sheet1);
        await fetchAssignments(); // Fetch assignments after user data is loaded
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
    fetchData();
  }, [userRole]);

  // Filter data based on STATUS
  const currentItems = userData.filter((user) => user.status === "RUN SHEET");
  console.log(currentItems);
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
  // Tab switching logic

  const handleTabChange = (tab) => {
    setcurrentTab(tab);
  };

  return (
    <View style={styles.container}>
      {/* Navigation Tabs */}
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => handleTabChange("RUN SHEET")}>
          <Text>
            <FontAwesome5
              name="running"
              size={32}
              color={currentTab === "RUN SHEET" ? "#8647D3" : "#A985D4"}
            />
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleTabChange("INCOMING MANIFEST")}>
          <Text>
            <MaterialCommunityIcons
              name="warehouse"
              size={32}
              color={currentTab === "INCOMING MANIFEST" ? "#8647D3" : "#A985D4"}
            />
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => handleTabChange("PAYMENT PENDING")}>
          <Text>
            <MaterialIcons
              name="pending-actions"
              size={32}
              color={currentTab === "PAYMENT PENDING" ? "#8647D3" : "#A985D4"}
            />
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => handleTabChange("PAYMENT DONE")}>
          <Text>
            <Ionicons
              name="checkmark-done-circle"
              size={32}
              color={currentTab === "PAYMENT DONE" ? "#8647D3" : "#A985D4"}
            />
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => handleTabChange("SHIPMENT CONNECTED")}>
          <Text>
            <MaterialIcons
              name="flight"
              size={32}
              color={
                currentTab === "SHIPMENT CONNECTED" ? "#8647D3" : "#A985D4"
              }
            />
          </Text>
        </TouchableOpacity>
      </View>

      {/* Loading and Error Handling */}

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Conditionally Render Components Based on Current Tab */}
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

// Styles for the component
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 0,
    padding: 16,
    backgroundColor: "#fff",
    paddingTop: 50,
    paddingBottom: 50,
    position: "relative",
  },
  scrollContainer: {
    paddingBottom: 100, // Ensure scrollable content doesn't overlap with nav
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
    color: "#A985D4",
    fontSize: 16,
  },
  highlight: {
    color: "#8647D3", // Highlight color for active tab
    fontWeight: "bold",
    fontSize: 16,
  },
});
