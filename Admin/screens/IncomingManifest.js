import { useNavigation } from "@react-navigation/native";
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from "react-native";
import { db } from "../../FirebaseConfig";
import DB from "../../Utility/DB";
import SwipeToConfirm from "./SwipeToConfirm";
import axios from "axios";

const Runsheet = ({ datetime, awbnumberSearch, FromNumber }) => {
  const [userData, setuserData] = useState([]);

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

  const fetchData = () => {
    // Create a query to filter documents where status is "INCOMING MANIFEST"
    const q = query(
      collection(db, DB.db_collection),
      where("status", "==", "INCOMING MANIFEST") // Add condition to filter by status
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const sortedData = querySnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((data) => data.pickupDatetime?.startsWith(datetime))
          .filter((data) => {
            // If the awbnumber is empty, return all data without filtering by awbNumber
            if (awbnumberSearch === "") {
              return true; // This will return all data
            }
            // Otherwise, filter by awbnumber
            return String(data.awbNumber || "").startsWith(awbnumberSearch);
          })
          .filter((data) => {
            // If the awbnumber is empty, return all data without filtering by awbNumber
            if (FromNumber === "") {
              return true; // This will return all data
            }
            // Otherwise, filter by awbnumber
            return String(data.consignorphonenumber || "").startsWith(
              FromNumber
            );
          })
          .sort((a, b) => {
            const dateA = parseDateTime(a.pickupDatetime);
            const dateB = parseDateTime(b.pickupDatetime);
            return dateB - dateA; // Ascending
          }); // Filter based on status; // Map through documents to get data
        setuserData(sortedData);
        // You can call a function here if needed
        // fetchAssignments(); // Fetch assignments
      },
      (error) => {
        console.error("Error fetching documents:", error);
      }
    );

    // Cleanup the listener on component unmount
    return () => unsubscribe();
  };

  useEffect(() => {
    fetchData(); // Fetch data initially
  }, [datetime, awbnumberSearch, FromNumber]);

  const navigation = useNavigation();

  const handleCardPress = (awbNumber) => {
    console.log("CardDetails", awbNumber);
    // Handle card press action
    navigation.navigate("IncomingManifestDetails", { awbnumber: awbNumber });
  };

  const CardDetails = (awbNumber) => {
    // Handle card press action
    navigation.navigate("CardDetails", { awbnumber: awbNumber });
  };

  const makeCall = (number) => {
    Linking.openURL(`tel:+91${number}`); // Replace with the desired Indian phone number
  };

  async function sendPickupArrivedMessage(
    consignorname,
    awb_number,
    consignorphonenumber
  ) {
    console.log(consignorname, awb_number, consignorphonenumber);
    try {
      const q = query(
        collection(db, DB.db_collection),
        where("awbNumber", "==", Number(awb_number))
      );
      const querySnapshot = await getDocs(q);
      let final_result = [];
      querySnapshot.forEach((doc) => {
        final_result.push({ id: doc.id, ...doc.data() });
      });
      console.log(final_result);

      const docRef = doc(db, DB.db_collection, final_result[0].id);
      await updateDoc(docRef, {
        WHReached: true,
      });
      const response = await axios.post(
        "https://public.doubletick.io/whatsapp/message/template",
        {
          messages: [
            {
              content: {
                language: "en_US",
                templateName: "pickuparrivedatwarehouseffinal",
                templateData: {
                  body: {
                    placeholders: [consignorname],
                  },
                  buttons: [
                    {
                      type: "URL",
                      parameter: awb_number, // Replace with dynamic AWB if needed
                    },
                  ],
                },
              },
              from: "+919600690881",
              to: `+91${consignorphonenumber}`,
            },
          ],
        },
        {
          headers: {
            Authorization: "key_z6hIuLo8GC",
            accept: "application/json",
            "content-type": "application/json",
          },
        }
      );

      console.log("✅ Response:", response.data);
    } catch (error) {
      console.error("❌ Error:", error.response?.data || error.message);
    }
  }

  return (
    <View>
      {userData.length === 0 ? (
        <View style={styles.noPickups}>
          <Text style={styles.noPickupsText}>No pickups available</Text>
        </View>
      ) : (
        userData.map((user, index) => (
          <View style={styles.card}>
            <TouchableOpacity
              key={index}
              // style={styles.card}
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
                    WAREHOUSE
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
                <Text style={styles.label}>Destination:</Text>
                <Text style={styles.value}>{user.destination || "N/A"}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Post Pickup Weight:</Text>
                <Text style={styles.value}>
                  {user.postPickupWeight || "N/A"}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Pickup Datetime:</Text>
                <Text style={styles.value}>{user.pickupDatetime || "N/A"}</Text>
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
            {/* user.City */}
            {["Pondy", "Coimbatore", "Others"].includes(user.City) && (
              <SwipeToConfirm
                onSwipe={() => {
                  sendPickupArrivedMessage(
                    user.consignorname,
                    String(user.awbNumber),
                    user.consignorphonenumber
                  );
                }}
                confirmed={user.WHReached}
              />
            )}
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
    marginBottom: 20,
    position: "relative",
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
    alignSelf: "flex-start",
    borderRadius: 20, // Rounded button corners
  },
  mapButtonText: {
    color: "#FFFFFF",
    fontWeight: "600", // Added font weight for button text
    fontSize: 16, // Added font size for button text
  },
});

export default Runsheet;
