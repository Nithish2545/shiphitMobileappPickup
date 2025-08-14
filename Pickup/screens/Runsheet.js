import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import utility from "../../Utility/utility";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { db } from "../../FirebaseConfig";
import { collection, onSnapshot } from "firebase/firestore";
import DB from "../../Utility/DB";

const Runsheet = () => {
  const [userData, setUserData] = useState([]);
  const navigation = useNavigation();
  const handleCardPress = (awbNumber, OtpVerified) => {
    if (OtpVerified) {
      navigation.navigate("PickupDetails", { awbnumber: awbNumber });
      return;
    }
    Alert.alert(
      "Action Required",
      "Please verify your OTP before submitting pickup details."
    );
  };

  const fetchData = async () => {
    try {
      const local_S_userData = await AsyncStorage.getItem("userData");
      if (local_S_userData) {
        return JSON.parse(local_S_userData).name;
      } else {
        console.log("No data found for key 'userData'");
      }
    } catch (e) {
      console.error("Failed to load data from AsyncStorage", e);
    }
  };

  useEffect(() => {
    let unsubscribe;
    async function fetch() {
      const filterByScreenName = ["RUN SHEET"];

      try {
        let PeName;
        try {
          PeName = await fetchData(); // simplified and cleaner
          console.log("PeName", PeName);
        } catch (error) {
          console.log("Fetch error:", error);
          return;
        }

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
                  filterByScreenName.includes(item.status) &&
                  item.pickUpPersonName?.toLowerCase() === PeName?.toLowerCase()
              );
            setUserData(filteredAndSortedData);
          },
          (error) => {
            console.log("Snapshot error:", error);
          }
        );

        return unsubscribe; // For cleanup if needed
      } catch (error) {
        console.log("Unexpected error:", error);
      }
    }
    fetch();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {userData.length === 0 ? (
        <View style={styles.noPickups}>
          <Text style={styles.noPickupsText}>No pickups available</Text>
        </View>
      ) : (
        userData.map((user, index) => (
          <TouchableOpacity
            key={index}
            style={styles.card}
            onPress={() => handleCardPress(user.awbNumber, user.OtpVerified)}
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
                <Text style={styles.pickupAreaText}>
                  {user.pickuparea || "N/A"}
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
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.mapButton}
                onPress={() => utility.makeCall(user.consignorphonenumber)}
              >
                <Text style={styles.mapButtonText}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.mapButton,
                  user.OtpVerified && styles.disabledButton,
                ]}
                disabled={user.OtpVerified}
                onPress={() =>
                  utility.handleOpenMap(
                    user.latitude,
                    user.longitude,
                    user.awbNumber,
                    user.id,
                    user.consignorphonenumber,
                    user.pickupDatetime,
                    user.pickUpPersonName,
                    user.OtpVerified,
                    navigation
                  )
                }
              >
                <Text style={styles.mapButtonText}>View on Map</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
  },
  loaderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#6D28D9",
  },
  noPickups: {
    alignItems: "center",
    padding: 16,
  },
  noPickupsText: {
    color: "#6C757D",
    fontSize: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
  },
  statusContainer: {
    marginBottom: 12,
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pickupAreaText: {
    color: "green",
    fontWeight: "700",
    fontSize: 16,
  },
  statusPending: {
    backgroundColor: "#FEE2E2",
  },
  statusCompleted: {
    backgroundColor: "#D1FAE5",
  },
  statusDefault: {
    backgroundColor: "#E2E8F0",
  },
  statusText: {
    fontWeight: "bold",
    fontSize: 14,
    marginRight: 8,
  },
  textPending: {
    color: "#B91C1C",
  },
  textCompleted: {
    color: "#065F46",
  },
  textDefault: {
    color: "#1F2937",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  label: {
    fontWeight: "600",
    color: "#4B5563",
    fontSize: 15,
  },
  value: {
    color: "#1F2937",
    fontSize: 15,
  },
  conLocation: {
    color: "#1F2937",
    fontSize: 15,
    width: "70%",
    textAlign: "right",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  mapButton: {
    backgroundColor: "#6D28D9",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  mapButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  disabledButton: {
    backgroundColor: "#ccc",
    opacity: 0.6,
  },
});

export default Runsheet;
