import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Picker } from "@react-native-picker/picker"; // Ensure you are using the correct Picker library
import apiURLs from "../../utility/googlescreen/apiURLs";
import { Linking } from "react-native";
import { useNavigation } from "@react-navigation/native";

const Allshipments = ({ userData: initialData, pickupPersons }) => {
  
    const [userData, setUserData] = useState(initialData);
  const navigation = useNavigation();

  const parsePickupDateTime = (dateTimeString) => {
    const [datePart, timePart] = dateTimeString.split("&"); // Split date and time
    const [year, month, day] = datePart.split("-"); // Get year, month, day
    const [hour, minute] = timePart.split(" ")[0].split(":"); // Get hour and minute

    // Convert hour to 24-hour format if it's PM
    const isPM = timePart.includes("PM") && hour !== "12";
    const adjustedHour = isPM ? parseInt(hour, 10) + 12 : hour;
    const date = new Date(year, month - 1, day, adjustedHour, minute || 0); // Create Date object
    return date;
  };

  const API_URL = apiURLs.sheety;

  const handleOpenMap = (latitude, longitude) => {
    const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
    Linking.openURL(url).catch((err) =>
      console.error("Failed to open URL:", err)
    );
  };

  const makeCall = (number) => {
    Linking.openURL(`tel:+91${number}`); // Replace with the desired Indian phone number
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

  const handleCardPress = (awbNumber) => {
    // Handle card press action
    console.log(awbNumber);
    navigation.navigate("CardDetails", { awbnumber: awbNumber });
  };

  return (
    <View>
      {userData.length === 0 ? (
        <View style={styles.noPickups}>
          <Text style={styles.noPickupsText}>No pickups available</Text>
        </View>
      ) : (
        userData?.map((user, index) => (
            <View
            // onPress={( ) =>  handleCardPress(user.awbNumber)}
            >
              <View style={styles.card} key={index}>
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
  
                {/* Wrap all text inside <Text> */}
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
                  <Text style={styles.label}>Weight APX:</Text>
                  <Text style={styles.value}>{user.weightapx || "N/A"}</Text>
                </View>
                <View style={styles.infoRow}>
                <Text style={styles.label}>Pickup Area</Text>
                <Text style={styles.value}>{user.pickuparea || "N/A"}</Text>
              </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Pickup DateTime:</Text>
                  <Text style={styles.value}>{user.pickupDatetime || "N/A"}</Text>
                </View>
                <View style={styles.infoRow}>
                <TouchableOpacity
                    style={styles.status}
                  >
                    <Text style={styles.statustext}>{user.status}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.mapButton}
                    onPress={() => makeCall(user.consignorphonenumber)}
                  >
                    <Text style={styles.mapButtonText}>Call</Text>
                  </TouchableOpacity>
                 
                  <TouchableOpacity
                    style={styles.mapButton}
                    onPress={() => handleCardPress(user.awbNumber)}
                  >
                    <Text style={styles.mapButtonText}>Details</Text>
                  </TouchableOpacity>
                </View>
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
    borderWidth: 1, // Adds border width
    borderColor: "#D1D5DB", // Sets the color of the border
    borderRadius: 10, // Adds rounded corners to the border
    padding: 10,
    marginBottom: 30,
  },
  statusContainer: {
    marginBottom: 12,
  },
  statusBadge: {
    paddingVertical: 6,
    display: "flex",
    justifyContent: "space-between",
    flexDirection: "row",
    paddingHorizontal: 12,
    backgroundColor: "#E2E8F0", // Light gray background for default status
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
  status: {
    color:"black",
    paddingVertical: 10, // Adjusted padding for button
    paddingHorizontal: 16,
    borderRadius: 20, // Rounded button corners
  },
  mapButton: {
    backgroundColor: "#6D28D9", // Updated color for map button
    paddingVertical: 10, // Adjusted padding for button
    paddingHorizontal: 16,
    borderRadius: 20, // Rounded button corners
  },
  statustext: {
    color: "red",
    fontWeight: "600", // Added font weight for button text
    fontSize: 16, // Added font size for button text
  },
  mapButtonText: {
    color: "#FFFFFF",
    fontWeight: "600", // Added font weight for button text
    fontSize: 16, // Added font size for button text
  },
});

export default Allshipments;





























