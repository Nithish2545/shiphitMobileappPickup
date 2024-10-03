import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
  Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import axios from "axios";
import { FontAwesome } from "@expo/vector-icons";
import apiURLs from "../../utility/googlescreen/apiURLs";
import * as ImagePicker from "expo-image-picker";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../App"; // Ensure you import firebase storage

function VendorDetails() {
  const route = useRoute();
  const navigation = useNavigation();
  const { awbnumber } = route.params;
  const API_URL = apiURLs.sheety;

  const [user, setUser] = useState(null);
  const [vendorAwbnumber, setVendorAwbnumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [weightImages, setWeightImages] = useState([]); // New state for storing weight images

  const fetchRowByAWB = async (awbNumber) => {
    try {
      const response = await axios.get(API_URL);
      const allUsers = response.data.sheet1;
      const matchedUser = allUsers.find((user) => user.awbNumber === awbnumber);
      return matchedUser;
    } catch (error) {
      console.error("Error fetching row by AWB number:", error);
      Alert.alert("Error", "Failed to fetch vendor details. Please try again.");
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
      console.log("Row updated successfully", data);
    } catch (error) {
      console.error("Error updating row:", error);
      Alert.alert("Error", "Failed to update vendor details. Please try again.");
    }
  };

  const PickupCompletedDate = () => {
    const now = new Date();
    const istDate = now.toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "numeric",
    });
    const istTime = now.toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
    const [hour, period] = istTime.split(" ");
    const formattedTime = `${hour} ${period}`;
    return `${istDate} & ${formattedTime}`;
  };

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
    if (user && user.id) {
      setIsSubmitting(true);
      const details = {
        vendorAwbnumber: vendorAwbnumber,
        status: "SHIPMENT CONNECTED",
        packageConnectedDataTime: PickupCompletedDate(),
      };

      await updateRowByID(user.id, details);

      // Upload all images
      try {
        await Promise.all(weightImages.map(image => uploadFileToFirebase(image, "finalWeightImage")));
      } catch (error) {
        Alert.alert("Error", "Failed to upload images. Please try again.");
      }

      setVendorAwbnumber("");
      setIsSubmitting(false);
      navigation.navigate("Admin");
    } else {
      console.error("Cannot update row: User or Row ID is missing");
      Alert.alert("Error", "User or Row ID is missing.");
    }
  };

  const uploadFileToFirebase = async (file, folder) => {
    try {
      console.log("Folder:", folder, "AWB Number:", awbnumber);
  
      if (!file || !file.uri || !file.fileName) {
        throw new Error("Invalid file object: Missing uri or fileName");
      }

      console.log("File object:", file);

      const response = await fetch(file.uri);
      const blob = await response.blob();
      const storageRef = ref(storage, `${awbnumber}/${folder}/${file.fileName}`);
      await uploadBytes(storageRef, blob);

      const url = await getDownloadURL(storageRef);
      console.log("Uploaded file URL:", url);
      return url;
    } catch (error) {
      console.error("Error uploading file:", error);
      throw error;
    }
  };
  
  const handleFileChange = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "We need camera roll permissions to make this work!"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false, // Ensure single selection
        quality: 1,
      });

      if (!result.canceled) {
        setWeightImages((prevFiles) => [...prevFiles, ...result.assets]);
      } else {
        console.log("No assets found or user canceled the action");
      }
    } catch (error) {
      console.error("Error launching image library:", error);
      Alert.alert("Error", "Failed to open image picker. Please try again.");
    }
  };

  const handleRemoveFile = (fileName) => {
    setWeightImages((prevFiles) =>
      prevFiles.filter((file) => file.fileName !== fileName)
    );
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
        <View style={styles.infoRow}>
          <Text style={styles.label}>Vendor:</Text>
          <Text style={styles.value}>{user.vendorName}</Text>
          <FontAwesome
            name="check-circle"
            size={20}
            color="green"
            style={styles.icon}
          />
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Destination:</Text>
          <Text style={styles.value}>{user.destination}</Text>
          <FontAwesome
            name="check-circle"
            size={20}
            color="green"
            style={styles.icon}
          />
        </View>

        <TextInput
          style={styles.input}
          placeholder="Enter Vendor AWB Number"
          value={vendorAwbnumber}
          onChangeText={setVendorAwbnumber}
        />
        <TouchableOpacity onPress={handleFileChange} style={styles.uploadButton}>
          <Text style={styles.uploadButtonText}>Upload Weight Image</Text>
        </TouchableOpacity>

        {weightImages.map((image, index) => (
          <View key={index} style={styles.imageContainer}>
            <Image
              source={{ uri: image.uri }}
              style={styles.uploadedImage}
            />
            <TouchableOpacity
              onPress={() => handleRemoveFile(image.fileName)}
              style={styles.removeButton}
            >
              <Text style={styles.removeButtonText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isSubmitting}
          style={[
            styles.submitButton,
            { backgroundColor: isSubmitting ? "gray" : "#6B21A8" },
          ]}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  info: {
    marginVertical: 5,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  value: {
    fontSize: 16,
    color: "#555",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  icon: {
    marginLeft: 10,
  },
  infoRowFromTo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  valueFromTo: {
    fontSize: 16,
    color: "#555",
  },
  inputGroup: {
    marginVertical: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
  },
  button: {
    backgroundColor: "#6B21A8",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: "#6B21A8",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 20,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
  },
  imagePreviewContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
  },
  imagePreview: {
    position: "relative",
    margin: 5,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  removeButton: {
    position: "absolute",
    top: 5,
    right: 5,
  },
});

export default VendorDetails;
