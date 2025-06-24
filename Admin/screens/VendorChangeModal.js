import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";

const VendorChangeModal = ({
  visible,
  onClose,
  onSubmit,
  currentVendor,
  finalsubmit,
  isSubmitting,
  setIsSubmitting,
}) => {
  const [needToChange, setNeedToChange] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(currentVendor || "");

  const handleToggle = () => {
    setNeedToChange(!needToChange);
    setSelectedVendor(currentVendor); // Reset selection to current
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const finalVendor = needToChange ? selectedVendor : currentVendor;
    await finalsubmit(finalVendor);
    setNeedToChange(false);
    onClose();
  };

  {
    isSubmitting ? (
      <ActivityIndicator size="small" color="#fff" /> // Loading spinner inside button
    ) : (
      <Text style={styles.buttonText}>Submit</Text>
    );
  }
  return (
    <Modal animationType="slide" transparent visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Vendor Details</Text>
          <Text style={styles.currentVendorText}>
            Current Vendor:{" "}
            <Text style={styles.bold}>{currentVendor || "None"}</Text>
          </Text>
          <TouchableOpacity style={styles.toggleButton} onPress={handleToggle}>
            <Text style={styles.toggleText}>
              {needToChange ? "Cancel Change" : "Need to Change Vendor?"}
            </Text>
          </TouchableOpacity>
          {needToChange && (
            <View style={styles.pickerContainer}>
              <Text style={styles.label}>Select New Vendor:</Text>
              <Picker
                selectedValue={selectedVendor}
                style={styles.picker}
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
          )}
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" /> // Loading spinner inside button
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
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    elevation: 5,
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  currentVendorText: {
    fontSize: 16,
    marginBottom: 12,
    color: "#4b5563",
  },
  bold: {
    fontWeight: "bold",
    color: "#1f2937",
  },
  toggleButton: {
    backgroundColor: "#7c3aed",
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  toggleText: {
    color: "white",
    fontWeight: "600",
  },
  pickerContainer: {
    width: "100%",
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
  },
  picker: {
    height: 40,
    width: "100%",
  },
  submitButton: {
    backgroundColor: "#10b981",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 8,
  },
  submitText: {
    color: "white",
    fontWeight: "600",
  },
  closeText: {
    color: "#ef4444",
    marginTop: 10,
    fontWeight: "500",
  },
});
