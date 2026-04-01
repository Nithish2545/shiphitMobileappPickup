import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Linking } from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../../FirebaseConfig";
import RescheduleModel from "./RescheduleModel";
import axios from "axios";
import DB from "../../Utility/DB";
import NotificationService from "../../Utility/NotificationService";
import utility from "../../Utility/utility";
import formatFirestoreTimestamp from "../../Utility/formatFirestoreTimestamp";
const Runsheet = ({ pickupPersons, datetime, awbnumberSearch, FromNumber }) => {
  const [userData, setUserData] = useState([]);
  const navigation = useNavigation();
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedHour, setSelectedHour] = useState("1");
  const [selectedPeriod, setSelectedPeriod] = useState("AM");
  const [selectedDate, setSelectedDate] = useState(null);
  const [awbnumber, setawbnumber] = useState();

  function toggleModal(awbNumber) {
    setawbnumber(awbNumber);
    if (isModalVisible == false) {
      setSelectedHour("1");
      setSelectedPeriod("AM");
      setSelectedDate(null);
    }
    setModalVisible(!isModalVisible);
  }

  async function PEassigned(PEname, pickupDatetime, consignorphonenumber) {
    const options = {
      method: "POST",
      url: "https://public.doubletick.io/whatsapp/message/template",
      headers: {
        Authorization: "key_z6hIuLo8GC",
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      data: {
        messages: [
          {
            content: {
              language: "en",
              templateData: {
                body: {
                  placeholders: [PEname, pickupDatetime, "+91 9597788433"],
                },
              },
              templateName: "peassigningtest2",
            },
            to: `+91${consignorphonenumber}`,
            from: `+919600690881`,
          },
        ],
      },
    };

    axios
      .request(options)
      .then((response) => {
        console.log("Success:", response.data);
      })
      .catch((error) => {
        console.error("Error:", error.response?.data || error.message);
      });
  }

  const fetchData = () => {
    let startTimestamp = null;
    let endTimestamp = null;

    if (datetime) {
      const dateObj = new Date(datetime);
      const startDate = new Date(dateObj.setHours(0, 0, 0, 0));
      const endDate = new Date(dateObj.setHours(23, 59, 59, 999));
      startTimestamp = Timestamp.fromDate(startDate);
      endTimestamp = Timestamp.fromDate(endDate);
    } else {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      const today = new Date();
      const endOfToday = new Date(today.setHours(23, 59, 59, 999));

      startTimestamp = Timestamp.fromDate(oneMonthAgo);
      endTimestamp = Timestamp.fromDate(endOfToday);
    }

    let q;
    if (datetime) {
      q = query(
        collection(db, DB.db_collection),
        where("pickupDatetime", ">=", startTimestamp),
        where("pickupDatetime", "<=", endTimestamp),
        orderBy("pickupDatetime", "desc"),
      );
    } else {
      q = query(
        collection(db, DB.db_collection),
        where("pickupDatetime", ">=", startTimestamp),
        where("pickupDatetime", "<=", endTimestamp), // ✅ added
        orderBy("pickupDatetime", "desc"),
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const sortedData = querySnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((data) => {
            if (awbnumber === "") return true;
            return String(data.awbNumber || "").startsWith(awbnumberSearch);
          })
          .filter((data) => {
            if (FromNumber === "") return true;
            return String(data.consignorphonenumber || "").startsWith(
              FromNumber,
            );
          })
          .filter((data) => data.status === "RUN SHEET");

        setUserData(sortedData);
      },
      (error) => {
        console.error(`Error fetching data: ${error.message}`);
      },
    );

    return () => unsubscribe();
  };

  useEffect(() => {
    fetchData(); // Fetch data initially
  }, [datetime, awbnumberSearch, FromNumber]);

  const makeCall = (number) => {
    Linking.openURL(`tel:+91${number}`); // Replace with the desired Indian phone number
  };

  const handleAssignmentChange = async (
    awbNumber,
    pickupPerson,
    pickupDatetime,
    consignorphonenumber,
    consignorname,
    pickuparea,
  ) => {
    if (pickupPerson == "Unassigned") {
      return;
    }
    try {
      const q = query(
        collection(db, DB.db_collection),
        where("awbNumber", "==", awbNumber),
      );

      const querySnapshot = await getDocs(q);
      let final_result = [];

      querySnapshot.forEach((doc) => {
        final_result.push({ id: doc.id, ...doc.data() });
      });

      const docRef = doc(db, DB.db_collection, final_result[0].id);
      const Hour_min = utility.convertToTimeOnly(pickupDatetime);

      const pickupPersonCaps =
        pickupPerson.charAt(0).toUpperCase() + pickupPerson.slice(1);

      await updateDoc(docRef, {
        pickUpPersonName: pickupPerson,
      });

      await PEassigned(
        pickupPersonCaps,
        Hour_min,
        String(consignorphonenumber),
      );

      await NotificationService.sendNotification(
        pickupPerson,
        consignorname,
        pickuparea,
        pickupDatetime,
      );
    } catch (error) {
      console.error("Error updating document:", error);
    }
  };

  const handleCardPress = (awbNumber) => {
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
          <View>
            <View style={styles.card} key={user.awbNumber}>
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
                    {user.pickuparea.length > 14
                      ? `${user.pickuparea.slice(0, 14)}...`
                      : user.pickuparea}
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
                <Text style={styles.label}>Pickup Person:</Text>
                <Picker
                  selectedValue={user.pickUpPersonName || ""}
                  style={styles.picker}
                  enabled={
                    user.pickUpPersonName == "Unassigned" ||
                    user.pickUpPersonName == ""
                      ? true
                      : false
                  }
                  onValueChange={(pickupPerson) =>
                    handleAssignmentChange(
                      user.awbNumber,
                      pickupPerson,
                      user.pickupDatetime,
                      user.consignorphonenumber,
                      user.consignorname,
                      user.pickuparea,
                    )
                  }
                >
                  {pickupPersons?.map((person, index) => (
                    <Picker.Item key={index} label={person} value={person} />
                  ))}
                </Picker>
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
                <Text style={styles.label}>Pickup DateTime:</Text>
                <Text style={styles.value}>
                  {formatFirestoreTimestamp(user?.pickupDatetime) || "N/A"}
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
                  style={styles.mapButton}
                  onPress={() => handleCardPress(user.awbNumber)}
                >
                  <Text style={styles.mapButtonText}>Details</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    backgroundColor: "red",
                    borderRadius: 30,
                    paddingHorizontal: 10,
                    justifyContent: "center",
                    alignContent: "center",
                  }}
                  onPress={() => toggleModal(user.awbNumber)}
                >
                  <Text style={styles.mapButtonText}>Reschedule</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))
      )}
      <RescheduleModel
        isModalVisible={isModalVisible}
        setModalVisible={setModalVisible}
        selectedHour={selectedHour}
        setSelectedHour={setSelectedHour}
        selectedPeriod={selectedPeriod}
        setSelectedPeriod={setSelectedPeriod}
        toggleModal={toggleModal}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        awbNumber={awbnumber}
      />
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
