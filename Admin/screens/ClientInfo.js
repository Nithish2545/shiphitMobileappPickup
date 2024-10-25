import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  TextInput,
  View,
  TouchableOpacity,
  Text,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import ClientImageRender from "./ClientImageRender";
import { SafeAreaView } from "react-native-safe-area-context";
import { storage } from "../../FirebaseConfig";
import { getDownloadURL, listAll, ref } from "firebase/storage";
import { StyleSheet } from "react-native";
import AntDesign from "@expo/vector-icons/AntDesign";

export const ClientInfo = () => {
  const navigation = useNavigation();
  const [imageUrls, setImageUrls] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [mainFolders, setMainFolders] = useState([]);
  const [filteredData, setFilteredData] = useState({});
  const [awbNumber, setAwbNumber] = useState(""); // Changed to string for AWB number

  useEffect(() => {
    const fetchFolders = async () => {
      const rootRef = ref(storage, "/"); // Reference to the root of your storage
      try {
        const result = await listAll(rootRef);
        const folderNames = result.prefixes.map((prefix) => prefix.name); // Get folder names
        setMainFolders(folderNames); // Set folder names in state
      } catch (error) {
        console.error("Error fetching folder names: ", error);
      }
    };
    fetchFolders();
  }, []);

  useEffect(() => {
    const fetchImages = async () => {
      const subFolders = {
        pickupPersonImages: "PICKUPPERSONIMAGE/",
        kycImages: "KYC/",
        productImage: "PRODUCT IMAGES/",
        packageWeight: "PACKAGE WEIGHT/",
        formImage: "FORM IMAGES/",
        finalimageweight: "FINAL IMAGE WEIGHT",
        paymentProof: "PAYMENT PROOF/",
        awbImages: "AWB NUMBER IMAGE/",
      };
      const allImages = {};
      for (const folder of mainFolders) {
        allImages[folder] = {};
        for (const [key, subFolder] of Object.entries(subFolders)) {
          const path = `${folder}/${subFolder}`;
          const folderRef = ref(storage, path);
          try {
            const result = await listAll(folderRef);
            const urlPromises = result.items.map((imageRef) =>
              getDownloadURL(imageRef)
            );
            const urls = await Promise.all(urlPromises);
            allImages[folder][key] = urls; // Store URLs under the respective folder and key
          } catch (error) {
            console.error(`Error fetching images from ${path}: `, error);
          }
        }
      }
      setImageUrls(allImages);
      setLoading(false);
    };
    if (mainFolders.length > 0) {
      fetchImages(); // Fetch images if folders are available
    }
  }, [mainFolders]);

  const openModal = (imageUrl) => {
    setSelectedImage(imageUrl);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setSelectedImage(null);
  };

  // Filter the images based on AWB number
  useEffect(() => {
    const filtered = awbNumber
      ? Object.fromEntries(
          Object.entries(imageUrls).filter(([folder]) =>
            folder.includes(awbNumber)
          )
        )
      : imageUrls; // Reset to all images if no AWB number
    setFilteredData(filtered);
  }, [awbNumber, imageUrls]);

  return (
    <SafeAreaView style={{ flex: 1, padding: 10, position: "relative" }}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6200EA" />
          <Text style={styles.loadingText}>Loading images...</Text>
        </View>
      ) : (
        <ScrollView style={{ marginTop: 120 }}>
          {Object.keys(filteredData).length > 0 ? (
            Object.keys(filteredData).map((folder) => (
              <ClientImageRender
                key={folder}
                loading={loading}
                imageUrls={filteredData[folder]} // Pass images for this folder
                selectedImage={selectedImage}
                isModalVisible={isModalVisible}
                openModal={openModal}
                closeModal={closeModal}
                awbnumber={folder}
              />
            ))
          ) : (
            <Text style={styles.noResultsText}>
              No images found for the given AWB number.
            </Text>
          )}
        </ScrollView>
      )}
      <View style={styles.buttonContainer}>
        <AntDesign
          style={{ display: "flex", alignSelf: "flex-start", marginBottom: 10 }}
          name="arrowleft"
          size={24}
          color="black"
          onPress={() => navigation.goBack()}
        />
        <View style={{ display: "flex", flexDirection: "row", gap: 20 }}>
          <TouchableOpacity style={styles.datePickerInput}>
            <TextInput
              style={styles.datePickerText}
              onChangeText={(text) => setAwbNumber(text)} // Set the state with the input value
              placeholder="Enter AWB Number" // Set placeholder
              value={awbNumber} // Bind the input to awbNumber state
            />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    position: "absolute",
    top: 10, // Adjust top position as needed
    left: 10, // Adjust left position as needed
    zIndex: 10, // Ensure the button is on top
    padding: 10, // Optional: Add padding
    borderRadius: 5, // Optional: Add border radius
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#6200EA",
  },
  noResultsText: {
    textAlign: "center",
    fontSize: 16,
    color: "gray",
    marginTop: 20,
  },
  datePickerInput: {
    borderWidth: 1,
    borderColor: "#8647D3",
    borderRadius: 5,
    backgroundColor: "#fff",
    display: "flex",
    alignSelf: "flex-start",
  },
  datePickerText: {
    color: "black",
    fontSize: 16,
    height: 40,
    padding: 10,
  },
  clearButton: {
    backgroundColor: "#6200ea", // Purple button background
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
});

export default ClientInfo;
