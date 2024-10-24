import { useRoute } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Image,
  Modal,
  TouchableOpacity,
} from "react-native";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../FirebaseConfig";
import { useNavigation } from "@react-navigation/native";
import AntDesign from "@expo/vector-icons/AntDesign";

function CardDetails() {
  const route = useRoute();
  const { awbnumber } = route.params;
  const [details, setDetails] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null); // State to track the selected image
  const [modalVisible, setModalVisible] = useState(false); // State to track modal visibility
  const navigation = useNavigation(); // Access navigation prop

  // Function to handle image click
  function handleImageClick(imageUri) {
    console.log("imageUri", imageUri);
    setSelectedImage(imageUri); // Set the clicked image URI to state
    setModalVisible(true); // Show the modal
  }

  // Function to close the modal
  const closeModal = () => {
    setModalVisible(false);
    setSelectedImage(null); // Clear the selected image when closing modal
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Create a query to find the document with the matching awbNumber
        const q = query(
          collection(db, "pickup"),
          where("awbNumber", "==", awbnumber)
        );

        // Fetch the query results from Firestore
        const querySnapshot = await getDocs(q);

        // Assuming awbNumber is unique, we'll grab the first result
        const result = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        if (result.length > 0) {
          setDetails(result[0]); // Set the details if a match is found
        } else {
          console.error(`No document found with AWB number: ${awbnumber}`);
        }
      } catch (error) {
        console.error("Error fetching document from Firestore:", error);
      }
    };

    fetchData(); // Call the fetchData function on component mount
  }, [awbnumber]); // Add awbnumber as a dependency

  const downloadImage = async (imageUri) => {
    const fileName = imageUri.split("/").pop(); // Get the image file name from the URL
    const downloadDest = `${FileSystem.documentDirectory}${fileName}`; // Destination path

    try {
      const response = await FileSystem.downloadAsync(imageUri, downloadDest);

      if (response.status === 200) {
        Alert.alert("Success", "Image downloaded successfully!");
      } else {
        Alert.alert("Error", "Failed to download image.");
      }
    } catch (error) {
      console.error("Download error: ", error);
      Alert.alert("Error", "An error occurred while downloading the image.");
    }
  };

  if (!details) return <ActivityIndicator size="large" color="#6200EE" />;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity>
          <AntDesign
            name="arrowleft"
            size={32}
            color="black"
            onPress={() => navigation.goBack()}
          />
          <Text style={styles.title}>Card Details</Text>
        </TouchableOpacity>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Consignor Details</Text>
          <Text style={styles.item}>
            <Text style={styles.label}>Name: </Text>
            {details.consignorname}
          </Text>
          <Text style={styles.item}>
            <Text style={styles.label}>Phone: </Text>
            {details.consignorphonenumber}
          </Text>
          <Text style={styles.item}>
            <Text style={styles.label}>Location: </Text>
            {details.consignorlocation}
          </Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Consignee Details</Text>
          <Text style={styles.item}>
            <Text style={styles.label}>Name: </Text>
            {details.consigneename != "" ? details.consigneename : "N/A"}
          </Text>
          <Text style={styles.item}>
            <Text style={styles.label}>Phone: </Text>
            {details.consigneephonenumber != ""
              ? details.consigneephonenumber
              : "N/A"}
          </Text>
          <Text style={styles.item}>
            <Text style={styles.label}>Location: </Text>
            {details.consigneelocation != ""
              ? details.consigneelocation
              : "N/A"}
          </Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Shipment Details</Text>
          <Text style={styles.item}>
            <Text style={styles.label}>Content: </Text>
            {details.content}
          </Text>
          <Text style={styles.item}>
            <Text style={styles.label}>Destination: </Text>
            {details.destination}
          </Text>
          <Text style={styles.item}>
            <Text style={styles.label}>Weight (Approx): </Text>
            {details.weightapx}
          </Text>
          <Text style={styles.item}>
            <Text style={styles.label}>Pickup Instructions: </Text>
            {details.pickupInstructions}
          </Text>
          <Text style={styles.item}>
            <Text style={styles.label}>AWB Number: </Text>
            {details.awbNumber}
          </Text>
          <Text style={styles.item}>
            <Text style={styles.label}>Vendor: </Text>
            {details.vendorName}
          </Text>
          <Text style={styles.item}>
            <Text style={styles.label}>Pickup Date & Time: </Text>
            {details.pickupDatetime}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Post Pickup Details</Text>
          <Text style={styles.item}>
            <Text style={styles.label}>Post Packages: </Text>
            {details.postNumberOfPackages != ""
              ? details.postNumberOfPackages
              : "N/A"}
          </Text>
          <Text style={styles.item}>
            <Text style={styles.label}>Post Pickup Weight: </Text>
            {details.postPickupWeight != "" ? details.postPickupWeight : "N/A"}
          </Text>
          <Text style={styles.item}>
            <Text style={styles.label}>Actual Packages: </Text>
            {details.actualNoOfPackages != ""
              ? details.actualNoOfPackages
              : "N/A"}
          </Text>
          <Text style={styles.item}>
            <Text style={styles.label}>Actual Weight: </Text>
            {details.actualWeight != "" ? details.actualWeight : "N/A"}
          </Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Status</Text>
          <Text
            style={[
              styles.item,
              styles.status,
              details.status === "PAYMENT PENDING"
                ? styles.pending
                : styles.done,
            ]}
          >
            <Text style={styles.label}>Status: </Text>
            {details.status}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Additional Information</Text>
          <Text style={styles.item}>
            <Text style={styles.label}>Pickup Booked By: </Text>
            {details.pickupBookedBy}
          </Text>
          <Text style={styles.item}>
            <Text style={styles.label}>Pick Up Person: </Text>
            {details.pickUpPersonName}
          </Text>
          <Text style={styles.item}>
            <Text style={styles.label}>Pickup Area: </Text>
            {details.pickuparea}
          </Text>
          <Text style={styles.item}>
            <Text style={styles.label}>RTO (If Any): </Text>
            {details.rtoIfAny}
          </Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardtext}>KYC</Text>
          {typeof details.KycImage === "string" ? (
            <TouchableOpacity
              onPress={() => handleImageClick(details.KycImage)}
            >
              <Image source={{ uri: details.KycImage }} style={styles.image} />
            </TouchableOpacity>
          ) : details.KycImage.length > 0 ? (
            <View style={styles.imageGrid}>
              {console.log("testing")}
              {details.KycImage.map((imageUri, index) => (
                <>
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleImageClick(imageUri)}
                  >
                    <Image source={{ uri: imageUri }} style={styles.image} />
                  </TouchableOpacity>
                  {/* <TouchableOpacity onPress={() => downloadImage(imageUri)}>
                    <Text style={styles.downloadButton}>Download</Text>
                  </TouchableOpacity> */}
                </>
              ))}
            </View>
          ) : (
            <View style={styles.imageGrid}>
              <Text style={styles.placeholderText}>No KYC Image Available</Text>
            </View>
          )}
        </View>
        <View style={styles.card}>
          <Text style={styles.cardtext}>PRODUCTS IMAGE</Text>
          {typeof details.PRODUCTSIMAGE === "string" ? (
            <TouchableOpacity
              onPress={() => handleImageClick(details.PRODUCTSIMAGE)}
            >
              <Image
                source={{ uri: details.PRODUCTSIMAGE }}
                style={styles.image}
              />
            </TouchableOpacity>
          ) : typeof details.PRODUCTSIMAGE === "object" ? (
            <View style={styles.imageGrid}>
              {details.PRODUCTSIMAGE.map((imageUri, index) => (
                <TouchableOpacity onPress={() => handleImageClick(imageUri)}>
                  <Image
                    key={index}
                    source={{ uri: imageUri }}
                    style={styles.image}
                  />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={styles.placeholderText}>
              No PRODUCTS IMAGE Available
            </Text>
          )}
        </View>
        <View style={styles.card}>
          <Text style={styles.cardtext}>PACKAGE WEIGHT IMAGES</Text>
          {typeof details.PACKAGEWEIGHTIMAGES === "string" ? (
            <TouchableOpacity
              onPress={() => handleImageClick(details.PACKAGEWEIGHTIMAGES)}
            >
              <Image
                source={{ uri: details.PACKAGEWEIGHTIMAGES }}
                style={styles.image}
              />
            </TouchableOpacity>
          ) : typeof details.PACKAGEWEIGHTIMAGES === "object" ? (
            <View style={styles.imageGrid}>
              {details.PACKAGEWEIGHTIMAGES.map((imageUri, index) => (
                <TouchableOpacity onPress={() => handleImageClick(imageUri)}>
                  <Image
                    key={index}
                    source={{ uri: imageUri }}
                    style={styles.image}
                  />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={styles.placeholderText}>
              No PACKAGE WEIGHT IMAGES Available
            </Text>
          )}
        </View>
        <View style={styles.card}>
          <Text style={styles.cardtext}>FORM IMAGES</Text>
          <View style={styles.imagegrid}>
            {typeof details.FORMIMAGES === "string" ? (
              <TouchableOpacity
                onPress={() => handleImageClick(details.FORMIMAGES)}
              >
                <Image
                  source={{ uri: details.FORMIMAGES }}
                  style={styles.image}
                />
              </TouchableOpacity>
            ) : typeof details.FORMIMAGES === "object" ? (
              <View style={styles.imageGrid}>
                {details.FORMIMAGES.map((imageUri, index) => (
                  <TouchableOpacity onPress={() => handleImageClick(imageUri)}>
                    <Image
                      onPress={() => handleImageClick(imageUri)}
                      key={index}
                      source={{ uri: imageUri }}
                      style={styles.image}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={styles.placeholderText}>
                No FORM IMAGES Available
              </Text>
            )}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardtext}>FINAL WEIGHT IMAGE</Text>
          <View style={styles.imagegrid}>
            {typeof details.finalWeightImage === "string" ? (
              <TouchableOpacity
                onPress={() => handleImageClick(details.finalWeightImage)}
              >
                <Image
                  source={{ uri: details.finalWeightImage }}
                  style={styles.image}
                />
              </TouchableOpacity>
            ) : typeof details.finalWeightImage === "object" ? (
              <View style={styles.imageGrid}>
                {details.finalWeightImage.map((imageUri, index) => (
                  <TouchableOpacity onPress={() => handleImageClick(imageUri)}>
                    <Image
                      key={index}
                      source={{ uri: imageUri }}
                      style={styles.image}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={{ backgroundColor: "red" }}>
                No FINAL WEIGHT Available
              </Text>
            )}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardtext}>PAYMENT PROOF IMAGE</Text>
          <View style={styles.imagegrid}>
            {typeof details.paymentProof === "string" ? (
              <TouchableOpacity
                onPress={() => handleImageClick(details.paymentProof)}
              >
                <Image
                  source={{ uri: details.paymentProof }}
                  style={styles.image}
                />
              </TouchableOpacity>
            ) : typeof details.paymentProof === "object" ? (
              <View style={styles.imageGrid}>
                {details.paymentProof.map((imageUri, index) => (
                  <TouchableOpacity onPress={() => handleImageClick(imageUri)}>
                    <Image
                      key={index}
                      source={{ uri: imageUri }}
                      style={styles.image}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text>No PAYMENT PROOF Available</Text>
            )}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardtext}>AWB NUMBER IMAGE</Text>
          <View style={styles.imagegrid}>
            {typeof details.AWbNumberImage === "string" ? (
              <TouchableOpacity
                onPress={() => handleImageClick(details.AWbNumberImage)}
              >
                <Image
                  source={{ uri: details.AWbNumberImage }}
                  style={styles.image}
                />
              </TouchableOpacity>
            ) : typeof details.AWbNumberImage === "object" ? (
              <View style={styles.imageGrid}>
                {details.AWbNumberImage.map((imageUri, index) => (
                  <TouchableOpacity onPress={() => handleImageClick(imageUri)}>
                    <Image
                      key={index}
                      source={{ uri: imageUri }}
                      style={styles.image}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text>No AWB Number Image Available</Text>
            )}
          </View>
        </View>

        <Modal visible={modalVisible} transparent={true} animationType="fade">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              {selectedImage && (
                <Image
                  source={{ uri: selectedImage }}
                  style={styles.modalImage}
                />
              )}
            </View>
            <TouchableOpacity onPress={closeModal} style={styles.testing}>
              <Text style={styles.closeButton}>Close</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  cardtext: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 15,
  },
  image: {
    width: "100%",
    height: 250,
    objectFit: "cover",
    borderRadius: 10,
  },
  imageGrid:{
    gap:30
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  container: {
    padding: 16,
    paddingTop: 20,
    backgroundColor: "#f5f5f5",
    flexGrow: 1,
    minHeight: "100%",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#6200EE",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    marginBottom: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    marginTop: 10,
  },
  item: {
    marginBottom: 10,
    fontSize: 16,
    color: "#555",
  },
  label: {
    fontWeight: "bold",
    color: "#333",
  },
  status: {
    fontSize: 18,
    fontWeight: "bold",
    padding: 10,
    textAlign: "center",
    borderRadius: 5,
  },
  pending: {
    color: "red",
    backgroundColor: "#fdecea",
  },
  done: {
    color: "green",
    backgroundColor: "#e8f5e9",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    position: "relative",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)", // Dark background for modal
  },
  modalContent: {
    backgroundColor: "#fff",
    // padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  imagegrid: {
    display: "flex",
    gap: 20,
  },
  modalImage: {
    width: 350,
    height: 500,
    borderRadius: 10,
    objectFit: "contain",
  },
  testing: {
    position: "absolute", // Absolute positioning
    top: 40,
    right: 10,
  },
  closeButton: {
    color: "white",
    paddingLeft: 10,
    paddingRight: 10,
    paddingBottom: 5,
    paddingTop: 5,
    fontSize: 18,
    marginBottom: 10,
    borderRadius: 4,
    backgroundColor: "purple",
    margin: 20,
  },
});

export default CardDetails;
