import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
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
import * as Location from "expo-location"; // Import expo-location

export default function RealTimeNavigation() {
  const navigation = useNavigation();
  const mapRef = useRef(null);
  const route = useRoute();
  const {
    latitude, // This is the destination latitude from route.params
    longitude, // This is the destination longitude from route.params
    awbnumber,
    docId,
    consignorphonenumber,
    pickUpPersonName,
    pickupDatetime,
  } = route.params;

  console.log("docId test", docId);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [userLocation, setUserLocation] = useState(null); // Current user's GPS location
  const [navigationStarted, setNavigationStarted] = useState(false);
  const [otpsent, setotpsent] = useState(false);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isReachedConfirmed, setReachedConfirmed] = useState(false);

  // The fixed destination point from route params
  const destinationPoint = {
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
  };

  // A default initial point for map display BEFORE user's location is known.
  // This could be a central hub, or even the destination itself for initial overview.
  // Let's use the origin point from your original hardcoded values for clarity initially.
  // This point will be used as the *origin* for the route calculation if userLocation isn't ready.
  const defaultInitialOrigin = { latitude: 12.9911, longitude: 80.2183 };

  const Maps_APIKEY = "AIzaSyB_sePfGC7khG1CVlY87cTc4qNUnFsMS5Q"; // <-- your key

  // Function to fetch the route from an origin to the destination
  const fetchRoute = async (originPoint) => {
    if (!originPoint || !destinationPoint) {
      console.log("Cannot fetch route: origin or destination missing.");
      return;
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originPoint.latitude},${originPoint.longitude}&destination=${destinationPoint.latitude},${destinationPoint.longitude}&mode=driving&key=${Maps_APIKEY}`;
      // console.log("Directions API URL:", url);
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

        // Fit map to show the entire route
        if (mapRef.current) {
          mapRef.current.fitToCoordinates(routePath, {
            edgePadding: { top: 100, right: 50, bottom: 100, left: 50 }, // Adjusted padding for controls
            animated: true,
          });
        }
      } else {
        console.error("No routes found:", response.data);
        Alert.alert(
          "Error",
          "No route found from your current location to destination."
        );
      }
    } catch (error) {
      console.error("Error fetching directions:", error);
      Alert.alert("Error", "Unable to fetch directions");
    }
  };

  // Effect to handle location permissions and continuous updates
  useEffect(() => {
    let locationSubscription;

    const setupLocationTracking = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location access is required for real-time navigation. Please enable it in your device settings."
        );
        return;
      }

      // Get initial single position immediately
      let initialPosition = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });
      const initialLocation = {
        latitude: initialPosition.coords.latitude,
        longitude: initialPosition.coords.longitude,
        heading: initialPosition.coords.heading || 0,
      };
      setUserLocation(initialLocation);
      fetchRoute(initialLocation);

      // Then, start watching user's position for continuous updates
      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Highest,
          distanceInterval: 10, // Update every 10 meters
          timeInterval: 1000, // **MODIFIED: Update every 1 second for smoother tracking**
        },
        (position) => {
          const { latitude, longitude, heading } = position.coords;
          const newLocation = { latitude, longitude, heading: heading || 0 };
          setUserLocation(newLocation);

          // Animate camera to follow the user if navigation has started
          if (navigationStarted && mapRef.current) {
            mapRef.current.animateCamera({
              center: { latitude, longitude },
              heading: heading || 0,
              pitch: 60, // **MODIFIED: Increased pitch for better 3D view**
              zoom: 17, // **MODIFIED: Adjusted zoom for a better driver's view**
              duration: 1000, // **MODIFIED: Smoother animation over 1 second**
            });
          }
        }
      );
    };

    setupLocationTracking();

    // Cleanup function
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [navigationStarted]); // Dependency is correct

  // Effect to listen for changes in Firebase docId (RideStarted, OtpSent)
  useEffect(() => {
    if (!docId) return;

    const docRef = doc(db, DB.db_collection, docId);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setNavigationStarted(data.RideStarted);
        setotpsent(data.OtpSent);
      } else {
        console.log("No such document!");
      }
    });

    return () => unsubscribe(); // Cleanup Firebase listener
  }, [docId]);

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
      if (!userLocation) {
        Alert.alert(
          "Location Error",
          "Still getting your current location. Please wait a moment."
        );
        return;
      }
      const pickupDocRef = doc(db, DB.db_collection, docId);
      await updateDoc(pickupDocRef, {
        RideStarted: true,
      });
      // Camera animation will be handled by the watchPositionAsync callback due to navigationStarted update
      await sendTemplateMessage();
    } catch (error) {
      console.log("error starting navigation:", error);
    }
  };

  const handleReachedPress = () => {
    setModalVisible(true);
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
      console.log("realt time ", docId);
      navigation.navigate("verifyotp", {
        docId: docId,
      });
      setReachedConfirmed(true);
      setModalVisible(false);
    } catch (error) {
      console.log(error);
    }
  };

  const handleCancelReached = () => {
    setModalVisible(false);
  };

  // Determine the initial region for the map view
  const initialMapRegion = userLocation
    ? {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.005, // Zoomed in on user
        longitudeDelta: 0.005,
      }
    : {
        // Fallback to default origin, suitable for showing an initial route overview
        latitude: defaultInitialOrigin.latitude,
        longitude: defaultInitialOrigin.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };

  return (
    <View style={styles.container}>
      {!otpsent ? (
        <View style={{ flex: 1 }}>
          <MapView
            ref={mapRef}
            style={styles.map}
            showsUserLocation
            followsUserLocation={navigationStarted} // Only follow user when navigation has started
            initialRegion={initialMapRegion}
          >
            {/* Destination Marker */}
            <Marker coordinate={destinationPoint} title="Destination" />
            {/* Origin Marker (optional, if you want to show the initial origin) */}
            {/* This could be userLocation if it's available, or the defaultInitialOrigin */}
            {userLocation && (
              <Marker
                coordinate={userLocation}
                title="Your Current Location"
                pinColor="blue"
              />
            )}
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
                style={[styles.navButton, { backgroundColor: "green" }]}
                disabled={isReachedConfirmed}
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
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#e0e0e0",
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#333",
  },
});
