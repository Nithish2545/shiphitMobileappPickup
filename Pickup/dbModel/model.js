import { collection, onSnapshot } from "firebase/firestore";
import DB from "../../Utility/DB";
import { db } from "../../FirebaseConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";

const parsePickupDate = (pickupDatetime, setUserData) => {
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
const PErunsheet = async (setUserData, screenName, setLoading) => {
  const filterByScreenName =
    screenName === "pickupcompleted"
      ? [
          "INCOMING MANIFEST",
          "PAYMENT PENDING",
          "PAYMENT REQUESTED",
          "PAYMENT DONE",
          "SHIPMENT CONNECTED",
        ]
      : ["RUN SHEET"];

  try {
    setLoading(true); // ✅ Set loading true at the start

    let PeName;
    try {
      PeName = await fetchData(); // simplified and cleaner
    } catch (error) {
      console.log("Fetch error:", error);
      setLoading(false); // In case fetch fails
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
          )
          .sort((a, b) => {
            const dateA = parsePickupDate(a.pickupDatetime);
            const dateB = parsePickupDate(b.pickupDatetime);
            return dateA - dateB;
          });

        setUserData(filteredAndSortedData);
        setLoading(false); // ✅ Done loading after data is set
      },
      (error) => {
        console.log("Snapshot error:", error);
        setLoading(false); // Error while listening
      }
    );

    return unsubscribe; // For cleanup if needed
  } catch (error) {
    console.log("Unexpected error:", error);
    setLoading(false);
  }
};

export default {
  PErunsheet: PErunsheet,
};
