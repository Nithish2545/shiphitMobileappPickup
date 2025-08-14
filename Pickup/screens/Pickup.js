import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
} from "react-native";
import { useState, useRef, useEffect } from "react";
import Runsheet from "./Runsheet";
import PickupCompleted from "./PickupCompleted";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Ionicons from "@expo/vector-icons/Ionicons";
import ModalDatePicker from "react-native-modal-datetime-picker";
import { useNavigation } from "@react-navigation/native";

export default function Admin() {
  const [error, setError] = useState("");
  const [currentTab, setCurrentTab] = useState("RUN SHEET");
  const [selectedDate, setSelectedDate] = useState("");
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [tofilterDate, setToFilterDate] = useState("");
  const navigation = useNavigation();

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [currentTab]);

  const handleDatePicked = (date) => {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const formattedDate = `${day}-${month}-${year}`;
    setToFilterDate(`${day}-${month}`);
    setSelectedDate(formattedDate);
    setDatePickerVisibility(false);
  };

  const handleTabChange = (tab) => {
    setCurrentTab(tab);
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.container}>
      <View style={styles.signout}>
        <View style={styles.headerTop}>
          <Text style={styles.headerText}>
            {currentTab === "INCOMING MANIFEST"
              ? "PICKUP COMPLETED"
              : currentTab}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
            <FontAwesome5 name="user-alt" size={24} color="black" />
          </TouchableOpacity>
        </View>
        <View style={styles.dateControls}>
          <TouchableOpacity
            onPress={() => setDatePickerVisibility(true)}
            style={styles.datePickerInput}
          >
            <TextInput
              style={styles.datePickerText}
              value={selectedDate}
              editable={false}
              placeholder="dd/mm/yyyy"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => {
              setToFilterDate("");
              setSelectedDate(null);
              setDatePickerVisibility(false);
            }}
          >
            <Text style={styles.clearButtonText}>Clear Date</Text>
          </TouchableOpacity>
        </View>
        <ModalDatePicker
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={handleDatePicked}
          onCancel={() => setDatePickerVisibility(false)}
        />
      </View>
      <View style={styles.nav}>
        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => {
            handleTabChange("RUN SHEET");
          }}
        >
          <FontAwesome5
            name="truck-pickup"
            size={24}
            color={currentTab === "RUN SHEET" ? "#8647D3" : "#A985D4"}
          />
          <Text
            style={[
              styles.tabLabel,
              currentTab === "RUN SHEET" && styles.activeTabLabel,
            ]}
          >
            Run Sheet
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => handleTabChange("INCOMING MANIFEST")}
        >
          <Ionicons
            name="checkmark-done-circle-outline"
            size={24}
            color={currentTab === "INCOMING MANIFEST" ? "#8647D3" : "#A985D4"}
          />
          <Text
            style={[
              styles.tabLabel,
              currentTab === "INCOMING MANIFEST" && styles.activeTabLabel,
            ]}
          >
            Completed
          </Text>
        </TouchableOpacity>
      </View>
      <>
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
            <ScrollView
              contentContainerStyle={styles.scrollContainer}
              showsVerticalScrollIndicator={false}
            >
              {currentTab === "RUN SHEET" ? (
                <Runsheet />
              ) : currentTab === "INCOMING MANIFEST" ? (
                <PickupCompleted tofilterDate={tofilterDate} />
              ) : (
                ""
              )}
            </ScrollView>
          </Animated.View>
        )}
      </>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    paddingBottom: 50,
    backgroundColor: "#fff",
    position: "relative",
  },
  signout: {
    paddingRight: 15,
    paddingLeft: 15,
    flexDirection: "column",
    justifyContent: "space-between",
    height: 100,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "lightgrey",
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headerText: {
    color: "black",
    fontWeight: "600",
    fontSize: 18,
  },
  dateControls: {
    flexDirection: "row",
    gap: 20,
    marginTop: 10,
  },
  nav: {
    backgroundColor: "#fff",
    position: "absolute",
    height: 80,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    zIndex: 20,
  },
  tabButton: {
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },
  tabLabel: {
    fontSize: 12,
    color: "#A985D4",
    marginTop: 4,
  },
  activeTabLabel: {
    color: "#8647D3",
    fontWeight: "600",
  },
  scrollContainer: {
    paddingBottom: 20,
    paddingTop: 10,
    paddingLeft: 10,
    paddingRight: 10,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginTop: 10,
  },
  datePickerInput: {
    borderWidth: 1,
    borderColor: "#8647D3",
    borderRadius: 5,
    backgroundColor: "#fff",
    alignSelf: "flex-start",
  },
  datePickerText: {
    color: "black",
    fontSize: 16,
    height: 40,
    padding: 10,
  },
  clearButton: {
    backgroundColor: "#6200ea",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  clearButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
    elevation: 10,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#8647D3",
    fontWeight: "600",
  },
});
