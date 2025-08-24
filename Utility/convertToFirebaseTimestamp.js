import { Timestamp } from "firebase/firestore";

function convertToFirebaseTimestamp(dateString) {
  const [datePart, timePartRaw] = dateString.split("&");
  if (!datePart || !timePartRaw) {
    throw new Error("Invalid format. Expected 'DD-MM-YYYY &h:mm AM/PM'");
  }

  const [day, month, year] = datePart.trim().split("-").map(Number);

  const [timePart, meridian] = timePartRaw.trim().split(" ");
  let [hours, minutes] = timePart.split(":").map(Number);
  minutes = minutes || 0;

  if (meridian.toUpperCase() === "PM" && hours !== 12) hours += 12;
  if (meridian.toUpperCase() === "AM" && hours === 12) hours = 0;

  const jsDate = new Date(year, month - 1, day, hours, minutes);

  return Timestamp.fromDate(jsDate);
}

export default convertToFirebaseTimestamp;