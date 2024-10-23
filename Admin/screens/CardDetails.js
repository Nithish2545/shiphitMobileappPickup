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
} from "react-native";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../FirebaseConfig";
import { TouchableOpacity } from "react-native";
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
  const handleImageClick = (imageUri) => {
    setSelectedImage(imageUri); // Set the clicked image URI to state
    setModalVisible(true); // Show the modal
  };

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

  if (!details) return <ActivityIndicator size="large" color="#6200EE" />;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AntDesign name="arrowleft" size={32} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>Card Details</Text>
        {/* <View style={styles.card}>
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
          {console.log(details)}
        </View>
         */}
        <View style={styles.card}>
          <Text style={styles.cardtext}>KYC</Text>
          <TouchableOpacity onPress={() => handleImageClick(details.KycImage)}>
            <Image source={{ uri: details.KycImage }} style={styles.image} />
          </TouchableOpacity>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardtext}>PRODUCTSIMAGE</Text>
          {details.PRODUCTSIMAGE.map((d, index) => (
            <TouchableOpacity key={index} onPress={() => handleImageClick(d)}>
              <Image source={{ uri: d }} style={styles.image} />
            </TouchableOpacity>
          ))}
        </View>
        {/* Package Weight Images Section */}
        <View style={styles.card}>
          <Text style={styles.cardtext}>PACKAGEWEIGHTIMAGES</Text>
          <View style={styles.imagegrid}>
            {details.PACKAGEWEIGHTIMAGES.map((d, index) => (
              <TouchableOpacity key={index} onPress={() => handleImageClick(d)}>
                <Image source={{ uri: d }} style={styles.image} />
              </TouchableOpacity>
            ))}
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
    fontSize: "20",
    fontWeight: "700",
    marginBottom: 15,
  },
  image: {
    width: "100%",
    height: 250,
    objectFit: "cover",
    borderRadius: 10,
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  container: {
    padding: 16,
    paddingTop: 20,
    backgroundColor: "#f5f5f5",
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
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  imagegrid: {
    display: "flex",
    gap: 20,
  },
  modalImage: {
    width: 300,
    height: 300,
    borderRadius: 10,
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