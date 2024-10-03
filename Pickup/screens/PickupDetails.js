import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import axios from "axios";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../FirebaseConfig";
import apiURLs from "../../utility/googlescreen/apiURLs";
import * as ImagePicker from "expo-image-picker";
import { TouchableOpacity } from "react-native";
// import Ionicons from "react-native-vector-icons/Ionicons"; // Import vector icons

const API_URL = apiURLs.sheety;

const PickupDetails = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { awbnumber } = route.params;

  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pickupWeight, setPickupWeight] = useState("");
  const [numberOfPackages, setNumberOfPackages] = useState(1);
  const [productImages, setProductImages] = useState([]);
  const [packageWeightImages, setPackageWeightImages] = useState([]);
  const [formImages, setFormImages] = useState([]);
  const [formError, setFormError] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const result = await axios.get(API_URL);
        const userDetails = result.data.sheet1.find(
          (item) => item.status === "RUN SHEET" && item.awbNumber === awbnumber
        );
        setDetails(userDetails);
        setPickupWeight(userDetails?.pickupWeight || "");
        setNumberOfPackages(userDetails?.numberOfPackages || 1);
      } catch (error) {
        handleError(error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [awbnumber]);

  const uploadFileToFirebase = async (file, folder) => {
    const response = await fetch(file.uri);
    const blob = await response.blob();
    const storageRef = ref(storage, `${awbnumber}/${folder}/${file.fileName}`);
    await uploadBytes(storageRef, blob);
    const url = await getDownloadURL(storageRef);
    console.log(url);
    return url;
  };

  const handleFileChange = async (folder, setState) => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "We need camera roll permissions to make this work!"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 1,
      });

      if (!result.canceled) {
        setState((prevFiles) => [...prevFiles, ...result.assets]);
      } else {
        console.log("No assets found or user canceled the action");
      }
    } catch (error) {
      console.error("Error launching image library:", error);
    }
  };

  const handleRemoveFile = (fileName, setState) => {
    setState((prevFiles) =>
      prevFiles.filter((file) => file.fileName !== fileName)
    );
  };

  const validateForm = () => {
    if (!pickupWeight || !numberOfPackages) {
      setFormError("Pickup weight and number of packages are required.");
      return false;
    }
    if (productImages.length === 0 || productImages.length > 5) {
      setFormError("You must upload between 1 to 5 product images.");
      return false;
    }
    if (packageWeightImages.length === 0 || packageWeightImages.length > 5) {
      setFormError("You must upload between 1 to 5 package weight images.");
      return false;
    }
    if (formImages.length === 0 || formImages.length > 2) {
      setFormError("You must upload between 1 to 2 form images.");
      return false;
    }
    setFormError("");
    return true;
  };

  const PickupCompletedDate = () => {
    const now = new Date();

    // Extract day and month, ensuring no leading zero
    const day = now.getDate(); // Get day without leading zero
    const month = now.getMonth() + 1; // Get month (0-indexed, so add 1)

    // Format the time in IST with AM/PM in uppercase
    const istTime = now
      .toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "numeric",
        hour12: true,
      })
      .toUpperCase(); // Ensure AM/PM is uppercase

    return `${day}-${month} &${istTime}`;
  };

  const handleSubmit = async () => {
    console.log(PickupCompletedDate());
    if (!validateForm()) return;

    setSubmitLoading(true);

    try {
      if (!details) {
        throw new Error("User details not found");
      }

      const productImageUrls = await Promise.all(
        productImages.map((file) =>
          uploadFileToFirebase(file, "PRODUCT IMAGES")
        )
      );
      const packageWeightImageUrls = await Promise.all(
        packageWeightImages.map((file) =>
          uploadFileToFirebase(file, "PACKAGE WEIGHT")
        )
      );
      const formImageUrls = await Promise.all(
        formImages.map((file) => uploadFileToFirebase(file, "FORM IMAGES"))
      );

      await axios.put(`${API_URL}/${details.id}`, {
        sheet1: {
          postPickupWeight: `${pickupWeight} KG`,
          postNumberOfPackages: numberOfPackages,
          status: "INCOMING MANIFEST",
          pickUpPersonNameStatus: "PICKUP COMPLETED",
          PRODUCTSIMAGE: productImageUrls.join(", "),
          PACKAGEWEIGHTIMAGES: packageWeightImageUrls.join(", "),
          FORMIMAGES: formImageUrls.join(", "),
          pickupCompletedDatatime: PickupCompletedDate(),
        },
      });

      navigation.navigate("Pickup");
    } catch (error) {
      handleError(error);
    } finally {
      setSubmitLoading(false);
      resetForm();
    }
  };

  const handleError = (error) => {
    if (error.response) {
      setError(
        `Error ${error.response.status}: ${
          error.response.data.message || error.message
        }`
      );
    } else if (error.request) {
      setError("Network error. Please check your connection.");
    } else {
      setError(`Error: ${error.message}`);
    }
  };

  const resetForm = () => {
    setPickupWeight("");
    setNumberOfPackages(1);
    setProductImages([]);
    setPackageWeightImages([]);
    setFormImages([]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#8447D6" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  const handleGoBack = () => {
    navigation.goBack(); // Go back one step in the navigation stack
  };

  return (
    <View>
      <ScrollView contentContainerStyle={styles.container}>
        <View>
          <Text style={styles.backButton} onPress={handleGoBack}>
            Back
          </Text>
        </View>
        {details ? (
          <View>
            <Text style={styles.title}>Pickup Details</Text>
            <View style={styles.detailContainer}>
              <Text style={styles.label}>AWB Number:</Text>
              <Text style={styles.text}>{details.awbNumber}</Text>
            </View>
            <View style={styles.detailContainer}>
              <Text style={styles.label}>Consignee:</Text>
              <Text style={styles.text}>{details.name}</Text>
            </View>
            <View style={styles.detailContainer}>
              <Text style={styles.label}>Destination:</Text>
              <Text style={styles.text}>{details.destination}</Text>
            </View>
            <View style={styles.detailContainer}>
              <Text style={styles.label}>Weight APX:</Text>
              <Text style={styles.text}>{details.weightapx}</Text>
            </View>
            <View style={styles.detailContainer}>
              <Text style={styles.label}>Phone Number:</Text>
              <Text style={styles.text}>{details.phonenumber}</Text>
            </View>
            <View style={styles.detailContainer}>
              <Text style={styles.label}>Pickup DateTime:</Text>
              <Text style={styles.text}>{details.pickupDatetime}</Text>
            </View>
            <View style={styles.detailContainer}>
              <Text style={styles.label}>Pickup Inst:</Text>
              <Text style={styles.text}>
                {details.pickupInstructions || "-"}
              </Text>
            </View>

            <View style={styles.formContainer}>
              <Text style={styles.subtitle}>Update Details</Text>
              <Text style={styles.weighttext}>Pickup weight</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter Pickup Weight"
                value={pickupWeight}
                onChangeText={setPickupWeight}
                keyboardType="numeric"
              />
              <Text style={styles.weighttext}>No. of boxes</Text>
              <View style={styles.quantityContainer}>
                <TouchableOpacity
                  style={styles.increDecre}
                  onPress={() => {
                    setNumberOfPackages(numberOfPackages - 1);
                  }}
                >
                  <Text style={styles.buttonText}>-</Text>
                </TouchableOpacity>

                <TextInput
                  style={styles.quantityInput}
                  value={numberOfPackages.toString()}
                  onChangeText={(text) =>
                    setNumberOfPackages(Math.max(1, parseInt(text, 10)))
                  }
                  keyboardType="numeric"
                />
                <TouchableOpacity
                  style={styles.increDecre}
                  onPress={() => setNumberOfPackages(numberOfPackages + 1)}
                >
                  <Text style={styles.buttonText}>+</Text>
                </TouchableOpacity>
              </View>

              <FileInput
                label="Product Images (1-5)"
                files={productImages}
                onAddFiles={() =>
                  handleFileChange("PRODUCT IMAGES", setProductImages)
                }
                onRemoveFile={(fileName) =>
                  handleRemoveFile(fileName, setProductImages)
                }
              />
              <FileInput
                label="Package Weight Images (1-5)"
                files={packageWeightImages}
                onAddFiles={() =>
                  handleFileChange("PACKAGE WEIGHT", setPackageWeightImages)
                }
                onRemoveFile={(fileName) =>
                  handleRemoveFile(fileName, setPackageWeightImages)
                }
              />
              <FileInput
                label="Form Images (1-2)"
                files={formImages}
                onAddFiles={() =>
                  handleFileChange("FORM IMAGES", setFormImages)
                }
                onRemoveFile={(fileName) =>
                  handleRemoveFile(fileName, setFormImages)
                }
              />

              {formError ? (
                <Text style={styles.errorText}>{formError}</Text>
              ) : null}

              <Button
                title="Submit"
                onPress={handleSubmit}
                color="#8447D6"
                disabled={submitLoading}
              />
              {submitLoading && (
                <ActivityIndicator size="large" color="#8447D6" />
              )}
            </View>
          </View>
        ) : (
          <Text style={styles.errorText}>
            No details found for this AWB number.
          </Text>
        )}
      </ScrollView>
    </View>
  );
};

const FileInput = ({ label, files, onAddFiles, onRemoveFile }) => (
  <View style={styles.fileContainer}>
    <Text style={styles.subtitle}>{label}</Text>
    <Button title="Add Files" onPress={onAddFiles} color="#8447D6" />
    {files.length > 0 && (
      <View style={styles.fileList}>
        {files.map((file, index) => (
          <View key={index} style={styles.fileItem}>
            <Text>{file.fileName}</Text>
            <Button
              title="Remove"
              onPress={() => onRemoveFile(file.fileName)}
              color="#8447D6"
            />
          </View>
        ))}
      </View>
    )}
  </View>
);

const styles = StyleSheet.create({
  increDecre: {
    paddingLeft: 15,
    paddingRight: 15,
    paddingTop: 4,
    paddingBottom: 4,
    backgroundColor: "#8447D6",
    borderRadius: 5, // Optional: Add border radius for a rounded button
    alignItems: "center", // Center the text inside the button
  },
  buttonText: {
    color: "#FFFFFF", // White text color
    fontSize: 30, // Font size for the text
  },
  weighttext: {
    color: "#8447D6",
    fontSize: 18,
    marginBottom: 10,
    marginTop: 10,
    fontWeight: "700",
  },
  container: {
    flexGrow: 1,
    padding: 16,
    marginTop: 50,
    paddingBottom: 100,
    backgroundColor: "#F5F5F5",
  },
  backButton: {
    marginBottom: 16,
    fontSize: 20,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#8447D6",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#8447D6",
    marginVertical: 8,
  },
  detailContainer: {
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  text: {
    fontSize: 16,
    color: "#666",
  },
  formContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    padding: 8,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  quantityInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    padding: 8,
    marginHorizontal: 8,
    width: 60,
    fontSize: 16,
    textAlign: "center",
  },
  fileContainer: {
    marginBottom: 20,
  },
  fileList: {
    marginTop: 8,
  },
  fileItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  errorText: {
    color: "red",
    fontSize: 16,
    marginTop: 12,
  },
});

export default PickupDetails;
