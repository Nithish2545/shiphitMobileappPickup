import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../FirebaseConfig";
import DB from "../../Utility/DB";

const PickupCompleted = () => {
  const [userData, setUserData] = useState([]);
  const [loading, setLoading] = useState(true); // 👈 new loading state

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
    async function fetchRunsheetData() {
      const filterByScreenName = [
        "INCOMING MANIFEST",
        "PAYMENT PENDING",
        "PAYMENT REQUESTED",
        "PAYMENT DONE",
        "SHIPMENT CONNECTED",
      ];

      try {
        let PeName;
        try {
          PeName = await fetchData();
          console.log("PeName", PeName);
        } catch (error) {
          console.log("Fetch error:", error);
          setLoading(false);
          return;
        }

        unsubscribe = onSnapshot(
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
            setLoading(false); // 👈 done loading
          },
          (error) => {
            console.log("Snapshot error:", error);
            setLoading(false);
          }
        );
      } catch (error) {
        console.log("Unexpected error:", error);
        setLoading(false);
      }
    }

    fetchRunsheetData();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#6D28D9" />
          <Text style={styles.loadingText}>Loading pickups...</Text>
        </View>
      ) : userData?.length === 0 ? (
        <View style={styles.noPickups}>
          <Text style={styles.noPickupsText}>No pickups available</Text>
        </View>
      ) : (
        userData.map((user, index) => (
          <View key={index} style={styles.card}>
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
                  style={{
                    color: "green",
                    fontWeight: "700",
                    fontSize: 17,
                    marginTop: 4,
                  }}
                >
                  {user.pickuparea || "N/A"}
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
              <Text style={styles.value}>{user.postPickupWeight || "N/A"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Pickup Completed:</Text>
              <Text style={styles.value}>
                {user.pickupCompletedDatatime || "N/A"}
              </Text>
            </View>
          </View>
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
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
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
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  statusContainer: {
    marginBottom: 12,
  },
  statusBadge: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    fontSize: 16,
  },
  value: {
    color: "#1F2937",
    fontSize: 16,
    flexShrink: 1,
    textAlign: "right",
  },
});

export default PickupCompleted;