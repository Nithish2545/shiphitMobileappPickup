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
import { db } from "../../FirebaseConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { collection, onSnapshot } from "firebase/firestore"; // Import Firestore functions
import ModalDatePicker from "react-native-modal-datetime-picker";
import DB from "../../Utility/DB";
import { useNavigation } from "@react-navigation/native";

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
  const [awbnumber, setawbnumber] = useState("");
  const [FromNumber, setFromNumber] = useState("");
  const [overview, setoverview] = useState("");
  const [pickupPersons, setPickupPersons] = useState(["Unassigned"]);
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "OpsPickupLoginCredentials"),
      (querySnapshot) => {
        const names = ["Unassigned"];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          Object.values(data).forEach((arr) => {
            names.push(arr[0]); // Push only the name (index 0)
          });
        });
        setPickupPersons(names);
      },
      (error) => {
        console.error("Error fetching pickup persons: ", error);
      }
    );

    return () => unsubscribe();
  }, []);

  const navigation = useNavigation();
  const handleDatePicked = (date) => {
    const day = date.getDate(); // Get day without leading zero
    const month = date.getMonth() + 1; // Get month (0-based index) without leading zero
    const year = date.getFullYear(); // Get full year
    const formattedDate = `${day}-${month}-${year}`; // Format as dd-mm-yyyy
    settofilterdate(`${day}-${month}`);
    setSelectedDate(formattedDate);
    setDatePickerVisibility(false);
  };

  useEffect(() => {
    const getTotalCount = (data) => {
      return data.reduce((acc, item) => {
        // Increment count for each status
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {});
    };
    const totalCount = getTotalCount(userData);
    setoverview(totalCount);
  }, [userData]);

  // ALL SHIPMENTS

  const [currentTab, setcurrentTab] = useState("RUN SHEET");

  function parseDateTime(pickupDatetime) {
    // Remove "&" and extra spaces
    const cleaned = pickupDatetime.replace("&", "").trim();

    // Match pattern like "11-4-2025 1 PM"
    const parts = cleaned.split(/\s+/);

    if (parts.length < 3) return new Date(0); // Fallback for bad formats

    const [dayStr, monthStr, yearStr] = parts[0].split("-");
    const [hourStr, ampm] = [parts[1], parts[2]];

    const day = parseInt(dayStr, 10);
    const month = parseInt(monthStr, 10);
    const year = parseInt(yearStr, 10);
    let hour = parseInt(hourStr, 10);

    if (ampm === "PM" && hour !== 12) hour += 12;
    if (ampm === "AM" && hour === 12) hour = 0;

    return new Date(year, month - 1, day, hour);
  }

  const onRefresh = async () => {
    setRefreshing(true); // Start refreshing
    await fetchData(); // Fetch new data
    setRefreshing(false); // Stop refreshing
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
      collection(db, DB.db_collection),
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
    .filter((data) => {
      // If the awbnumber is empty, return all data without filtering by awbNumber
      if (awbnumber === "") {
        return true; // This will return all data
      }
      // Otherwise, filter by awbnumber
      return String(data.awbNumber || "").startsWith(awbnumber);
    })
    .filter((data) => {
      // If the awbnumber is empty, return all data without filtering by awbNumber
      if (FromNumber === "") {
        return true; // This will return all data
      }
      // Otherwise, filter by awbnumber
      return String(data.consignorphonenumber || "").startsWith(FromNumber);
    })
    .filter((data) => data.pickupDatetime.startsWith(tofilterDate)) // Apply the date filter
    .sort(
      (a, b) =>
        parseDateTime(b.pickupDatetime) - parseDateTime(a.pickupDatetime)
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
          <TouchableOpacity
            onPress={() => {
              navigation.navigate("Profile", { overview: overview });
            }}
          >
            <FontAwesome5 name="user-alt" size={24} color="black" />
          </TouchableOpacity>
          <Text style={{ color: "black", fontWeight: "600", fontSize: 16 }}>
            {currentTab == "INCOMING MANIFEST" ? "WAREHOUSE" : currentTab}
          </Text>
          <TextInput
            value={awbnumber}
            onChangeText={(text) => {
              // Allow only digits
              const numericText = text.replace(/[^0-9]/g, "");
              setawbnumber(numericText);
            }}
            placeholder="Search by AWB Number"
            keyboardType="numeric"
            maxLength={12} // optional: limit AWB number length
            style={{
              borderColor: "purple",
              borderWidth: 1,
              borderRadius: 7,
              padding: 6,
              fontSize: 14,
              backgroundColor: "#f9f9f9",
              color: "#333",
            }}
          />
        </View>
        <View
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 8,
          }}
        >
          <View style={{ flexDirection: "row", gap: 20 }}>
            <TouchableOpacity
              onPress={() => setDatePickerVisibility(true)}
              style={[styles.datePickerInput, { flexDirection: "row" }]}
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
              <Text style={[styles.clearButtonText, { paddingHorizontal: 5 }]}>
                x
              </Text>
            </TouchableOpacity>
          </View>
          <TextInput
            value={FromNumber}
            onChangeText={(text) => {
              // Allow only digits
              const numericText = text.replace(/[^0-9]/g, "");
              setFromNumber(numericText);
            }}
            placeholder="Search By Number"
            keyboardType="numeric"
            maxLength={12} // optional: limit AWB number length
            style={{
              borderColor: "purple",
              borderWidth: 1,
              borderRadius: 7,
              padding: 6,
              fontSize: 14,
              backgroundColor: "#f9f9f9",
              color: "#333",
            }}
          />
        </View>
        <ModalDatePicker
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={handleDatePicked}
          onCancel={() => setDatePickerVisibility(false)}
        />
      </View>
      <View style={styles.nav}>
        {/* <TouchableOpacity
          style={styles.buttonSpace}
          onPress={() => handleTabChange("ALL SHIPMENTS")}
        >
          <MaterialCommunityIcons
            name="view-list"
            size={32}
            color={currentTab === "ALL SHIPMENTS" ? "#8647D3" : "#A985D4"}
          />
        </TouchableOpacity> */}
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
            <Runsheet
              pickupPersons={pickupPersons}
              datetime={tofilterDate}
              awbnumberSearch={awbnumber}
              FromNumber={FromNumber}
            />
          ) : currentTab === "INCOMING MANIFEST" ? (
            <Incomingmanifest
              userData={incomingManifestItems}
              datetime={tofilterDate}
              awbnumberSearch={awbnumber}
              FromNumber={FromNumber}
            />
          ) : currentTab === "PAYMENT PENDING" ? (
            <PaymentPending
              userData={paymentPending}
              datetime={tofilterDate}
              awbnumberSearch={awbnumber}
              FromNumber={FromNumber}
            />
          ) : currentTab === "PAYMENT DONE" ? (
            <PaymentDone
              userData={paymentDone}
              datetime={tofilterDate}
              awbnumberSearch={awbnumber}
              FromNumber={FromNumber}
            />
          ) : currentTab === "SHIPMENT CONNECTED" ? (
            <ShipmentConnected
              userData={shipmentconnected}
              datetime={tofilterDate}
              awbnumberSearch={awbnumber}
              FromNumber={FromNumber}
            />
          ) : null}
          {/* : currentTab === "ALL SHIPMENTS" ? (
  <Allshipments userData={AllShipments} datetime={tofilterDate} /> */}
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
