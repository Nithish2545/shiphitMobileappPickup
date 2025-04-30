import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../FirebaseConfig";
import DB from "../../Utility/DB";

const Runsheet = ({ tofilterDate }) => {
  const [userData, setUserData] = useState([]);

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
      collection(db, DB.db_collection),
      (querySnapshot) => {
        const filteredAndSortedData = querySnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter(
            (item) =>
              item.status === "RUN SHEET" &&
              item.pickUpPersonName?.toLowerCase() === "sathish" &&
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
  };

  useEffect(() => {
    fetchData();
  }, [tofilterDate]);

  const navigation = useNavigation(); // Use useNavigation hook to access navigation

  const handleCardPress = (awbNumber) => {
    if (userData[0].OtpVerified == true) {
      navigation.navigate("PickupDetails", { awbnumber: awbNumber });
      return;
    }
    Alert.alert(
      "OTP not verified. Please follow the instructions and the required flow"
    );
    // Navigate to PickupDetails screen with AWB number as a parameter
  };

  const handleOpenMap = (
    latitude,
    longitude,
    awbNumber,
    docId,
    consignorphonenumber,
    pickupDatetime,
    pickUpPersonName
  ) => {
    if (userData[0].OtpVerified == true) {
      return;
    }
    navigation.navigate("RealTimeNavigation", {
      latitude: latitude,
      longitude: longitude,
      awbnumber: awbNumber,
      docId: docId,
      consignorphonenumber: consignorphonenumber,
      pickupDatetime: pickupDatetime,
      pickUpPersonName: pickUpPersonName,
    });
    // const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
    // Linking.openURL(url).catch((err) =>
    //   console.error("Failed to open URL:", err)
    // );
  };

  const makeCall = (number) => {
    Linking.openURL(`tel:+91${number}`); // Replace with the desired Indian phone number
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
                  RUN SHEET
                </Text>
                <Text
                  style={{ color: "green", fontWeight: "700", fontSize: 17 }}
                >
                  {user.pickuparea}
                </Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>AWB Number:</Text>
              <Text style={styles.value}>{user.awbNumber || "N/A"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Consignor:</Text>
              <Text style={styles.value}>{user.consignorname || "N/A"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Country:</Text>
              <Text style={styles.value}>{user.destination || "N/A"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Weight APX:</Text>
              <Text style={styles.value}>{user.weightapx || "N/A"}</Text>
            </View>
            {/* <View style={styles.infoRow}>
              <Text style={styles.label}>Phone number:</Text>
              <Text style={styles.value}>{user.consignorphonenumber || "N/A"}</Text>
            </View> */}
            <View style={styles.infoRow}>
              <Text style={styles.label}>Pickup DateTime:</Text>
              <Text style={styles.value}>{user.pickupDatetime || "N/A"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Pickup Address:</Text>
              <Text style={styles.conLocation}>
                {user.consignorlocation || "N/A"}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <TouchableOpacity
                style={styles.mapButton}
                onPress={() => makeCall(user.consignorphonenumber)}
              >
                <Text style={styles.mapButtonText}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.mapButton,
                  userData[0].OtpVerified && styles.disabledButton, // apply disabled style
                ]}
                disabled={userData[0].OtpVerified} // disable if OTP is verified
                onPress={() =>
                  handleOpenMap(
                    user.latitude,
                    user.longitude,
                    user.awbNumber,
                    user.id,
                    user.consignorphonenumber,
                    user.pickupDatetime,
                    user.pickUpPersonName
                  )
                }
              >
                <Text style={styles.mapButtonText}>View on Map</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  disabledButton: {
    backgroundColor: "#ccc", // greyed out look
    opacity: 0.6,
  },

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
  conLocation: {
    color: "#1F2937", // Updated color for values
    fontSize: 16,
    width: "70%",
    textAlign: "right",
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

export default Runsheet;
