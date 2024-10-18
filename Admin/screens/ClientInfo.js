import React, { useEffect, useState } from "react";
import { Button, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import ClientImageRender from "./ClientImageRender";
import { SafeAreaView } from "react-native-safe-area-context";
import { storage } from "../../FirebaseConfig";
import { getDownloadURL, listAll, ref } from "firebase/storage";
import { View } from "react-native-web";
import { StyleSheet } from "react-native";

export const ClientInfo = () => {
  const navigation = useNavigation();
  const [imageUrls, setImageUrls] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [mainFolders, setMainFolders] = useState([]);

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
        awbImages: "AWB NUMBER IMAGE/",
        kycImages: "KYC/",
        finalImages: "FINAL IMAGE WEIGHT/",
        pickupImages: "PICKUPPERSONIMAGE/",
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

  return (
    <SafeAreaView style={{ flex: 1, padding: 10, position: "relative" }}>
      <ScrollView>
        {Object.keys(imageUrls).map((folder) => (
          <ClientImageRender
            key={folder}
            loading={loading}
            imageUrls={imageUrls[folder]} // Pass images for this folder
            selectedImage={selectedImage}
            isModalVisible={isModalVisible}
            openModal={openModal}
            closeModal={closeModal}
            awbnumber={folder}
          />
        ))}
      </ScrollView>
      <View style={styles.buttonContainer}>
        <Button title="Go Back" onPress={() => navigation.goBack()} />
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
    backgroundColor: "#fff", // Optional: Add background color to the button container
    padding: 10, // Optional: Add padding
    borderRadius: 5, // Optional: Add border radius
    elevation: 5, // Optional: Add elevation for Android shadow
    shadowColor: "#000", // Optional: Shadow color for iOS
    shadowOffset: { width: 0, height: 2 }, // Optional: Shadow offset
    shadowOpacity: 0.25, // Optional: Shadow opacity
    shadowRadius: 3.5, // Optional: Shadow radius
  },
});

export default ClientInfo;