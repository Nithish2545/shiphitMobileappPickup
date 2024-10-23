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
import PickupCompleted from "./PickupCompleted";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { db, FIREBASE_AUTH } from "../../FirebaseConfig";
import { signOut } from "firebase/auth";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Ionicons from "@expo/vector-icons/Ionicons";
import { collection, onSnapshot } from "firebase/firestore";
import ModalDatePicker from "react-native-modal-datetime-picker";

export default function Admin() {
  
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState([]);
  const [error, setError] = useState("");
  const [userName, setUserName] = useState("");
  const [currentTab, setcurrentTab] = useState("RUN SHEET");
  const [selectedDate, setSelectedDate] = useState("");
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [tofilterDate, settofilterdate] = useState("");

  // FORM IMAGES/
  // PACKAGE WEIGHT/
  // PICKUPPERSONIMAGE/
  // PRODUCT IMAGES/

  const handleDatePicked = (date) => {
    const day = date.getDate(); // Get day without leading zero
    const month = date.getMonth() + 1; // Get month (0-based index) without leading zero
    const year = date.getFullYear(); // Get full year
    const formattedDate = `${day}-${month}-${year}`; // Format as dd-mm-yyyy
    settofilterdate(`${day}-${month}`);
    setSelectedDate(formattedDate);
    setDatePickerVisibility(false);
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
    const fetchData = async () => {
      try {
        const local_S_userData = await AsyncStorage.getItem("userData");
        if (local_S_userData) {
          setUserName(JSON.parse(local_S_userData).name);
        } else {
          console.log("No data found for key 'userData'");
        }
      } catch (e) {
        console.error("Failed to load data from AsyncStorage", e);
      }
    };
    fetchData();
  }, []);

  const parsePickupDate = (pickupDatetime) => {
    // Split date and time parts
    const [datePart, timePart] = pickupDatetime
      .split("&")
      .map((part) => part.trim());
    const [day, month] = datePart.split("-").map(Number);
    const [hourPart, period] = timePart.split(" ").map((part) => part.trim());

    // Adjust hour based on AM/PM
    let hour = parseInt(hourPart);
    if (period === "PM" && hour < 12) hour += 12;
    if (period === "AM" && hour === 12) hour = 0;

    // Create a new Date object
    const date = new Date();
    date.setDate(day);
    date.setMonth(month - 1); // Months are 0-indexed
    date.setHours(hour, 0, 0, 0); // Set hours, minutes, seconds, and milliseconds to 0

    return date;
  };

  const fetchData = async () => {
    const unsubscribe = onSnapshot(
      collection(db, "pickup"),
      (querySnapshot) => {
        const sortedData = querySnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .sort((a, b) => {
            // Convert pickupDatetime to Date objects for comparison
            const dateA = parsePickupDate(a.pickupDatetime);
            const dateB = parsePickupDate(b.pickupDatetime);
            return dateA - dateB; // Sort in ascending order
          });

        setUserData(sortedData);
      },
      (error) => {
        setError(`Error: ${error.message}`);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  };

  useEffect(() => {
    fetchData();
    setLoading(false);
  }, [userName]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const currentItems = userData.filter(
    (user) =>
      user.status === "RUN SHEET" &&
      user.pickUpPersonName === userName &&
      user.pickupDatetime?.includes(tofilterDate)
  );

  const incomingManifestItems = userData.filter(
    (user) =>
      (user.status === "INCOMING MANIFEST" ||
        user.status === "PAYMENT PENDING" ||
        user.status === "PAYMENT DONE" ||
        user.status === "SHIPMENT CONNECTED") &&
      user.pickUpPersonName === userName &&
      user.pickupCompletedDatatime?.includes(tofilterDate)
  );

  console.log(incomingManifestItems);
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
            {currentTab == "INCOMING MANIFEST"
              ? "PICKUP COMPLETED"
              : currentTab}
          </Text>
          <Text
            style={{
              paddingVertical: 10,
              paddingHorizontal: 20,
              backgroundColor: "#8647D3",
              color: "white",
              fontWeight: "bold",
              borderRadius: 8,
              textAlign: "center",
              borderWidth: 2,
              borderColor: "#5A2E91",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 5,
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
      {/* Navigation Tabs */}
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => handleTabChange("RUN SHEET")}>
          <FontAwesome5
            name="truck-pickup"
            size={32}
            color={currentTab === "RUN SHEET" ? "#8647D3" : "#A985D4"}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleTabChange("INCOMING MANIFEST")}>
          <Ionicons
            name="checkmark-done-circle-outline"
            size={32}
            color={currentTab === "INCOMING MANIFEST" ? "#8647D3" : "#A985D4"}
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
  signout: {
    display: "flex",
    paddingRight: 15,
    paddingLeft: 15,
    flexDirection: "column",
    justifyContent: "space-between",
    height: 100,
    paddingBottom: 20,
    borderBottomWidth: 1,
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
    paddingBottom: 20,
    paddingTop: 10,
    paddingLeft: 10,
    paddingRight: 10,
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
