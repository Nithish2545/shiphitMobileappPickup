import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../FirebaseConfig";
// Removed Picker import since it is commented out

const PaymentDone = () => {
  const [userData, setuserData] = useState([]);
  const fetchData = () => {
    const unsubscribe = onSnapshot(
      collection(db, "pickup"),
      (querySnapshot) => {
        // Filter documents where status is "RUN SHEET"
        const sortedData = querySnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() })) // Map through documents to get data
          .filter((data) => data.status === "PAYMENT DONE"); // Filter based on status
        setuserData(sortedData);
        // If you have a function named parsePickupDateTime, call it here
      },
      (error) => {
        console.error(`Error fetching data: ${error.message}`); // Log error if any
      }
    );
    // Cleanup the listener on component unmount
    return () => unsubscribe();
  };

  useEffect(() => {
    fetchData(); // Fetch data initially
  }, []);

  const navigation = useNavigation();

  const handleCardPress = (awbNumber) => {
    // Handle card press action
    navigation.navigate("VendorDetails", { awbnumber: awbNumber });
  };

  const makeCall = (number) => {
    Linking.openURL(`tel:+91${number}`); // Replace with the desired Indian phone number
  };

  const CardDetails = (awbNumber) => {
    // Handle card press action
    navigation.navigate("CardDetails", { awbnumber: awbNumber });
  };

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
            onPress={() => handleCardPress(user.awbNumber)}
          >
            <View style={styles.statusContainer}>
              <View
                style={[
                  styles.statusBadge,
                  user.status === "PENDING"
                    ? styles.statusPending
                    : user.status === "COMPLETED"
                    ? styles.statusCompleted
                    : styles.statusDefault,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    user.status === "PENDING"
                      ? styles.textPending
                      : user.status === "COMPLETED"
                      ? styles.textCompleted
                      : styles.textDefault,
                  ]}
                >
                  PAYMENT DONE
                </Text>
                <Text
                  style={{
                    color: "#6D28D9",
                    textTransform: "uppercase",
                    fontWeight: "700",
                  }}
                >
                  {user.pickupBookedBy}
                </Text>
                <Text style={{ color: "green", fontWeight: "700" }}>
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
              <Text style={styles.label}>Phone number:</Text>
              <Text style={styles.value}>
                {user.consignorphonenumber || "N/A"}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Country</Text>
              <Text style={styles.value}>{user.destination || "N/A"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Final weight:</Text>
              <Text style={styles.value}>
                {user.actualWeight + " " + "KG" || "N/A"}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>PickUp Person:</Text>
              <Text style={styles.value}>{user.pickUpPersonName || "N/A"}</Text>
            </View>

            <View
              style={{
                display: "flex",
                flexDirection: "row",
                gap: 20,
                position: "relative",
              }}
            >
              <TouchableOpacity
                style={styles.mapButton}
                onPress={() => makeCall(user.consignorphonenumber)}
              >
                <Text
                  style={{
                    color: "white",
                    fontSize: 17,
                    alignSelf: "flex-start",
                  }}
                >
                  Call
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.mapButton}
                onPress={() => CardDetails(user.awbNumber)}
              >
                <Text style={styles.mapButtonText}>Details</Text>
              </TouchableOpacity>
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
    borderWidth: 1, // Adds border width
    borderColor: "#D1D5DB", // Sets the color of the border
    borderRadius: 10, // Adds rounded corners to the border
    padding: 10,
    marginBottom: 10,
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

export default PaymentDone;
