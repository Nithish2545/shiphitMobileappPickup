import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Picker } from "@react-native-picker/picker"; // Ensure you are using the correct Picker library
import apiURLs from "../../utility/googlescreen/apiURLs";

const Runsheet = ({ userData: initialData, pickupPersons }) => {
  const [userData, setUserData] = useState(initialData); 
  const API_URL = apiURLs.sheety;

  const handleCardPress = (awbNumber) => {
    // Handle card press action
  };

  const handleOpenMap = (latitude, longitude) => {
    const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
    window.open(url, "_blank");
  };

  const handleAssignmentChange = async (awbNumber, value, index) => {
    try {
      const response = await fetch(`${API_URL}/${index}`, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sheet1: {
            pickUpPersonName: value,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to update the row. Status: ${response.status}. Error: ${errorText}`
        );
      }

      const data = await response.json();
      console.log("Row updated successfully");

      setUserData((prevData) =>
        prevData.map((user) =>
          user.awbNumber === awbNumber
            ? { ...user, pickUpPersonName: value }
            : user
        )
      );
    } catch (error) {
      console.error("Error updating row:", error);
    }
  };

  return (
    <View>
      {userData.length === 0 ? (
        <View style={styles.noPickups}>
          <Text style={styles.noPickupsText}>No pickups available</Text>
        </View>
      ) : (
        userData.map((user, index) => (
        <View>
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
                  RUN SHEET
                </Text>
              </View>
            </View>

            {/* Wrap all text inside <Text> */}
            <View style={styles.infoRow}>
              <Text style={styles.label}>AWB No:</Text>
              <Text style={styles.value}>{user.awbNumber || "N/A"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Consignee:</Text>
              <Text style={styles.value}>{user.name || "N/A"}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Pickup Person:</Text>
              <Picker
                selectedValue={user.pickUpPersonName || ""}
                style={styles.picker}
                enabled={false}
                onValueChange={(value) =>
                  handleAssignmentChange(user.awbNumber, value, user.id)
                }
              >
                {pickupPersons.map((person, index) => (
                  <Picker.Item key={index} label={person} value={person} />
                ))}
              </Picker>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Country</Text>
              <Text style={styles.value}>{user.destination || "N/A"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Weight APX:</Text>
              <Text style={styles.value}>{user.weightapx || "N/A"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Phone number:</Text>
              <Text style={styles.value}>{user.phonenumber || "N/A"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Pickup DateTime:</Text>
              <Text style={styles.value}>{user.pickupDatetime || "N/A"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Coordinates:</Text>
              <TouchableOpacity
                style={styles.mapButton}
                onPress={() => handleOpenMap(user.latitude, user.longitude)}
              >
                <Text style={styles.mapButtonText}>View on Map</Text>
              </TouchableOpacity>
            </View>
            </View>
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

export default Runsheet;