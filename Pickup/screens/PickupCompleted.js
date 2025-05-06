import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { db } from "../../FirebaseConfig";
import DB from "../../Utility/DB";
import { collection, onSnapshot } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
// Removed Picker import since it is commented out

const PickupCompleted = ({ tofilterDate }) => {
  const [userData, setUserData] = useState([]);
  const [userName, setUserName] = useState("");
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
    try {
      const unsubscribe = onSnapshot(
        collection(db, DB.db_collection),
        (querySnapshot) => {
          const filteredAndSortedData = querySnapshot.docs
            .map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }))
            .filter(
              (item) =>
                [
                  "INCOMING MANIFEST",
                  "PAYMENT PENDING",
                  "PAYMENT REQUESTED",
                  "PAYMENT DONE",
                  "SHIPMENT CONNECTED",
                ].includes(item.status) &&
                item.pickUpPersonName?.toLowerCase() === userName &&
                item.pickupDatetime?.includes(tofilterDate)
            )
            .sort((a, b) => {
              const dateA = parsePickupDate(a.pickupDatetime);
              const dateB = parsePickupDate(b.pickupDatetime);
              return dateA - dateB;
            });

          setUserData(filteredAndSortedData);
        },
        (error) => {
          setError(`Error: ${error.message}`);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (error) {
      console.log("error", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tofilterDate, userName]);

  return (
    <View>
      {userData.length === 0 ? (
        <View style={styles.noPickups}>
          <Text style={styles.noPickupsText}>No pickups available</Text>
        </View>
      ) : (
        userData.map((user, index) => (
          <TouchableOpacity
            key={index}
            style={styles.card}
            onPress={() => handleCardPress(user.AWB_NUMBER)}
          >
            <View style={styles.statusContainer}>
              <View
                style={[
                  styles.statusBadge,
                  user.STATUS === "PENDING"
                    ? styles.statusPending
                    : user.STATUS === "COMPLETED"
                    ? styles.statusCompleted
                    : styles.statusDefault,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    user.STATUS === "PENDING"
                      ? styles.textPending
                      : user.STATUS === "COMPLETED"
                      ? styles.textCompleted
                      : styles.textDefault,
                  ]}
                >
                  PICKUP COMPLETED
                </Text>
                <Text
                  style={{ color: "green", fontWeight: "700", fontSize: 17 }}
                >
                  {user.pickuparea}
                </Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>AWB No:</Text>
              <Text style={styles.value}>{user.awbNumber || "N/A"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Consignor:</Text>
              <Text style={styles.value}>{user.consignorname || "N/A"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Destination</Text>
              <Text style={styles.value}>{user.destination || "N/A"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Post Pickup Weight:</Text>
              <Text style={styles.value}>{user.postPickupWeight || "N/A"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Pickup Completed:</Text>
              <Text style={styles.value}>
                {user.pickupCompletedDatatime || "N/A"}
              </Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  noPickups: {
    alignItems: "center",
    padding: 16,
  },
  noPickupsText: {
    color: "#6C757D", // Adjusted color for better visibility
    fontSize: 16, // Added font size for better readability
  },
  card: {
    backgroundColor: "#FFFFFF", // Updated color for a cleaner look
    borderRadius: 10, // Adjusted border radius for modern look
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000000",
    shadowOpacity: 0.4, // Increased shadow opacity for better depth
    shadowRadius: 1,
    elevation: 2,
  },
  statusContainer: {
    marginBottom: 12,
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20, // Updated border radius for a rounded badge
  },
  statusPending: {
    backgroundColor: "#FEE2E2", // Light red background for pending status
  },
  statusCompleted: {
    backgroundColor: "#D1FAE5", // Light green background for completed status
  },
  statusDefault: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#E2E8F0", // Light gray background for default status
  },
  statusText: {
    fontWeight: "bold",
    fontSize: 14, // Added font size for status text
  },
  textPending: {
    color: "#B91C1C", // Dark red color for pending status
  },
  textCompleted: {
    color: "#065F46", // Dark green color for completed status
  },
  textDefault: {
    color: "#1F2937", // Dark gray color for default status
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10, // Increased margin for better spacing
  },
  label: {
    fontWeight: "600", // Updated font weight for labels
    color: "#4B5563", // Updated color for labels
    fontSize: 16, // Updated font size for labels
  },
  value: {
    color: "#1F2937", // Updated color for values
    fontSize: 16, // Updated font size for values
  },
  picker: {
    height: 50,
    width: 150,
  },
  mapButton: {
    backgroundColor: "#6D28D9", // Updated color for map button
    paddingVertical: 10, // Adjusted padding for button
    paddingHorizontal: 16,
    borderRadius: 20, // Rounded button corners
  },
  mapButtonText: {
    color: "#FFFFFF",
    fontWeight: "600", // Added font weight for button text
    fontSize: 16, // Added font size for button text
  },
});

export default PickupCompleted;
