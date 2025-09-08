import axios from "axios";
import { Linking } from "react-native";

function convertToTimeOnly(timestamp) {
  let date;

  if (typeof timestamp === "object" && "seconds" in timestamp) {
    date = new Date(
      timestamp.seconds * 1000 + Math.floor(timestamp.nanoseconds / 1e6)
    );
  } else {
    date = new Date(timestamp);
  }

  if (isNaN(date)) {
    return "Invalid Date Format";
  }

  let hours = date.getHours();
  let minutes = date.getMinutes();

  const meridiem = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12; // 0 → 12, 13 → 1

  const formattedHour = hours < 10 ? `0${hours}` : `${hours}`;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;

  return `${formattedHour}:${formattedMinutes} ${meridiem}`;
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

async function sendWaMessage_PickupCompleted(
  consignorname,
  awbNumber,
  consignorphonenumber,
  awbHashedValue
) {
  const url = "https://public.doubletick.io/whatsapp/message/template";

  const data = {
    messages: [
      {
        content: {
          language: "en",
          templateData: {
            body: {
              placeholders: [consignorname, awbNumber],
            },
            buttons: [
              {
                type: "URL",
                parameter: awbNumber,
              },
              {
                type: "URL",
                parameter: awbHashedValue,
              },
            ],
          },
          templateName: "pickupcompleted_test",
        },
        from: "+919600690881",
        to: `+91${consignorphonenumber}`,
      },
    ],
  };

  const headers = {
    Authorization: "key_z6hIuLo8GC",
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  axios
    .post(url, data, { headers })
    .then((response) => {
      console.log("✅ Message sent:", response.data);
    })
    .catch((error) => {
      console.error(
        "❌ Error sending message:",
        error.response ? error.response.data : error.message
      );
    });
}

export default {
  convertToTimeOnly: convertToTimeOnly,
  handleOpenMap: handleOpenMap,
  makeCall: makeCall,
  sendWaMessage_PickupCompleted: sendWaMessage_PickupCompleted,
};