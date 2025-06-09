import { Linking } from "react-native";

function convertToTimeOnly(input) {
  const timePart = input.split("&")[1].trim().toUpperCase(); // "9 PM"

  const [hourStr, meridiem] = timePart.split(" ");
  let hour = parseInt(hourStr, 10);
  let minutes = "00";

  if (meridiem === "AM" || meridiem === "PM") {
    const formattedHour = hour < 10 ? `0${hour}` : `${hour}`;
    return `${formattedHour}:${minutes} ${meridiem}`;
  } else {
    return "Invalid Time Format";
  }
}

const handleOpenMap = (
  latitude,
  longitude,
  awbNumber,
  docId,
  consignorphonenumber,
  pickupDatetime,
  pickUpPersonName,
  OtpVerified,
  navigation
) => {
  if (OtpVerified == true) {
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
};

const makeCall = (number) => {
  Linking.openURL(`tel:+91${number}`); // Replace with the desired Indian phone number
};

export default {
  convertToTimeOnly: convertToTimeOnly,
  handleOpenMap: handleOpenMap,
  makeCall: makeCall,
};
