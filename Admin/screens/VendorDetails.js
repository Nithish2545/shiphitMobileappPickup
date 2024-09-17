import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import axios from "axios";
import { FontAwesome } from "@expo/vector-icons";
import apiURLs from "../../utility/googlescreen/apiURLs";

function VendorDetails() {

  const route = useRoute();
  const navigation = useNavigation();
  const { awbnumber } = route.params;
  const API_URL = apiURLs.sheety;

  const fetchRowByAWB = async (awbNumber) => {
    try {
      const response = await axios.get(API_URL);
      const allUsers = response.data.sheet1;
      const matchedUser = allUsers.find((user) => user.awbNumber === awbnumber);
      return matchedUser;
    } catch (error) {
      console.error("Error fetching row by AWB number:", error);
      return null;
    }
  };

  const updateRowByID = async (rowId, updatedFields) => {
    try {
      const response = await fetch(`${API_URL}/${rowId}`, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sheet1: {
            ...updatedFields,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to update the row. Status: ${response.status}. Error: ${errorText}`
        );
      }

      const data = await response.json();
      console.log(data);

      console.log("Row updated successfully");
    } catch (error) {
      console.error("Error updating row:", error);
    }
  };

  const [user, setUser] = useState(null);
  const [vendorAwbnumber, setVendorAwbnumber] = useState("");
  const [actualNumPackages, setActualNumPackages] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      const matchedUser = await fetchRowByAWB(awbnumber);
      if (matchedUser) {
        setUser(matchedUser);
      } else {
        console.error("No user found with the given AWB number");
      }
      setLoading(false);
    };

    fetchUserData();
  }, [awbnumber]);

  console.log(user?.id);

  const handleSubmit = async () => {
    if (user && user.id) {
      const details = {
        vendorAwbnumber: vendorAwbnumber,
        status: "SHIPMENT CONNECTED",
      };

      await updateRowByID(user.id, details);

      setVendorAwbnumber("");

      navigation.navigate("Admin");
    } else {
      console.error("Cannot update row: User or Row ID is missing");
    }
  };

  if (loading)

    return (
      <ActivityIndicator size="large" color="#6B21A8" style={styles.loading} />
    );

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Vendor details</Text>

        <View style={styles.info}>
          <Text style={styles.label}>Name:</Text>
          <Text style={styles.value}>{user.consignorname}</Text>
        </View>

        <View style={styles.info}>
          <Text style={styles.label}>Consignor Phone Number:</Text>
          <Text style={styles.value}>{user.consignorphonenumber}</Text>
        </View>

        <View style={styles.info}>
          <Text style={styles.label}>Shiphit AWB Number:</Text>
          <Text style={styles.value}>{user.awbNumber}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Final weight:</Text>
          <Text style={styles.value}>{user.actualWeight}</Text>
          <FontAwesome
            name="check-circle"
            size={20}
            color="green"
            style={styles.icon}
          />
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Final No of boxes:</Text>
          <Text style={styles.value}>{user.actualNoOfPackages}</Text>
          <FontAwesome
            name="check-circle"
            size={20}
            color="green"
            style={styles.icon}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Enter Vendor AWB Number:</Text>
          <TextInput
            value={vendorAwbnumber}
            onChangeText={setVendorAwbnumber}
            placeholder="Enter  Vendor AWB number"
            keyboardType="numeric"
            style={styles.input}
          />
        </View>

        <TouchableOpacity onPress={handleSubmit} style={styles.button}>
          <Text style={styles.buttonText}>Submit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    borderWidth: 1,          // Adds border width
    borderColor: '#D1D5DB', // Sets the color of the border
    borderRadius: 10,        // Adds rounded corners to the border
    padding: 10,  
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4B5563",
    marginBottom: 20,
  },
  info: {
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    color: "#6B7280",
  },
  value: {
    fontSize: 18,
    color: "#1F2937",
    marginLeft: 8,
  },
  icon: {
    marginLeft: 8,
  },
  inputGroup: {
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#6B21A8",
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  loading: {
    flex: 1,
    justifyContent: "center",
  },
});

export default VendorDetails;