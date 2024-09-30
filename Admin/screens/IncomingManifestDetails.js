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

function IncomingManifestDetails() {
  const navigation = useNavigation();

  const route = useRoute();
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

  const updateRowByID = async (rowId , updatedFields) => {
    try {
      const response = await fetch(`${API_URL}/${rowId}`, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sheet1: { ...updatedFields } }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update the row. Status: ${response.status}. Error: ${errorText}`);
      }

      console.log("Row updated successfully");
    } catch (error) {
      console.error("Error updating row:", error);
    }
  };

  const [user, setUser] = useState(null);
  const [actualWeight, setActualWeight] = useState("");
  const [actualNumPackages, setActualNumPackages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(false);
  const [errors, setErrors] = useState({ country: false, vendor: false });

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

  const handleSubmit = async () => {
    setErrors({ country: false, vendor: false });

    if (!selectedCountry) {
      setErrors((prev) => ({ ...prev, country: true }));
    }

    if (!selectedVendor) {
      setErrors((prev) => ({ ...prev, vendor: true }));
    }

      setIsSubmitting(true);
      
      const details = {
        actualWeight: actualWeight,
        actualNoOfPackages: actualNumPackages,
        status: "PAYMENT PENDING",
      };

      await updateRowByID(user.id, details);
      setActualWeight("");
      setActualNumPackages(1);
      setIsSubmitting(false);
      navigation.navigate("Admin");
  };

  if (loading)
    return <ActivityIndicator size="large" color="#6B21A8" style={styles.loading} />;
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Outgoing Manifest</Text>
        <View style={styles.info}>
          <Text style={styles.label}>AWB Number:</Text>
          <Text style={styles.value}>{user.awbNumber}</Text>
        </View>

        <View style={styles.info}>
          <Text style={styles.label}>Name:</Text>
          <Text style={styles.value}>{user.consignorname}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Weight (Approx):</Text>
          <Text style={styles.value}>{user.weightapx}</Text>
          <FontAwesome name="check-circle" size={20} color="green" style={styles.icon} />
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Post Pickup Weight:</Text>
          <Text style={styles.value}>{user.postPickupWeight}</Text>
          <FontAwesome name="check-circle" size={20} color="green" style={styles.icon} />
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Post Pickup Packages:</Text>
          <Text style={styles.value}>{user.postNumberOfPackages}</Text>
          <FontAwesome name="check-circle" size={20} color="green" style={styles.icon} />
        </View>

        <View style={styles.infoRowFromTo}>
          <Text style={styles.label}>From address:</Text>
          <Text style={styles.valueFromTo}>{user.consignorlocation}</Text>
        </View>

        <View style={styles.infoRowFromTo}>
          <Text style={styles.label}>To address:</Text>
          <Text style={styles.valueFromTo}>{user.consigneelocation}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Destination:</Text>
          <Text style={styles.valueFromTo}>{user.destination}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>Vendor:</Text>
          <Text style={styles.valueFromTo}>{user.vendorName}</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Final Weight:</Text>
          <TextInput
            value={actualWeight}
            onChangeText={setActualWeight}
            placeholder="Enter actual weight"
            keyboardType="numeric"
            style={styles.finalWeightInput}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Final Number of Packages:</Text>
          <View style={styles.increDecreContainer}>
            <TouchableOpacity
              style={styles.increDecreButton}
              onPress={() =>
                setActualNumPackages((prev) =>
                  Math.max(1, parseInt(prev, 10) - 1)
                )
              }
            >
              <Text style={styles.buttonText}>-</Text>
            </TouchableOpacity>

            <Text style={styles.value}>{actualNumPackages}</Text>

            <TouchableOpacity
              style={styles.increDecreButton}
              onPress={() =>
                setActualNumPackages((prev) => parseInt(prev, 10) + 1)
              }
            >
              <Text style={styles.buttonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Submit Button with Loading Indicator */}
        <TouchableOpacity
          onPress={handleSubmit}
          style={styles.button}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Submit</Text>
          )}
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
  valueFromTo:{
    marginLeft:10,
    marginBottom:10
  },
  card: {
    width: "90%",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
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
  label: {
    fontSize: 16,
    color: "#6B7280",
  },
  value: {
    fontSize: 18,
    color: "#1F2937",
    marginLeft: 8,
    marginRight: 8,
  },
  icon: {
    marginLeft: 8,
  },
  inputGroup: {
    marginBottom: 15,
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
  increDecreContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },
  increDecreButton: {
    backgroundColor: "#6B21A8",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  finalWeightInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 5,
    padding: 10,
    marginTop: 3,
    fontSize: 16,
    marginHorizontal: 10,
    width: "90%",
  },
  checkboxGroup: {
    marginVertical: 15,
  },
  checkbox: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  checkboxText: {
    fontSize: 16,
    color: "#1F2937",
    marginRight: 10,
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: 5,
  },
  infoRow:{
   marginTop:5,
   marginBottom:5,
    display:"flex",
    flexDirection:"row"
  }
});

export default IncomingManifestDetails;