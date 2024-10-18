import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
} from "react-native";

const ClientImageRender = ({
  awbnumber,
  loading,
  imageUrls,
  selectedImage,
  isModalVisible,
  openModal,
  closeModal,
}) => {
  return (
    <View style={styles.container}>
      <Text style={{ fontSize: 20, fontWeight: "800" }}>{awbnumber}</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#6200ea" />
      ) : (
        <View>
          {Object.keys(imageUrls).map((category) => {
            const images = imageUrls[category]; // Get the images for this category
            // Check if there are images in this category
            if (!images || images.length === 0) return null; // Skip rendering if no images
            return (
              <View key={category} style={styles.categoryContainer}>
                <Text style={styles.categoryTitle}>
                  {category.replace(/([A-Z])/g, " $1").trim()}{" "}
                  {/* Convert camelCase to spaced words */}
                </Text>
                <View style={styles.imageGrid}>
                  {images.map((url, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => openModal(url)} // Open modal with the selected image URL
                      style={styles.card}
                    >
                      <Image source={{ uri: url }} style={styles.image} />
                      <Text style={styles.imageText}>Image {index + 1}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      )}
      {/* Modal to display full image */}
      <Modal visible={isModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.emptySpace}
            activeOpacity={1}
            onPress={closeModal} // Close modal on outside touch
          >
            {/* Empty space to capture outside clicks */}
          </TouchableOpacity>
          <View style={styles.modalContent}>
            {selectedImage && (
              <Image
                source={{ uri: selectedImage }} // Display the selected image
                style={styles.fullImage}
                resizeMode="contain" // Ensure image fits inside modal
              />
            )}
            {/* Close Button */}
          </View>
        </View>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={closeModal} // Close the modal when button is pressed
        >
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flexGrow: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    backgroundColor: "#fff",
    marginTop: 10,
    marginBottom: 10,
    shadowColor: "#000", // Color of the shadow
    shadowOffset: { width: 0, height: 2 }, // Offset of the shadow
    shadowOpacity: 0.25, // Opacity of the shadow
    shadowRadius: 3.5, // Blur radius of the shadow
    elevation: 5, // Elevation for Android
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  categoryContainer: {
    marginBottom: 30,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    margin: 10,
    width: 130,
    alignItems: "center",
    padding: 10,
  },
  image: {
    width: "100%",
    height: 100,
    borderRadius: 10,
  },
  imageText: {
    marginTop: 8,
    fontSize: 16,
    color: "#555",
    textAlign: "center",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)", // Dark background
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  emptySpace: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: -1, // Ensure it sits behind the image
  },
  modalContent: {
    width: "100%",
    height: "80%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    padding: 20,
  },
  fullImage: {
    width: "100%",
    height: "100%",
  },
  closeButton: {
    backgroundColor: "#6200ea",
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
    top: 30,
    right: 25,
    position: "absolute",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default ClientImageRender;