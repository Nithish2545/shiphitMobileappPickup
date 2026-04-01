import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Image } from "react-native";
import DB from "../../Utility/DB";
import { db, storage } from "../../FirebaseConfig";
import {
  collection,
  doc,
  getDocs,
  query,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";

const WeightTypeToggle = ({ awbnumber, user }) => {
  const [customerWeight, setCustomerWeight] = useState("");
  const [internalWeight, setInternalWeight] = useState("");
  const [numBoxes, setNumBoxes] = useState("");
  const [boxes, setBoxes] = useState([]);
  const [pressedBoxIndex, setPressedBoxIndex] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // const [KmDriven, setKmDriven] = useState("");
  const [rto, setrto] = useState("");
  const [images, setImages] = useState([]);
  const navigation = useNavigation();
  const uploadImage = async (imageUri) => {
    if (!imageUri) return null; // Return null if no image selected
    const response = await fetch(imageUri);
    const blob = await response.blob();
    const storageRef = ref(
      storage,
      `${awbnumber}/FINAL IMAGE WEIGHT/${Date.now()}.jpg`,
    ); // Create a reference in the specified folder
    await uploadBytes(storageRef, blob); // Upload the image
    const downloadURL = await getDownloadURL(storageRef);
    // Get the download URL
    return downloadURL; // Return the URL
  };
  const uploadImage_rto = async (imageUri) => {
    if (!imageUri) return null; // Return null if no image selected
    const response = await fetch(imageUri);
    const blob = await response.blob();
    const storageRef = ref(storage, `${awbnumber}/RTOIMAGE/${Date.now()}.jpg`); // Create a reference in the specified folder
    await uploadBytes(storageRef, blob); // Upload the image
    const downloadURL = await getDownloadURL(storageRef);
    // Get the download URL
    return downloadURL; // Return the URL
  };

  const savertoimage = async (awbnumber, images) => {
    try {
      const imageUrls = [];

      for (const uri of images) {
        const url = await uploadImage(uri);
        if (url) imageUrls.push(url);
      }

      return imageUrls;
    } catch (error) {
      console.error("Error saving RTO images:", error);
    }
  };

  const saveImagesToFirestore = async (awbnumber, boxes) => {
    try {
      const finalImageData = [];

      for (const box of boxes) {
        const imageUrls = [];

        for (const uri of box.images) {
          const url = await uploadImage(uri);
          if (url) imageUrls.push(url);
        }

        finalImageData.push({
          image: imageUrls,
          type: box.type || "unknown", // Use "actual"/"volumatic", or default fallback
        });
      }

      return finalImageData;
    } catch (error) {
      console.error("Error saving images to Firestore:", error);
    }
  };
  const handleSubmit = async () => {
    // if (isNaN(KmDriven) || KmDriven <= 0) {
    //   Alert.alert("Please enter a valid number for KM Driven.");
    //   return;
    // }
    if (isNaN(customerWeight) || customerWeight <= 0) {
      Alert.alert("Please enter a valid number for Customer shipment weight.");
      return;
    }
    if (isNaN(internalWeight) || internalWeight <= 0) {
      Alert.alert("Please enter a valid number for Internal shipment weight.");
      return;
    }
    if (isNaN(numBoxes) || numBoxes <= 0) {
      Alert.alert("Please enter a valid Total Number of Boxes.");
      return;
    }
    if (boxes.length !== parseInt(numBoxes)) {
      Alert.alert(`Please add ${numBoxes} boxes`);
      return;
    }
    for (let i = 0; i < boxes.length; i++) {
      const box = boxes[i];

      const imageCount = box.images?.length || 0;

      if (box.type === "volumetric" && imageCount < 3) {
        Alert.alert(`Please upload 3 images for box ${i + 1} (volumetric).`);
        return;
      }

      if (box.type === "actual" && imageCount < 1) {
        Alert.alert(`Please upload 1 image for box ${i + 1} (actual).`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // ✅ Upload images and prepare updatedFields
      const volumaticImages = await saveImagesToFirestore(awbnumber, boxes);
      const rtoImageUrls = await savertoimage(awbnumber, images);
      const now = Timestamp.now();
      const updatedInternalTracking = user.internalTracking.map((step) => {
        if (step.code === "PACKED_WEIGHED") {
          return {
            ...step,
            status: "COMPLETED",
            datetime: now,
            updatedAt: now,
            updatedBy: "system",
            notes: "Final weight and number of boxes confirmed!",
          };
        }

        return step;
      });

      const updatedFields = {
        internalTracking: updatedInternalTracking,
        // KmDriven: parseInt(KmDriven),
        actualWeight: customerWeight,
        internalWeight: internalWeight,
        actualNoOfPackages: numBoxes,
        volumaticActualImages: volumaticImages,
        rtoIfAny: rto,
        rto_images: rtoImageUrls,
        status: "PAYMENT PENDING",
      };
      console.log("updatedFields", updatedFields);
      // ✅ Find and update Firestore document
      const q = query(
        collection(db, DB.db_collection),
        where("awbNumber", "==", awbnumber),
      );
      const querySnapshot = await getDocs(q);
      let final_result = [];
      querySnapshot.forEach((doc) => {
        final_result.push({ id: doc.id, ...doc.data() });
      });

      if (final_result.length === 0) {
        Alert.alert("No matching record found.");
        setIsSubmitting(false);
        return;
      }

      const docRef = doc(db, DB.db_collection, final_result[0].id);
      await updateDoc(docRef, updatedFields);

      // ✅ Send WhatsApp message
      const data = {
        messages: [
          {
            content: {
              language: "en",
              templateData: {
                body: {
                  placeholders: [user.consignorname, `₹${customerWeight} KG`],
                },
                buttons: [
                  {
                    type: "URL",
                    parameter: String(user.awbHashedValue),
                  },
                  {
                    type: "URL",
                    parameter: String(user.awbHashedValue),
                  },
                ],
              },
              templateName: "weightconfirmationtest",
            },
            from: "+919600690881",
            to: `+91${user.consignorphonenumber}`,
          },
        ],
      };

      await axios.post(
        "https://public.doubletick.io/whatsapp/message/template",
        data,
        {
          headers: {
            Authorization: "key_z6hIuLo8GC",
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        },
      );

      // ✅ Navigate after everything is done
      navigation.navigate("Admin");
    } catch (error) {
      console.error("Error during submission:", error);
      Alert.alert("An error occurred during submission. Please try again.");
    }

    setIsSubmitting(false);
  };

  const handleAddBox = () => {
    const total = parseInt(numBoxes);
    if (isNaN(total) || total <= 0) {
      Alert.alert("Please enter a valid number of boxes.");
      return;
    }

    if (!customerWeight || !internalWeight) {
      Alert.alert(
        "Missing Weight Info",
        "Please enter both customer and internal weights.",
      );
      return;
    }

    if (boxes.length >= total) {
      Alert.alert("You have already added all the boxes.");
      return;
    }

    setBoxes([...boxes, { type: "actual", images: [] }]);
  };

  const removeImage = (boxIndex, imageIndex) => {
    const updatedBoxes = [...boxes];
    updatedBoxes[boxIndex].images.splice(imageIndex, 1);
    setBoxes(updatedBoxes);
  };

  const pickImage = async (index, limit) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permission denied",
        "We need access to your gallery to upload images.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: limit,
      quality: 1,
    });

    if (!result.canceled) {
      const selectedImages = result.assets.map((asset) => asset.uri);
      const updatedBoxes = [...boxes];
      const currentImages = updatedBoxes[index].images || [];

      if (currentImages.length + selectedImages.length > limit) {
        Alert.alert(`You can only add up to ${limit} image(s) for this box.`);
        return;
      }

      updatedBoxes[index].images = [...currentImages, ...selectedImages];
      setBoxes(updatedBoxes);
    }
  };

  const handleWeightTypeChange = (index, type) => {
    const updated = [...boxes];
    updated[index].type = type;
    updated[index].images = [];
    setBoxes(updated);
  };

  const pickImage_rto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsMultipleSelection: true, // only works on iOS 14+ and Web
    });

    if (!result.canceled) {
      const selectedImages = result.assets.map((asset) => asset.uri);
      setImages((prev) => [...prev, ...selectedImages]);
    }
  };

  return (
    <ScrollView
      style={styles.formContainer}
      keyboardShouldPersistTaps="handled"
    >
      {/* <Text style={styles.label}>Pickup Person Distance Traveled</Text>
      <TextInput
        value={KmDriven}
        onChangeText={setKmDriven}
        placeholder="Enter Distance Traveled (KM):"
        keyboardType="numeric"
        style={styles.input}
      /> */}
      <Text style={styles.label}>Customer Weight:</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={customerWeight}
        onChangeText={setCustomerWeight}
        placeholder="Enter customer-provided weight"
      />
      <Text style={styles.label}>Internal Weight:</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={internalWeight}
        onChangeText={setInternalWeight}
        placeholder="Enter internal weight"
      />
      <Text style={styles.label}>Number of Boxes:</Text>
      <View style={styles.counterContainer}>
        <TouchableOpacity
          style={styles.counterButton}
          onPress={() => {
            if (parseInt(numBoxes) > 0) {
              setNumBoxes((prev) => String(parseInt(prev) - 1));
            }
          }}
        >
          <Text style={styles.counterText}>−</Text>
        </TouchableOpacity>

        <Text style={styles.counterValue}>{numBoxes || "0"}</Text>

        <TouchableOpacity
          style={styles.counterButton}
          onPress={() => {
            setNumBoxes((prev) => String(parseInt(prev || "0") + 1));
          }}
        >
          <Text style={styles.counterText}>＋</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.addButton} onPress={handleAddBox}>
        <Text style={styles.addButtonText}>Add Box</Text>
      </TouchableOpacity>
      {boxes.length > 0 ? (
        <Text style={[styles.label, { fontSize: 18, marginTop: 10 }]}>
          Boxes Added:
        </Text>
      ) : (
        ""
      )}
      <View>
        {boxes.map((box, index) => {
          const isVolumetric = box.type === "volumetric";
          const limit = isVolumetric ? 3 : 1;

          return (
            <View key={index} style={styles.boxContainer}>
              <Text style={styles.boxTitle}>📦 Box {index + 1}</Text>

              <Text style={styles.innerLabel}>
                Select Weight Type for this Box:
              </Text>

              <View style={styles.toggleContainer}>
                {["actual", "volumetric"].map((type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => handleWeightTypeChange(index, type)}
                    style={[
                      styles.toggleButton,
                      box.type === type && styles.activeButton,
                    ]}
                  >
                    <Text
                      style={[
                        styles.buttonText,
                        box.type === type && styles.activeText,
                      ]}
                    >
                      {type === "actual"
                        ? "Actual Weight"
                        : "Volumetric Weight"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.weightInfo}>
                <Text style={styles.weightText}>
                  Weight Type: <Text style={styles.boldText}>{box.type}</Text>
                </Text>
                <Text style={styles.weightText}>
                  Image Upload Limit: {limit}
                </Text>
              </View>

              <View style={styles.imageUploadSection}>
                <TouchableOpacity
                  onPressIn={() => setPressedBoxIndex(index)}
                  onPressOut={() => setPressedBoxIndex(null)}
                  onPress={() => pickImage(index, limit)}
                  style={[
                    styles.uploadButton,
                    pressedBoxIndex === index && styles.uploadButtonPressed,
                  ]}
                >
                  <Text style={styles.uploadText}>📷 Upload Image</Text>
                </TouchableOpacity>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.imagePreviewContainer}
                >
                  {box.images.map((uri, i) => (
                    <View key={i} style={styles.imageWrapper}>
                      <Image source={{ uri }} style={styles.uploadedImage} />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => removeImage(index, i)}
                      >
                        <Text style={styles.removeImageText}>❌</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            </View>
          );
        })}
      </View>
      <View>
        <Text style={styles.label}>RTO:</Text>
        <TextInput
          value={rto}
          onChangeText={setrto}
          placeholder="Enter RTO"
          keyboardType="default"
          style={styles.finalWeightInput}
        />
      </View>
      {/* Upload Image Section */}
      <Text style={[styles.label, { marginTop: 10 }]}>Upload Image:</Text>
      <TouchableOpacity
        onPress={pickImage_rto}
        style={[styles.uploadButton, { backgroundColor: "red" }]}
      >
        <Text style={styles.uploadButtonText}>Choose Image</Text>
      </TouchableOpacity>
      {images.length > 0 && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 10 }}>
          {images.map((uri, index) => (
            <View key={index} style={{ margin: 5, alignItems: "center" }}>
              <Image
                source={{ uri }}
                style={{ width: 100, height: 100, borderRadius: 8 }}
              />
              <TouchableOpacity
                onPress={() => {
                  const updatedImages = [...images];
                  updatedImages.splice(index, 1);
                  setImages(updatedImages);
                }}
                style={{
                  marginTop: 5,
                  backgroundColor: "#E53E3E",
                  padding: 4,
                  borderRadius: 6,
                }}
              >
                <Text style={{ color: "white", fontSize: 12 }}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
      <TouchableOpacity
        onPress={handleSubmit}
        style={[styles.button, { marginTop: 20 }]}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Submit</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

export default WeightTypeToggle;

const styles = StyleSheet.create({
  uploadButtonText: {
    color: "#fff",
    fontWeight: "bold",
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
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  button: {
    backgroundColor: "#6B21A8",
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: "center",
  },
  imageWrapper: {
    position: "relative",
    marginRight: 10,
  },
  removeImageButton: {
    position: "absolute",
    top: -1,
    right: -8,
    backgroundColor: "#fff",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  removeImageText: {
    fontSize: 12,
    color: "#ff4d4d",
  },

  outlinedButtonText: {
    color: "rgb(142, 81, 226)",
    fontSize: 16,
    fontWeight: "500",
    letterSpacing: 1,
  },
  formContainer: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  imageUploadSection: {
    marginTop: 10,
  },
  uploadButtonPressed: {
    backgroundColor: "rgb(2, 81, 226)",
  },
  uploadButton: {
    backgroundColor: "#e0e0e0",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  uploadText: {
    color: "#333",
    fontSize: 14,
  },
  imagePreviewContainer: {
    marginTop: 10,
    flexDirection: "row",
  },
  uploadedImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 10,
  },

  toggleButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#ddd",
    borderRadius: 25,
    marginRight: 10, // Add space between buttons
    marginBottom: 10, // Add margin at the bottom for vertical spacing
    justifyContent: "center",
    alignItems: "flex-end", // Align content inside the button to the right
  },
  toggleContainer: {
    flexDirection: "row",
    marginBottom: 20, // Additional space at the bottom of the container
    justifyContent: "flex-start",
  },
  toggleContainer: {
    flexDirection: "row",
    marginBottom: 20, // Added bottom margin for spacing after buttons
    justifyContent: "flex-start",
  },

  toggleButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#ddd",
    borderRadius: 25,
    marginRight: 10, // Added margin between buttons
    marginBottom: 10, // Added space at the bottom to avoid tight layout
    justifyContent: "center",
    alignItems: "flex-end", // Aligns content inside the button to the right
  },

  counterContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginBottom: 20,
  },
  counterButton: {
    backgroundColor: "rgb(142, 81, 226)", // Shiphit purple
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  counterText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  counterValue: {
    fontSize: 18,
    fontWeight: "600",
    marginHorizontal: 20,
    minWidth: 30,
    textAlign: "center",
    color: "#333",
  },
  formTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "rgb(142, 81, 226)",
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: "#333",
  },
  innerLabel: {
    fontSize: 14,
    marginBottom: 8,
    color: "#444",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 6,
    marginBottom: 20,
  },
  toggleContainer: {
    flexDirection: "row",
    marginBottom: 3,
    flexWrap: "wrap",
  },
  toggleButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#ddd",
    borderRadius: 25,
    marginRight: 10,
    marginBottom: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  activeButton: {
    backgroundColor: "rgb(142, 81, 226)",
  },
  toggleButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#ddd",
    borderRadius: 25,
    marginRight: 10,
    marginBottom: 10,
    justifyContent: "center",
    alignItems: "flex-end", // ⬅️ Aligns content inside the button to the right
  },

  activeText: {
    color: "#fff",
  },
  addButton: {
    backgroundColor: "rgb(142, 81, 226)",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginBottom: 20,
    alignItems: "center",
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#fff",
  },
  boxContainer: {
    marginTop: 15,
    marginBottom: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: "#d4d4d4",
    borderRadius: 10,
    backgroundColor: "#f3ecff",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 2,
  },
  boxTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#222",
    marginBottom: 10,
  },
  weightInfo: {
    marginTop: 1,
  },
  weightText: {
    fontSize: 14,
    color: "#555",
    marginBottom: 5,
  },
  boldText: {
    fontWeight: "bold",
    color: "#000",
  },
  imageUploadPlaceholder: {
    marginTop: 15,
    padding: 10,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 6,
    borderColor: "#ccc",
    alignItems: "center",
  },
});
