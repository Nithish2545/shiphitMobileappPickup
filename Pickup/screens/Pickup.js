import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  RefreshControl, // Import RefreshControl
} from "react-native";
import axios from "axios";
import { useEffect, useState } from "react";
import Runsheet from "./Runsheet";
import apiURLs from "../../utility/googlescreen/apiURLs";
import PickupCompleted from "./PickupCompleted";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FIREBASE_AUTH } from "../../FirebaseConfig";
import { signOut } from "firebase/auth";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function Admin() {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false); // Add refreshing state
  const [userData, setUserData] = useState([]);
  const [error, setError] = useState("");
  const [userRole, setUserRole] = useState(null);
  const [assignments, setAssignments] = useState({});
  const [userName, setUserName] = useState("");
  const API_URL = apiURLs.sheetDB;
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
          console.log(local_S_userData);
        } else {
          console.log("No data found for key 'userData'");
        }
      } catch (e) {
        console.error("Failed to load data from AsyncStorage", e);
      }
    };

    fetchData();
  }, []);

  const fetchAssignments = async () => {
    try {
      const result = await axios.get(API_URL);
      const assignmentsData = result.data.sheet1.reduce((acc, item) => {
        acc[item.awbNumber] = item.pickUpPersonName;
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
          setUserRole(user.role);
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
      }
    };
    fetchUserRole();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await axios.get(API_URL);
      setUserData(result.data.sheet1);
      console.log(result.data.sheet1);
      await fetchAssignments();
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
fetchData()

  }, [])

  // Refresh Handler
  const onRefresh = async () => {
    setRefreshing(true); // Start refreshing
    await fetchData(); // Fetch new data
    setRefreshing(false); // Stop refreshing
  };

  // Filter data based on 
  console.log(userData)
  const currentItems = userData.filter(
    (user) => user.status === "RUN SHEET" && user.pickUpPersonName === userName
  );
  const incomingManifestItems = userData.filter(
    (user) =>
      user.status === "INCOMING MANIFEST" && user.pickUpPersonName === userName
  );

  const handleTabChange = (tab) => {
    setcurrentTab(tab);
  };

  return (
    <View style={styles.container}>
      <View style={styles.signout}>
        <Text
          style={{
            padding: 5,
            backgroundColor: "red",
            color: "white",
            fontWeight: 700,
            alignSelf: "flex-start",
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
    paddingBottom: 100,
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