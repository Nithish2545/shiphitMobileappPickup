import React, { useState } from "react";
import { View, Button, Image, Text, StyleSheet, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import { getStorage, ref, uploadBytes } from "firebase/storage"; // Import Firebase Storage

const UploadImageCom = () => {
  const [image, setImage] = useState(null);
  const [timestamp, setTimestamp] = useState(null);
  const [metadata, setMetadata] = useState(null);

  // Initialize Firebase Storage
  const storage = getStorage(); // Make sure Firebase is initialized

  const formatToIST = (exifDateTime) => {
    if (!exifDateTime) return "Unknown date"; // Handle null case

    const parts = exifDateTime.split(" ");
    if (parts.length !== 2) return "Invalid date format"; // Check for the correct format

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

  const pickImage = async () => {
    const permissionResult = await MediaLibrary.requestPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        "Permission Required",
        "Permission to access the media library is required!"
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      exif: true,
    });

    if (!result.cancelled) {
      setImage(result.assets[0].uri); // Ensure the correct URI is set from assets

      if (result.assets[0].exif) {
        setMetadata(result.assets[0].exif);
        setTimestamp(result.assets[0].exif.DateTime || "Unknown date");
      } else {
        setTimestamp(new Date().toString());
      }
    }
  };

  console.log("setTimestamp", formatToIST(timestamp));

  const uploadImage = async (uri) => {
    if (!uri) {
      Alert.alert("No Image Selected", "Please select an image to upload.");
      return;
    }

    const response = await fetch(uri);
    const blob = await response.blob(); // Convert the image to a Blob

    const storageRef = ref(storage, `images/${new Date().getTime()}`); // Create a reference in Firebase Storage
    try {
      await uploadBytes(storageRef, blob); // Upload the Blob
      console.log("Upload successful");
      Alert.alert("Success", "Image uploaded successfully!");
    } catch (error) {
      console.error("Upload failed:", error);
      Alert.alert("Upload failed", "There was an error uploading your image.");
    }
  };

  const handleSubmit = () => {
    uploadImage(image); // Call upload function when submit is clicked
  };

  const removeImage = () => {
    setImage(null);
    setTimestamp(null);
    setMetadata(null);
  };

  return (
    <View style={styles.container}>
      {image ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: image }} style={styles.image} />
          <Button title="Remove Image" onPress={removeImage} color="red" />
        </View>
      ) : (
        <View style={styles.buttonContainer2}>
          <Text style={styles.subtitle2}>Upload Your Image (taken now):</Text>
          <View style={styles.buttonContainer}>
            <Text
              style={{ color: "white", fontSize: 16, textAlign: "center" }}
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
      {image && (
        <View style={styles.submitButtonContainer}>
          <Button title="Submit Image" onPress={handleSubmit} color="#8447D6" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  subtitle2: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#8447D6",
    marginVertical: 8,
    marginBottom: 10,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F0F4F8", // Light background color
    paddingTop: 10,
    paddingBottom: 20,
  },
  imageContainer: {
    alignItems: "center",
    marginBottom: 20,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#fff",
    shadowColor: "#000", // Adding shadow for depth
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 5,
  },
  image: {
    width: 200,
    height: 200,
    marginBottom: 10,
    borderRadius: 10, // Rounded corners for the image
    resizeMode: "cover", // Cover the area
  },
  buttonContainer: {
    marginBottom: 10,
    color: "red",
    width: "100%",
    backgroundColor: "#8447D6",
    padding: 10,
    fontSize: 18,
  },
  buttonContainer2: {
    marginBottom: 10,
    width: "100%",
    padding: 10,
    fontSize: 18,
  },
  removeButtonContainer: {
    marginTop: 10,
  },
  submitButtonContainer: {
    marginTop: 10,
  },
});

export default UploadImageCom;
