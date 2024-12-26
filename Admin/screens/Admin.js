import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from "react-native";
import { useEffect, useState } from "react";
import Runsheet from "./Runsheet";
import Incomingmanifest from "../screens/IncomingManifest";
import PaymentDone from "../screens/PaymentDone";
import PaymentPending from "../screens/PaymentPending";
import ShipmentConnected from "../screens/ShipmentConnected";
import Ionicons from "@expo/vector-icons/Ionicons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { signOut } from "firebase/auth";
import { db, FIREBASE_AUTH } from "../../FirebaseConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Allshipments from "./Allshipments";
import { collection, onSnapshot } from "firebase/firestore"; // Import Firestore functions
import ModalDatePicker from "react-native-modal-datetime-picker";

export default function Admin() {
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState([]);
  const [error, setError] = useState("");
  const [userRole, setUserRole] = useState(null);
  const [assignments, setAssignments] = useState({});
  const [refreshing, setRefreshing] = useState(false); // Add refreshing state
  const [selectedDate, setSelectedDate] = useState("");
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [tofilterDate, settofilterdate] = useState("");
  const handleDatePicked = (date) => {
    const day = date.getDate(); // Get day without leading zero
    const month = date.getMonth() + 1; // Get month (0-based index) without leading zero
    const year = date.getFullYear(); // Get full year
    const formattedDate = `${day}-${month}-${year}`; // Format as dd-mm-yyyy
    settofilterdate(`${day}-${month}`);
    setSelectedDate(formattedDate);
    setDatePickerVisibility(false);
  };

  const pickupPersons = [
    "Unassigned",
    "sangeetha",
    "sathish",
    "praven",
    "jaga",
  ];

  // LIST SHIPMENTS

  const [currentTab, setcurrentTab] = useState("LIST SHIPMENTS");

  function parseDateTime(pickupDatetime) {
    // Remove "&" and any extra spaces
    const formattedDatetime = pickupDatetime.replace("&", "").trim();

    // Split date part and time part
    const [datePart, timePart] = formattedDatetime.split(/\s+/);
    const [day, month] = datePart.split("-").map(Number);

    // Check if time part is present and valid
    if (!timePart || !/\d+/.test(timePart)) {
      return new Date(2024, month - 1, day); // Only date part is available, return date with default time
    }

    // Extract the hour and AM/PM, with a fallback
    const match = timePart.match(/(\d+)\s*(AM|PM)/);
    if (!match) {
      return new Date(2024, month - 1, day); // No valid time, return date without time
    }

    let [hour, modifier] = match.slice(1);
    hour = parseInt(hour, 10);

    // Convert to 24-hour format
    if (modifier === "PM" && hour !== 12) {
      hour += 12;
    } else if (modifier === "AM" && hour === 12) {
      hour = 0;
    }

    // Assuming all data is for the year 2024
    return new Date(2024, month - 1, day, hour);
  }

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

  const fetchData = () => {
    const unsubscribe = onSnapshot(
      collection(db, "pickup"),
      (querySnapshot) => {
        const sortedData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })); // Map through documents to get data
        setUserData(sortedData);
        // If you have a function named parsePickupDateTime, call it here
        // fetchAssignments(); // Fetch assignments
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
  }, [userRole]);

  // Filter data based on STATUS
  const AllShipments = userData
    .filter((data) => data.pickupDatetime.includes(tofilterDate))
    .sort(
      (a, b) =>
        parseDateTime(a.pickupDatetime) - parseDateTime(b.pickupDatetime)
    );

  const incomingManifestItems = userData
    .filter(
      (user) =>
        user.status === "INCOMING MANIFEST" &&
        user.pickupDatetime.includes(tofilterDate)
    )
    .sort(
      (a, b) =>
        parseDateTime(a.pickupDatetime) - parseDateTime(b.pickupDatetime)
    );

  const paymentPending = userData
    .filter((user) => user.status === "PAYMENT PENDING")
    .sort(
      (a, b) =>
        parseDateTime(a.pickupDatetime) - parseDateTime(b.pickupDatetime)
    );

  const paymentDone = userData
    .filter((user) => user.status === "PAYMENT DONE")
    .sort(
      (a, b) =>
        parseDateTime(a.pickupDatetime) - parseDateTime(b.pickupDatetime)
    );

  const shipmentconnected = userData
    .filter((user) => user.status === "SHIPMENT CONNECTED")
    .sort(
      (a, b) =>
        parseDateTime(a.pickupDatetime) - parseDateTime(b.pickupDatetime)
    );

  const handleTabChange = (tab) => {
    setcurrentTab(tab);
  };

  return (
    <View style={styles.container}>
      <View style={styles.signout}>
        <View
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <Text style={{ color: "black", fontWeight: "600", fontSize: 18 }}>
            {currentTab == "INCOMING MANIFEST" ? "WAREHOUSE" : currentTab}
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

        <View style={{ display: "flex", flexDirection: "row", gap: 20 }}>
          <TouchableOpacity
            onPress={() => setDatePickerVisibility(true)}
            style={styles.datePickerInput}
          >
            <TextInput
              style={styles.datePickerText}
              value={selectedDate}
              editable={false} // Prevent user input
              placeholder="dd/mm/yyyy" // Set placeholder
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => {
              settofilterdate("");
              setSelectedDate(null); // Clear selected date
              setDatePickerVisibility(false); // Close the modal
            }}
          >
            <Text style={styles.clearButtonText}>Clear Date</Text>
          </TouchableOpacity>
        </View>

        <ModalDatePicker
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={handleDatePicked}
          onCancel={() => setDatePickerVisibility(false)}
        />
      </View>
      <View style={styles.nav}>
        <TouchableOpacity
          style={styles.buttonSpace}
          onPress={() => handleTabChange("LIST SHIPMENTS")}
        >
          <MaterialCommunityIcons
            name="view-list"
            size={32}
            color={currentTab === "LIST SHIPMENTS" ? "#8647D3" : "#A985D4"}
          />
        </TouchableOpacity>
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
            <Runsheet pickupPersons={pickupPersons} datetime={tofilterDate} />
          ) : currentTab === "INCOMING MANIFEST" ? (
            <Incomingmanifest
              userData={incomingManifestItems}
              datetime={tofilterDate}
            />
          ) : currentTab === "PAYMENT PENDING" ? (
            <PaymentPending userData={paymentPending} datetime={tofilterDate} />
          ) : currentTab === "PAYMENT DONE" ? (
            <PaymentDone userData={paymentDone} datetime={tofilterDate} />
          ) : currentTab === "SHIPMENT CONNECTED" ? (
            <ShipmentConnected
              userData={shipmentconnected}
              datetime={tofilterDate}
            />
          ) : currentTab === "LIST SHIPMENTS" ? (
            <Allshipments userData={AllShipments} datetime={tofilterDate} />
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  clearButton: {
    backgroundColor: "#6200ea", // Purple button background
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  clearButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  datePickerInput: {
    borderWidth: 1,
    borderColor: "#8647D3",
    borderRadius: 5,
    backgroundColor: "#fff",
    display: "flex",
    alignSelf: "flex-start",
  },
  datePickerText: {
    color: "black",
    fontSize: 16,
    height: 40,
    padding: 10,
  },
  buttonSpace: {
    padding: 10,
  },
  signout: {
    display: "flex",
    paddingRight: 15,
    paddingLeft: 15,
    flexDirection: "column",
    justifyContent: "space-between",
    height: 100,
    paddingBottom: 20,
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