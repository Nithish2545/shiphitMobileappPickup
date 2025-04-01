import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Modal from "react-native-modal";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { db } from "../../FirebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";

const RescheduleModel = ({
  isModalVisible,
  selectedHour,
  selectedPeriod,
  selectedDate,
  toggleModal,
  setSelectedHour,
  setSelectedPeriod,
  setSelectedDate,
  awbNumber,
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  // Generate hour values in "1:00, 2:00, ..., 12:00" format
  const hours = [...Array(12).keys()].map((n) => ({
    label: `${n + 1}`,
    value: `${n + 1}`,
  }));

  const formatedDateTime = () => {
    try {
      if (selectedDate && selectedHour && selectedPeriod) {
        const day = selectedDate.getDate(); // No leading zero
        const month = selectedDate.getMonth() + 1; // Month is zero-based
        const year = selectedDate.getFullYear();
        return `${day}-${month}-${year} &${selectedHour} ${selectedPeriod}`;
      } else {
        console.log("Please select a valid date and time.");
      }
    } catch (error) {
      console.log(error);
    }
  };

  async function handleConfirm(newDatetime) {
    console.log(newDatetime);
    try {
      const q = query(
        collection(db, "pickup"),
        where("awbNumber", "==", awbNumber)
      );
      const querySnapshot = await getDocs(q);
      let final_result = [];
      querySnapshot.forEach((doc) => {
        final_result.push({ id: doc.id, ...doc.data() });
      });
      const docRef = doc(db, "pickup", final_result[0].id); // db is your Firestore instance
      // Update the document with the new pickUpPersonName
      await updateDoc(docRef, {
        pickupDatetime: newDatetime,
      });
      toggleModal();
    } catch (error) {
      console.error("Error updating document:", error);
    }
  }

  return (
    <View style={styles.container}>
      {/* Modal */}
      <Modal
        isVisible={isModalVisible}
        onBackdropPress={() => toggleModal(awbNumber)}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        backdropOpacity={0.15}
        animationInTiming={250}
        animationOutTiming={150}
        useNativeDriver={true}
        useNativeDriverForBackdrop={true}
        hideModalContentWhileAnimating={true}
        style={styles.modal}
      >
        <View style={styles.modalContent}>
          <Text
            style={{
              color: "green",
              position: "absolute",
              fontWeight: 700,
              left: 20,
              top: 28,
              fontSize: 20,
            }}
          >
            {awbNumber}
          </Text>
          <Text style={styles.title}>Select Date & Time</Text>

          {/* Date Picker */}
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.datePickerText}>
              {selectedDate ? selectedDate.toDateString() : "Select Date"}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={selectedDate || new Date()}
              mode="date"
              display="spinner"
              onChange={(event, date) => {
                setShowDatePicker(false);
                if (date) setSelectedDate(date);
              }}
            />
          )}

          {/* Time Pickers */}
          <View style={styles.pickerContainer}>
            {/* Hour Picker */}
            <View style={styles.pickerBox}>
              <Text style={styles.pickerLabel}>Hour</Text>
              <Picker
                selectedValue={selectedHour}
                onValueChange={(itemValue) => setSelectedHour(itemValue)}
                style={styles.picker}
                mode="dropdown"
              >
                {hours.map((hour) => (
                  <Picker.Item
                    key={hour.value}
                    label={hour.label}
                    value={hour.value}
                  />
                ))}
              </Picker>
            </View>

            {/* AM/PM Picker */}
            <View style={styles.pickerBox}>
              <Text style={styles.pickerLabel}>Time of Day</Text>
              <Picker
                selectedValue={selectedPeriod}
                onValueChange={(itemValue) => setSelectedPeriod(itemValue)}
                style={styles.picker}
                mode="dropdown"
              >
                <Picker.Item label="AM" value="AM" />
                <Picker.Item label="PM" value="PM" />
              </Picker>
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => toggleModal()}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={() => handleConfirm(formatedDateTime())}
            >
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  openButton: {
    backgroundColor: "#673AB7",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 1, height: 2 },
    shadowRadius: 4,
    elevation: 5,
  },
  openButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  modal: {
    justifyContent: "flex-end",
    margin: 0,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    padding: 25,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 1, height: 3 },
    shadowRadius: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#4A0072",
    marginBottom: 20,
  },
  datePickerButton: {
    backgroundColor: "#EDE7F6",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 15,
  },
  datePickerText: {
    fontSize: 16,
    color: "#4A0072",
  },
  pickerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 20,
  },
  pickerBox: {
    width: "48%",
    backgroundColor: "#EDE7F6",
    borderRadius: 15,
    paddingVertical: 10,
    paddingHorizontal: 5,
    alignItems: "center",
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4A0072",
    marginBottom: 5,
  },
  picker: {
    width: "100%",
    height: 50,
    color: "#4A0072",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  cancelButton: {
    backgroundColor: "#B39DDB",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    flex: 1,
    marginRight: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  confirmButton: {
    backgroundColor: "#673AB7",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    flex: 1,
    marginLeft: 8,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default RescheduleModel;
