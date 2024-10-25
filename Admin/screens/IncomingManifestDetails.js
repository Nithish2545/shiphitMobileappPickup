import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Image,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { FontAwesome } from "@expo/vector-icons";
import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db, storage } from "../../FirebaseConfig";
import * as ImagePicker from "expo-image-picker"; // Import ImagePicker
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

function IncomingManifestDetails() {
  const navigation = useNavigation();

  const route = useRoute();

  const { awbnumber } = route.params;

  const [user, setUser] = useState(null);
  const [actualWeight, setActualWeight] = useState("");
  const [rto, setrto] = useState("");
  const [actualNumPackages, setActualNumPackages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(false);
  const [errors, setErrors] = useState({ country: false, vendor: false });
  const [finalWeightImage, setFinalWeightImage] = useState([]); // State for final weight image
  const [weighterror, setweighterror] = useState("");
  const [weightiimageerror, setweightiimageerror] = useState("");

  const fetchRowByAWB = async () => {
    try {
      const q = query(
        collection(db, "pickup"),
        where("awbNumber", "==", awbnumber)
      );

      const querySnapshot = await getDocs(q);
      let final_result = [];

      querySnapshot.forEach((doc) => {
        final_result.push({ id: doc.id, ...doc.data() });
      });
      setUser(final_result[0]);
      return final_result[0];
    } catch (error) {
      console.error("Error fetching row by AWB number:", error);
      return null; // Return null in case of an error
    }
  };

  const removeImage = (index) => {
    const updatedImages = finalWeightImage.filter((_, i) => i !== index); // Remove image by index
    setFinalWeightImage(updatedImages);
  };
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true, // Allow multiple image selection
      // quality: 2,
    });

    if (!result.canceled) {
      const selectedImages = result.assets.map((asset) => asset.uri); // Get URIs of selected images
      setFinalWeightImage([...finalWeightImage, ...selectedImages]); // Add new images to the existing array
    }
  };

  const uploadImage = async () => {
    const uploadPromises = finalWeightImage.map(async (imageUri) => {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const storageRef = ref(
        storage,
        `${awbnumber}/FINAL IMAGE WEIGHT/${Date.now()}.jpg`
      ); // Reference for each image

      await uploadBytes(storageRef, blob); // Upload image

      const downloadURL = await getDownloadURL(storageRef); // Get download URL
      return downloadURL; // Return the URL after upload
    });

    const uploadedURLs = await Promise.all(uploadPromises); // Wait for all uploads to finish
    return uploadedURLs; // Return all download URLs
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
  }, []);

  const handleSubmit = async () => {
    if (!actualWeight) {
      setweighterror("Final weight is required!");
      return;
    }

    if (!finalWeightImage) {
      setweighterror("");
      setweightiimageerror("Final weight image is required!");
      return;
    }

    setErrors({ country: false, vendor: false });

    if (!selectedCountry) {
      setErrors((prev) => ({ ...prev, country: true }));
    }

    if (!selectedVendor) {
      setErrors((prev) => ({ ...prev, vendor: true }));
    }

    setIsSubmitting(true);

    const updatedFields = {
      actualWeight: actualWeight,
      actualNoOfPackages: actualNumPackages,
      status: "PAYMENT PENDING",
      rtoIfAny: rto,
      finalWeightImage: await uploadImage(finalWeightImage),
    };

    const q = query(
      collection(db, "pickup"),
      where("awbNumber", "==", awbnumber)
    );

    const querySnapshot = await getDocs(q);
    let final_result = [];

    querySnapshot.forEach((doc) => {
      final_result.push({ id: doc.id, ...doc.data() });
    });

    const docRef = doc(db, "pickup", final_result[0].id); // db is your Firestore instance

    updateDoc(docRef, updatedFields);
    setActualWeight("");
    setActualNumPackages(1);
    setIsSubmitting(false);
    navigation.navigate("Admin");
  };

  if (loading)
    return (
      <ActivityIndicator size="large" color="#6B21A8" style={styles.loading} />
    );

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollViewContent1}
        style={{ display: "flex", width: "100%" }}
      >
        <View style={styles.card}>
          <Text style={styles.title}>WAREHOUSE</Text>
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
            <FontAwesome
              name="check-circle"
              size={20}
              color="green"
              style={styles.icon}
            />
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Post Pickup Weight:</Text>
            <Text style={styles.value}>{user.postPickupWeight}</Text>
            <FontAwesome
              name="check-circle"
              size={20}
              color="green"
              style={styles.icon}
            />
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Post Pickup Packages:</Text>
            <Text style={styles.value}>{user.postNumberOfPackages}</Text>
            <FontAwesome
              name="check-circle"
              size={20}
              color="green"
              style={styles.icon}
            />
          </View>
          <View style={styles.infoRowFromTo}>
            <Text style={styles.label}>From address:</Text>
            <Text style={styles.valueFromTo}>{user.consignorlocation}</Text>
          </View>
          <View style={styles.infoRowFromTo}>
            <Text style={styles.label}>To address:</Text>
            <Text style={styles.valueFromTo}>
              {user.consigneelocation != "" ? user.consigneelocation : "N/A"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Destination:</Text>
            <Text style={styles.valueFromTo}>{user.destination}</Text>
            <FontAwesome
              name="check-circle"
              size={20}
              color="green"
              style={styles.icon}
            />
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Vendor:</Text>
            <Text style={styles.valueFromTo}>{user.vendorName}</Text>
            <FontAwesome
              name="check-circle"
              size={20}
              color="green"
              style={styles.icon}
            />
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
            {weighterror ? (
              <Text style={{ color: "red" }}>{weighterror}</Text>
            ) : (
              <Text></Text>
            )}
          </View>
          <View style={styles.imageUploadContainer}>
            {finalWeightImage.map((imageUri, index) => (
              <View key={index} style={styles.imagePreview}>
                <Image source={{ uri: imageUri }} style={styles.image} />
                <TouchableOpacity
                  onPress={() => removeImage(index)}
                  style={styles.removeButton}
                >
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity onPress={pickImage} style={styles.uploadButton}>
              <Text style={styles.uploadButtonText}>
                {finalWeightImage.length > 0
                  ? "Add More Final Weight Images"
                  : "Upload Final Weight Images"}
              </Text>
            </TouchableOpacity>
            {weightiimageerror ? (
              <Text style={{ color: "red" }}>{weightiimageerror}</Text>
            ) : (
              <Text></Text>
            )}
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
          <View style={styles.inputGroup}>
            <Text style={styles.label}>RTO:</Text>
            <TextInput
              value={rto}
              onChangeText={setrto}
              placeholder="Enter RTO"
              keyboardType="default"
              style={styles.finalWeightInput}
            />
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  uploadButton: {
    backgroundColor: "#6B21A8",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    alignItems: "center",
  },

  uploadButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  imageUploadContainer: {
    marginTop: 16,
  },

  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 8,
  },

  removeButton: {
    backgroundColor: "red",
    borderRadius: 8,
    padding: 8,
  },

  removeButtonText: {
    color: "#fff",
  },

  imagePreview: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  scrollViewContent1: {
    paddingTop: 50, // Adjust padding as needed
    paddingBottom: 30, // Adjust padding as needed
    marginLeft: 15,
    marginRight: 15,
  },
  container: {
    flex: 1,
    width: "100%",
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  valueFromTo: {
    marginLeft: 10,
    marginBottom: 10,
    fontSize: 15,
  },
  card: {
    width: "100%",
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
  infoRow: {
    marginTop: 5,
    marginBottom: 5,
    display: "flex",
    flexDirection: "row",
  },
});

export default IncomingManifestDetails;
