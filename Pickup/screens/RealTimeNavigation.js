import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import polyline from "@mapbox/polyline";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../FirebaseConfig";
import { useRoute } from "@react-navigation/native";
import VerifyPassword from "./VerifyPassword";
import DB from "../../Utility/DB";
import utility from "../../Utility/utility";

export default function RealTimeNavigation() {
  const navigation = useNavigation();
  const mapRef = useRef(null);
  const route = useRoute();
  const {
    latitude,
    longitude,
    awbnumber,
    docId,
    consignorphonenumber,
    pickUpPersonName,
    pickupDatetime,
  } = route.params;

  console.log("docId test", docId);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [navigationStarted, setNavigationStarted] = useState(false);
  const [otpsent, setotpsent] = useState(false);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [isModalVisible, setModalVisible] = useState(false); // Modal visibility state
  const [isReachedConfirmed, setReachedConfirmed] = useState(false); // Reached button confirmation state
  const startPoint = { latitude: 12.9911, longitude: 80.2183 };
  const destinationPoint = { latitude: 13.0227, longitude: 80.2025 };

  const GOOGLE_MAPS_APIKEY = "AIzaSyB_sePfGC7khG1CVlY87cTc4qNUnFsMS5Q"; // <-- your key

  const fetchRoute = async () => {
    try {
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${startPoint.latitude},${startPoint.longitude}&destination=${destinationPoint.latitude},${destinationPoint.longitude}&mode=driving&key=${GOOGLE_MAPS_APIKEY}`;
      const response = await axios.get(url);

      if (response.data.routes.length) {
        const points = polyline.decode(
          response.data.routes[0].overview_polyline.points
        );
        const routePath = points.map(([lat, lng]) => ({
          latitude: lat,
          longitude: lng,
        }));
        setRouteCoordinates(routePath);

        // Extracting distance and duration
        const routeLeg = response.data.routes[0].legs[0];
        setDistance(routeLeg.distance.text);
        setDuration(routeLeg.duration.text);
      } else {
        console.error("No routes found:", response.data);
        Alert.alert("Error", "No route found");
      }
    } catch (error) {
      console.error("Error fetching directions:", error);
      Alert.alert("Error", "Unable to fetch directions");
    }
  };

  useEffect(() => {
    fetchRoute();
  }, []);

  const handleUserLocationChange = (event) => {
    const { latitude, longitude, heading } = event.nativeEvent.coordinate;
    setUserLocation({ latitude, longitude });

    // If navigation has started, animate the camera to follow the user
    if (navigationStarted && mapRef.current) {
      mapRef.current.animateCamera({
        center: { latitude, longitude },
        heading: heading || 0, // Heading represents the direction the user is facing
        pitch: 45, // 45 degree tilt for 3D effect
        zoom: 18, // Zoom level
        duration: 500, // Smooth transition duration (ms)
      });
    }
  };

  const sendTemplateMessage = async () => {
    try {
      const Hour_min = utility.convertToTimeOnly(pickupDatetime);
      const name =
        pickUpPersonName.charAt(0).toUpperCase() +
        pickUpPersonName.slice(1).toLowerCase();

      const response = await axios.post(
        "https://public.doubletick.io/whatsapp/message/template",
        {
          messages: [
            {
              content: {
                language: "en",
                templateData: {
                  body: {
                    placeholders: [
                      pickUpPersonName.toUpperCase(),
                      Hour_min,
                      name,
                    ],
                  },
                },
                templateName: "pestartedsathish",
              },
              from: "+919600690881",
              to: `+91${consignorphonenumber}`,
            },
          ],
        },
        {
          headers: {
            Authorization: "key_z6hIuLo8GC",
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );
      console.log("Message sent successfully:", response.data);
    } catch (error) {
      console.error(
        "Error sending message:",
        error.response ? error.response.data : error.message
      );
    }
  };

  const handleStartNavigation = async () => {
    try {
      const pickupDocRef = doc(db, DB.db_collection, docId);
      await updateDoc(pickupDocRef, {
        RideStarted: true,
      });
      if (!userLocation) {
        Alert.alert("Location Error", "Waiting for your current location...");
        return;
      }

      // Once navigation starts, center the map on the user's current location
      if (mapRef.current) {
        mapRef.current.animateCamera({
          center: {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
          },
          pitch: 45,
          heading: 0,
          zoom: 18,
          duration: 500,
        });
      }
      await sendTemplateMessage();
    } catch (error) {
      console.log("error", error);
    }
  };
  useEffect(() => {
    if (!docId) return; // Exit if no docId

    const docRef = doc(db, DB.db_collection, docId);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setNavigationStarted(data.RideStarted); // Set RideStarted field value
        setotpsent(data.OtpSent);
      } else {
        console.log("No such document!");
      }
    });

    // Cleanup listener when component unmounts
    return () => unsubscribe();
  }, [docId]);

  const handleReachedPress = () => {
    setModalVisible(true); // Show the confirmation modal when "Reached" is clicked
  };

  const sendOTPMessage = async (otp) => {
    try {
      const response = await axios.post(
        "https://public.doubletick.io/whatsapp/message/template",
        {
          messages: [
            {
              content: {
                language: "en",
                templateData: {
                  header: {
                    type: "TEXT",
                    placeholder: "OTP For Pickup Shipment",
                  },
                  body: {
                    placeholders: [
                      pickUpPersonName.toUpperCase(),
                      `OTP ${otp}`,
                    ],
                  },
                },
                templateName: "pereachedtemplate_sathish",
              },
              from: "+919600690881",
              to: `+91${consignorphonenumber}`,
            },
          ],
        },
        {
          headers: {
            Authorization: "key_z6hIuLo8GC",
            accept: "application/json",
            "content-type": "application/json",
          },
        }
      );
      console.log("Message sent successfully:", response.data);
    } catch (error) {
      console.error(
        "Error sending OTP message:",
        error.response?.data || error.message
      );
    }
  };

  // Example usage
  const handleConfirmReached = async () => {
    try {
      function generateOTP() {
        return Math.floor(100000 + Math.random() * 900000).toString();
      }
      const otp = generateOTP();
      const pickupDocRef = doc(db, DB.db_collection, docId);

      await updateDoc(pickupDocRef, {
        OTP: otp,
        OtpSent: true,
      });

      await sendOTPMessage(otp);
      navigation.navigate("verifyotp"); // Navigate to "verifyotp" screen
      setReachedConfirmed(true); // Set the "Reached" status as confirmed
      setModalVisible(false); // Close the modal
    } catch (error) {
      console.log(error);
    }
  };

  const handleCancelReached = () => {
    setModalVisible(false); // Close the modal without confirming
  };

  return (
    <View style={styles.container}>
      {!otpsent ? (
        <View>
          <MapView
            ref={mapRef}
            style={styles.map}
            showsUserLocation
            followsUserLocation={true}
            onUserLocationChange={handleUserLocationChange}
            initialRegion={{
              latitude: startPoint.latitude,
              longitude: startPoint.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
          >
            {/* Start Marker */}
            <Marker coordinate={startPoint} title="Start Point" />
            {/* Destination Marker */}
            <Marker coordinate={destinationPoint} title="Destination" />
            {/* Route Polyline */}
            {routeCoordinates.length > 0 && (
              <Polyline
                coordinates={routeCoordinates}
                strokeWidth={5}
                strokeColor="#007AFF"
              />
            )}
          </MapView>

          <View style={styles.controlsContainer}>
            {/* Distance and Duration */}
            {distance && duration && (
              <View style={styles.infoContainer}>
                <Text style={styles.infoText}>Distance: {distance}</Text>
                <Text style={styles.infoText}>Duration: {duration}</Text>
              </View>
            )}

            {!userLocation ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#9F4BDC" />
                <Text style={styles.loadingText}>Getting your location...</Text>
              </View>
            ) : !navigationStarted ? (
              <TouchableOpacity
                onPress={handleStartNavigation}
                style={styles.navButton}
              >
                <Text style={styles.buttonText}>START RIDE</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleReachedPress}
                style={[styles.navButton, { backgroundColor: "green" }]} // Initially disabled
                disabled={isReachedConfirmed} // Disable the button until confirmed
              >
                <Text style={styles.buttonText}>Reached</Text>
              </TouchableOpacity>
            )}
          </View>
          {/* Modal for Confirmation */}
          <Modal
            transparent={true}
            animationType="slide"
            visible={isModalVisible}
            onRequestClose={() => setModalVisible(false)}
          >
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "rgba(0, 0, 0, 0.5)",
              }}
            >
              <View
                style={{
                  backgroundColor: "#fff",
                  padding: 20,
                  borderRadius: 10,
                  width: 280,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 18, marginBottom: 15 }}>
                  Are you sure you've reached your destination?
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    width: "100%",
                  }}
                >
                  <TouchableOpacity
                    onPress={handleCancelReached}
                    style={{
                      backgroundColor: "#f44336",
                      paddingVertical: 10,
                      paddingHorizontal: 20,
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ color: "#FFF", fontWeight: "bold" }}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleConfirmReached}
                    style={{
                      backgroundColor: "#4CAF50",
                      paddingVertical: 10,
                      paddingHorizontal: 20,
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ color: "#FFF", fontWeight: "bold" }}>
                      Yes, I'm here
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </View>
      ) : (
        <VerifyPassword docID={docId} awbnumber={awbnumber} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#9F4BDC" },
  map: { width: "100%", height: "100%" },
  controlsContainer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    elevation: 6,
    alignItems: "center",
  },
  navButton: {
    backgroundColor: "#9F4BDC",
    paddingVertical: 12,
    borderRadius: 12,
    width: "85%",
    alignItems: "center",
  },
  buttonText: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
  infoContainer: {
    marginTop: 10,
    marginBottom: 10,
    alignItems: "center",
    gap: 15,
    flexDirection: "row",
  },
  infoText: {
    fontSize: 16,
    color: "#333",
    padding: 12,
    borderRadius: 12,
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    backgroundColor: "#f8f8f8",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
    fontWeight: "bold",
    marginBottom: 6,
    textAlign: "center",
  },
});
