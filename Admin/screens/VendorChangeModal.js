import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import AntDesign from "@expo/vector-icons/AntDesign";
import validateAwbNumber from "../../Utility/validateAwbNumber";

const VendorChangeModal = ({
  visible,
  onClose,
  onSubmit,
  currentVendor,
  finalsubmit,
  isSubmitting,
  setIsSubmitting,
  vendorAwbnumber,
}) => {
  const [needToChange, setNeedToChange] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(currentVendor || "");

  const handleToggle = () => {
    setNeedToChange(!needToChange);
    setSelectedVendor(currentVendor); // Reset selection to current
  };

  const handleSubmit = async () => {
    const UpperCaseAwbNum = vendorAwbnumber.toUpperCase();
    const finalVendor = needToChange ? selectedVendor : currentVendor;
    if (!validateAwbNumber(UpperCaseAwbNum, finalVendor)) {
      console.log(
        "validateAwbNumber",
        !validateAwbNumber(UpperCaseAwbNum, finalVendor)
      );
      Alert.alert(
        "AWB Format Mismatch",
        "This AWB number format matches a different vendor."
      );
      return;
    }
    setIsSubmitting(true);
    await finalsubmit(finalVendor);
    setNeedToChange(false);
    onClose();
  };

  return (
    <Modal animationType="fade" transparent visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <AntDesign name="close" size={22} color="#374151" />
          </TouchableOpacity>

          {/* Title */}
          <Text style={styles.title}>Vendor Details</Text>

          {/* Current Vendor */}
          <Text style={styles.currentVendorText}>
            Current Vendor:{" "}
            <Text style={styles.bold}>{currentVendor || "None"}</Text>
          </Text>

          <Text style={styles.currentVendorText}>
            Vendor AwbNumber:{" "}
            <Text style={styles.bold}>{vendorAwbnumber || "None"}</Text>
          </Text>
          {/* Toggle Button */}
          <TouchableOpacity style={styles.toggleButton} onPress={handleToggle}>
            <Text style={styles.toggleText}>
              {needToChange ? "Cancel Change" : "Need to Change Vendor?"}
            </Text>
          </TouchableOpacity>

          {/* Vendor Picker */}
          {needToChange && (
            <View style={styles.pickerContainer}>
              <Text style={styles.label}>Select New Vendor:</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={selectedVendor}
                  style={styles.picker}
                  dropdownIconColor="#7c3aed"
                  onValueChange={(itemValue) => setSelectedVendor(itemValue)}
                >
                  <Picker.Item label="Select Vendor" value="" />
                  <Picker.Item label="UPS" value="UPS" />
                  <Picker.Item label="BOMBINO" value="BOMBINO" />
                  <Picker.Item label="ATLANTIC" value="ATLANTIC" />
                  <Picker.Item label="DESK SELF" value="DESK SELF" />
                  <Picker.Item label="DHL" value="DHL" />
                  <Picker.Item label="ARAMEX" value="ARAMEX" />
                  <Picker.Item label="FedEx" value="FedEx" />
                  <Picker.Item label="ExPlus" value="ExPlus" />
                </Picker>
              </View>
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && { opacity: 0.8 }]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitText}>Submit</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default VendorChangeModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    alignItems: "center",
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    right: 12,
    top: 12,
    padding: 6,
    zIndex: 10,
  },
  awbText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#6b7280",
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  currentVendorText: {
    fontSize: 16,
    marginBottom: 14,
    color: "#4b5563",
  },
  bold: {
    fontWeight: "700",
    color: "#111827",
  },
  toggleButton: {
    backgroundColor: "#7c3aed",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    marginBottom: 18,
  },
  toggleText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
    textAlign: "center",
  },
  pickerContainer: {
    width: "100%",
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: "500",
    color: "#374151",
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    overflow: "hidden",
  },
  picker: {
    height: 42,
    width: "100%",
  },
  submitButton: {
    backgroundColor: "#10b981",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 120,
  },
  submitText: {
    color: "white",
    fontWeight: "600",
    fontSize: 15,
  },
});
