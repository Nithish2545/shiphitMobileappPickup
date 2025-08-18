import { Alert } from "react-native";

const validateAwbNumber = (awbNumber, selectedVendor) => {
  const awb = awbNumber.trim().toUpperCase();

  // Vendor format rules
  const rules = {
    UPS: /^1ZGX/,
    EXPLUS: /^EX/,
  };

  // ✅ Check if it matches the selected vendor
  if (rules[selectedVendor] && rules[selectedVendor].test(awb)) {
    return true; // valid → no alert
  }

  // ❌ If not, check which vendor it looks like
  for (const vendor in rules) {
    if (rules[vendor].test(awb)) {
      return false;
    }
  }
  return true;
};

export default validateAwbNumber;