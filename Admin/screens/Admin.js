import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import axios from "axios";
import apiURLs from "../../utility/googlescreen/apiURLs";
import { useEffect, useState } from "react";
import Runsheet from "./Runsheet";

export default function Admin() {
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState([]);
  const [error, setError] = useState("");
  const [userRole, setUserRole] = useState(null);
  const [assignments, setAssignments] = useState({});
  const API_URL = apiURLs.sheetDB;
  const sheetyDB_API_URL = apiURLs.sheety;
  const pickupPersons = ["Unassigned", "anish", "sathish"];

  // Fetch assignments from Google Sheets
  const fetchAssignments = async () => {
    try {
      const result = await axios.get(API_URL);
      const assignmentsData = result.data.reduce((acc, item) => {
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
        setUserData(result.data);
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

  // Filter data based on STATUS "RUN SHEET"
  const currentItems = userData.filter((user) => user.STATUS === "RUN SHEET");

  console.log(currentItems);

  return (
    <View style={styles.container}>
    
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <Runsheet userData={currentItems} pickupPersons={pickupPersons} />
      )}
    </View>
  );
}

// Styles for the component
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginTop: 10,
  },

  // nav: {
  //   backgroundColor: "white",
  //   position: "absolute",
  //   height: 80,
  //   display: "flex",
  //   flexDirection: "row",
  //   justifyContent: "space-between",
  //   alignItems: "center",
  //   bottom: 0,
  //   zIndex: 10,
  //   borderBottomLeftRadius: 0,
  //   borderBottomRightRadius: 0,
  //   left: 0,
  //   right: 0,
  // },

});