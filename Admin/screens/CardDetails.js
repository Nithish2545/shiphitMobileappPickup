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
} from "react-native";
import axios from "axios";
import apiURLs from "../../utility/googlescreen/apiURLs";

function CardDetails() {
  const route = useRoute();
  const { awbnumber } = route.params;
  const [details, setDetails] = useState(null);

  useEffect(() => {
    axios
      .get(apiURLs.sheety)
      .then((response) => {
        const result = response.data.sheet1.filter(
          (d) => d.awbNumber == awbnumber
        );
        setDetails(result?.[0]);
      })
      .catch((error) => console.error(error));
  }, []);

  if (!details) return <ActivityIndicator size="large" color="#6200EE" />;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Card Details</Text>

        {/* Consignor Details */}
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

        {/* Consignee Details */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Consignee Details</Text>
          <Text style={styles.item}>
            <Text style={styles.label}>Name: </Text>
            {details.consigneename != "" ? details.consigneename : "N/A" }
          </Text>
          <Text style={styles.item}>
            <Text style={styles.label}>Phone: </Text>
            {details.consigneephonenumber != "" ? details.consigneephonenumber : "N/A" }
          </Text>
          <Text style={styles.item}>
            <Text style={styles.label}>Location: </Text>
            {details.consigneelocation != "" ? details.consigneelocation :  "N/A"  }
          </Text>
        </View>

        {/* Shipment Details */}
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

        {/* Post Pickup Details */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Post Pickup Details</Text>
          <Text style={styles.item}>
            <Text style={styles.label}>Post Packages: </Text>
            {details.postNumberOfPackages != "" ?  details.postNumberOfPackages :"N/A"}
          </Text>
          <Text style={styles.item}>
            <Text style={styles.label}>Post Pickup Weight: </Text>
            {details.postPickupWeight != "" ?  details.postPickupWeight : "N/A" }
          </Text>
          <Text style={styles.item}>
            <Text style={styles.label}>Actual Packages: </Text>
            {details.actualNoOfPackages != "" ? details.actualNoOfPackages :"N/A" }
          </Text>
          <Text style={styles.item}>
            <Text style={styles.label}>Actual Weight: </Text>
            {details.actualWeight != "" ?details.actualWeight : "N/A" }
          </Text>
        </View>

        {/* Status */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Status</Text>
          <Text
            style={[
              styles.item,
              styles.status,
              details.status === "PAYMENT PENDING" ? styles.pending : styles.done,
            ]}
          >
            <Text style={styles.label}>Status: </Text>
            {details.status}
          </Text>
        </View>

        {/* Additional Info */}
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
});

export default CardDetails;