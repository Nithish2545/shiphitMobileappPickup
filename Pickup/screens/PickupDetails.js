import { useEffect, useState } from "react";
import styles from "./PickupDetails_stylesheet.js";
import {
  View,
  Text,
  TextInput,
  Button,
  ActivityIndicator,
  ScrollView,
  Image,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../FirebaseConfig";
import * as ImagePicker from "expo-image-picker";
import { TouchableOpacity } from "react-native";
import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import * as MediaLibrary from "expo-media-library";
import axios from "axios"; // axios is not explicitly used here but included in imports
import DB from "../../Utility/DB";
import FileInput from "../atomic_components/FileInput.js";
import utility from "../../Utility/utility.js";
import formatFirestoreTimestamp from "../../Utility/formatFirestoreTimestamp.js";

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
  const [image, setImage] = useState(null); // This is likely for the single image display
  const [timestamp, setTimestamp] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [PickupersonImage, setPickupersonImage] = useState([]); // This stores the URI for upload

  // New state to store the document ID for direct update
  const [documentId, setDocumentId] = useState(null);

  const formatToIST = (exifDateTime) => {
    if (!exifDateTime) return "Unknown date";
    const parts = exifDateTime.split(" ");
    if (parts.length !== 2) return "Invalid date format";

    const [datePart, timePart] = parts;
    const [year, month, day] = datePart.split(":");
    const [hours, minutes, seconds] = timePart.split(":");

    const dateObj = new Date(
      `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
    );

    let localHours = dateObj.getHours();
    const localMinutes = dateObj.getMinutes().toString().padStart(2, "0");
    const amPm = localHours >= 12 ? "PM" : "AM";
    localHours = localHours % 12 || 12;

    const formattedDate = `${dateObj.getDate().toString().padStart(2, "0")}-${(
      dateObj.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}-${dateObj.getFullYear()}`;
    const formattedTime = `${localHours}:${localMinutes} ${amPm}`;

    return `${formattedDate} ${formattedTime}`;
  };

  // Modified to take folder and awbNumber as arguments for dynamic path
  const uploadImage = async (uri, currentAwbNumber) => {
    if (!uri) {
      return null; // Return null if no URI to prevent errors
    }

    const response = await fetch(uri);
    const blob = await response.blob();

    const storageRef = ref(
      storage,
      `${currentAwbNumber}/${"PICKUPPERSONIMAGE"}/${"Image"}`
    );

    try {
      await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(storageRef);
      return url;
    } catch (error) {
      console.error("Upload failed for PickupersonImage:", error);
      throw error; // Re-throw to be caught by handleSubmit's try/catch
    }
  };

  const removeImage = () => {
    setImage(null);
    setTimestamp(null);
    setMetadata(null);
    setPickupersonImage([]); // Clear the stored URI as well
  };

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const q = query(
          collection(db, DB.db_collection),
          where("status", "==", "RUN SHEET"),
          where("awbNumber", "==", awbnumber)
        );

        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const docData = querySnapshot.docs[0].data();
          const docId = querySnapshot.docs[0].id; // Get the document ID

          setDetails(docData);
          setDocumentId(docId); // Store the document ID in state
          setPickupWeight(docData?.pickupWeight || "");
          setNumberOfPackages(docData?.numberOfPackages || 1);
        } else {
          console.log("No data found for the provided awbNumber and status.");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load details. Please try again."); // Set user-friendly error
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [awbnumber]); // Add awbnumber to dependency array

  const uploadFileToFirebase = async (file, folder) => {
    try {
      const response = await fetch(file.uri);
      const blob = await response.blob();
      const storageRef = ref(
        storage,
        `${awbnumber}/${folder}/${file.fileName}`
      );
      await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(storageRef);
      return url;
    } catch (error) {
      console.error(`Upload failed for ${folder}/${file.fileName}:`, error);
      throw error; // Re-throw to be caught by handleSubmit's try/catch
    }
  };

  // const pickImage = async () => {
  //   const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  //   if (status !== "granted") {
  //     return;
  //   }

  //   const result = await ImagePicker.launchImageLibraryAsync({
  //     mediaTypes: ImagePicker.MediaTypeOptions.Images,
  //     exif: true,
  //   });

  //   if (!result.canceled) {
  //     console.log("result", result.assets[0].uri);

  //     setImage(result.assets[0].uri);
  //     if (result.assets[0].exif) {
  //       setMetadata(result.assets[0].exif);
  //       setTimestamp(
  //         formatToIST(result.assets[0].exif.DateTime) || "Unknown date"
  //       );
  //     } else {
  //       setTimestamp(new Date().toString());
  //     }
  //     setPickupersonImage([result.assets[0].uri]); // Store the URI for later upload
  //   }
  // };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      alert("Camera permission is required to take a photo.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      exif: true,
      quality: 1,
    });

    if (!result.canceled) {
      console.log("result", result.assets[0].uri);

      setImage(result.assets[0].uri);
      if (result.assets[0].exif) {
        setMetadata(result.assets[0].exif);
        setTimestamp(
          formatToIST(result.assets[0].exif.DateTime) || "Unknown date"
        );
      } else {
        setTimestamp(new Date().toString());
      }
      setPickupersonImage([result.assets[0].uri]); // Store the URI for later upload
    }
  };

  const handleFileChange = async (folder, setState) => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
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

    if (PickupersonImage.length === 0 || PickupersonImage.length > 1) {
      setFormError("Picture Is Required!");
      return false;
    }

    if (!pickupWeight || !numberOfPackages) {
      setFormError("Pickup weight and number of packages are required.");
      return false;
    }

    setFormError("");
    return true;
  };

  const PickupCompletedDate = () => {
    const now = new Date();
    const day = now.getDate();
    const month = now.getMonth() + 1;

    const istTime = now
      .toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "numeric",
        hour12: true,
      })
      .toUpperCase();

    return `${day}-${month} &${istTime}`;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setSubmitLoading(true);
    try {
      if (!details || !documentId) {
        throw new Error("User details or document ID not found");
      }

      const productImagePromises = productImages.map((file) =>
        uploadFileToFirebase(file, "PRODUCT IMAGES")
      );
      const packageWeightImagePromises = packageWeightImages.map((file) =>
        uploadFileToFirebase(file, "PACKAGE WEIGHT")
      );
      const formImagePromises = formImages.map((file) =>
        uploadFileToFirebase(file, "FORM IMAGES")
      );
      const pickupPersonImagePromise = uploadImage(
        PickupersonImage[0],
        awbnumber
      );

      const [
        productImageUrls,
        packageWeightImageUrls,
        formImageUrls,
        pickupPersonImageUrl,
      ] = await Promise.all([
        Promise.all(productImagePromises),
        Promise.all(packageWeightImagePromises),
        Promise.all(formImagePromises),
        pickupPersonImagePromise,
      ]);

      const updatedFields = {
        postPickupWeight: `${pickupWeight} KG`,
        postNumberOfPackages: numberOfPackages,
        status: "INCOMING MANIFEST",
        pickUpPersonNameStatus: "PICKUP COMPLETED",
        PRODUCTSIMAGE: productImageUrls,
        PACKAGEWEIGHTIMAGES: packageWeightImageUrls,
        FORMIMAGES: formImageUrls,
        pickupCompletedDatatime: PickupCompletedDate(),
        PickupImageTakenTime: timestamp,
        PickupPersonImageURL: pickupPersonImageUrl,
      };

      const docRef = doc(db, DB.db_collection, documentId);
      await updateDoc(docRef, updatedFields);

      await utility.sendWaMessage_PickupCompleted(
        details.consignorname,
        String(details.awbNumber),
        String(details.consignorphonenumber),
        String(details.awbHashedValue)
      );

      navigation.navigate("Pickup");
    } catch (error) {
      handleError(error);
      console.log(error);
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
    setImage(null); // Clear the displayed image as well
    setTimestamp(null);
    setMetadata(null);
    setPickupersonImage([]); // Clear the URI for the person's image
  };

  console.log("PickupersonImage", PickupersonImage);
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
    navigation.navigate("Pickup");
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
              <Text style={styles.label}>Consignor:</Text>
              <Text style={styles.text}>{details.consignorname}</Text>
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
              <Text style={styles.text}>{details.consignorphonenumber}</Text>
            </View>
            <View style={styles.detailContainer}>
              <Text style={styles.label}>Pickup DateTime:</Text>
              <Text style={styles.text}>
                {formatFirestoreTimestamp(details.pickupDatetime)}
              </Text>
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
                label="Customer Product Images (1-5)"
                files={productImages}
                onAddFiles={() =>
                  handleFileChange("PRODUCT IMAGES", setProductImages)
                }
                onRemoveFile={(fileName) =>
                  handleRemoveFile(fileName, setProductImages)
                }
              />
              <FileInput
                label="Box Weight Images (1-5)"
                files={packageWeightImages}
                onAddFiles={() =>
                  handleFileChange("PACKAGE WEIGHT", setPackageWeightImages)
                }
                onRemoveFile={(fileName) =>
                  handleRemoveFile(fileName, setPackageWeightImages)
                }
              />
              <FileInput
                label="Acknowledgment Form Images (1-2)"
                files={formImages}
                onAddFiles={() =>
                  handleFileChange("FORM IMAGES", setFormImages)
                }
                onRemoveFile={(fileName) =>
                  handleRemoveFile(fileName, setFormImages)
                }
              />

              <View style={styles.container2}>
                {image ? (
                  <View style={styles.imageContainer}>
                    <Image source={{ uri: image }} style={styles.image} />
                    <Button
                      title="Remove Image"
                      onPress={removeImage}
                      color="red"
                    />
                  </View>
                ) : (
                  <View style={styles.buttonContainer2}>
                    <Text
                      style={{
                        color: "white",
                        fontSize: 16,
                        textAlign: "center",
                      }}
                      onPress={pickImage}
                    >
                      Take a Live Picture
                    </Text>
                    <View style={styles.buttonContainer}>
                      <Text
                        style={{
                          color: "white",
                          fontSize: 16,
                          textAlign: "center",
                        }}
                        onPress={pickImage}
                      >
                        Pick an Image from Gallery
                      </Text>
                    </View>
                  </View>
                )}
                {image && (
                  <View style={styles.removeButtonContainer}>
                    <Button
                      title="Remove Uploaded Image"
                      onPress={removeImage}
                      color="#8447D6"
                    />
                  </View>
                )}
              </View>
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

export default PickupDetails;
