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
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Alert } from "react-native";
import { configureNotificationChannel } from "../../Utility/configureNotificationChannel";

export default function Admin() {
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState([]);
  const [error, setError] = useState("");
  const [userRole, setUserRole] = useState(null);
  const [refreshing, setRefreshing] = useState(false); // Add refreshing state
  const [selectedDate, setSelectedDate] = useState("");
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [tofilterDate, settofilterdate] = useState("");
  const [awbnumber, setawbnumber] = useState("");
  const [FromNumber, setFromNumber] = useState("");
  const [overview, setoverview] = useState("");
  const [pickupPersons, setPickupPersons] = useState(["Unassigned"]);

  useEffect(() => {
    requestPermission();
    configureNotificationChannel();
  }, []);

  async function requestPermission() {
    if (!Device.isDevice) {
      Alert.alert("Push notifications only work on a physical device");
      return;
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Notification permission not granted");
      } else {
        console.log("Notification permission granted ✅");
      }
    } else {
      console.log("Notification permission already granted ✅");
    }
  }

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
    const selectedDates = new Date(`${year}-${month}-${day}`);
    selectedDates.setHours(0, 0, 0, 0);
    settofilterdate(selectedDates.toString());
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

  const incomingManifestItems = userData.filter(
    (user) => user.status === "INCOMING MANIFEST"
  );

  const paymentPending = userData.filter(
    (user) => user.status === "PAYMENT PENDING"
  );

  const paymentDone = userData.filter((user) => user.status === "PAYMENT DONE");

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
        <TouchableOpacity
          onPress={() => handleTabChange("RUN SHEET")}
          style={styles.navItem}
        >
          <FontAwesome5
            name="running"
            size={24} // Slightly smaller for better text pairing
            color={currentTab === "RUN SHEET" ? "#8647D3" : "#A985D4"}
          />
          <Text
            style={[
              styles.navText,
              currentTab === "RUN SHEET" && styles.navTextActive,
            ]}
          >
            Run Sheet
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleTabChange("INCOMING MANIFEST")}
          style={styles.navItem}
        >
          <MaterialCommunityIcons
            name="warehouse"
            size={24}
            color={currentTab === "INCOMING MANIFEST" ? "#8647D3" : "#A985D4"}
          />
          <Text
            style={[
              styles.navText,
              currentTab === "INCOMING MANIFEST" && styles.navTextActive,
            ]}
          >
            Incoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleTabChange("PAYMENT PENDING")}
          style={styles.navItem}
        >
          <MaterialIcons
            name="pending-actions"
            size={24}
            color={currentTab === "PAYMENT PENDING" ? "#8647D3" : "#A985D4"}
          />
          <Text
            style={[
              styles.navText,
              currentTab === "PAYMENT PENDING" && styles.navTextActive,
            ]}
          >
            Pending
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleTabChange("PAYMENT DONE")}
          style={styles.navItem}
        >
          <Ionicons
            name="checkmark-done-circle"
            size={24}
            color={currentTab === "PAYMENT DONE" ? "#8647D3" : "#A985D4"}
          />
          <Text
            style={[
              styles.navText,
              currentTab === "PAYMENT DONE" && styles.navTextActive,
            ]}
          >
            Done
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
          ) : null}
          {/*
           */}
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
    height: 70, // Slightly reduced height to fit text better, adjust as needed
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    bottom: 0,
    left: 0,
    right: 0,
    // Add some visual flair
    borderTopLeftRadius: 20, // Rounded top-left corner
    borderTopRightRadius: 20, // Rounded top-right corner
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -3, // Shadow pointing upwards
    },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10, // For Android shadow
    paddingHorizontal: 10, // Add some horizontal padding
    zIndex: 20,
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1, // Distribute space evenly
    paddingVertical: 8, // Padding for better touch target
  },
  navText: {
    fontSize: 12, // Smaller font size for labels
    marginTop: 4, // Space between icon and text
    color: "#A985D4", // Default text color
    fontWeight: "bold",
  },
  navTextActive: {
    color: "#8647D3", // Active text color
  },
});
