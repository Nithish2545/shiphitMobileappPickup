import { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import AntDesign from "@expo/vector-icons/AntDesign";

const VendorChangeModal = ({
  visible,
  vendorName,
  onClose,
  finalsubmit,
  isSubmitting,
  setIsSubmitting,
  vendorAwbnumber,
}) => {
  const [needToChange, setNeedToChange] = useState(false);

  const handleSubmit = async () => {
    const finalVendor = needToChange ? selectedVendor : "";
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
          <Text style={styles.title}>Confirm Vendor</Text>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Vendor Name</Text>
              <Text style={styles.value}>{vendorName}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.label}>AWB Number</Text>
              <Text style={styles.value}>{vendorAwbnumber}</Text>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && { opacity: 0.8 }]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitText}>Confirm</Text>
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
    maxWidth: 380,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    position: "relative",
  },

  closeButton: {
    position: "absolute",
    right: 12,
    top: 12,
    padding: 6,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    zIndex: 10,
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 16,
  },

  infoCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },

  infoRow: {
    marginBottom: 12,
  },

  label: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },

  value: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },

  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 8,
  },

  submitButton: {
    backgroundColor: "#6B21A8",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },

  submitText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
