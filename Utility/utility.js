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

export default { convertToTimeOnly: convertToTimeOnly };