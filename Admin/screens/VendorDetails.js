import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
  ScrollView,
  SafeAreaView,
  Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { FontAwesome } from "@expo/vector-icons";
import { Controller, useForm } from "react-hook-form";
import { db, storage } from "../../FirebaseConfig"; // Import Firebase storage
import * as ImagePicker from "expo-image-picker"; // Import ImagePicker
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  collection,
  doc,
  getDocs,
  query,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import axios from "axios";
import DB from "../../Utility/DB";
import VendorChangeModal from "./VendorChangeModal";
import validateAwbNumber from "../../Utility/validateAwbNumber";
import { Picker } from "@react-native-picker/picker";

function VendorDetails() {
  const route = useRoute();
  const navigation = useNavigation();
  const { awbnumber } = route.params;
  const [modalVisible, setModalVisible] = useState(false);

  const handleVendorSubmit = (vendor) => {
    // Call your API or function here
  };
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const fetchRowByAWB = async (awbNumber) => {
    try {
      const q = query(
        collection(db, DB.db_collection),
        where("awbNumber", "==", awbnumber),
      );

      const querySnapshot = await getDocs(q);
      let final_result = [];

      querySnapshot.forEach((doc) => {
        final_result.push({ id: doc.id, ...doc.data() });
      });
      setUser(final_result[0]);
      return final_result[0];
    } catch (error) {
      console.error("Error fetching row by AWB number:", error);
      return null; // Return null in case of an error
    }
  };

  const [user, setUser] = useState(null);
  const [vendorAwbnumber, setVendorAwbnumber] = useState("");
  const [vendorname, setvendorname] = useState("");
  const [actualNumPackages, setActualNumPackages] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false); // New state for submit loading
  const [finalWeightImage, setFinalWeightImage] = useState(null); // State for final weight image
  const [error, seterror] = useState(""); // State for final weight image

  const PickupCompletedDate = () => {
    const now = new Date();
    const istDate = now.toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "numeric",
    });
    const istTime = now.toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
    const [hour, period] = istTime.split(" ");
    const formattedTime = `${hour} ${period}`;
    return `${istDate} &${formattedTime}`;
  };

  // function getTruncatedURL(fullUrl) {
  //   const baseUrl =
  //     "https://firebasestorage.googleapis.com/v0/b/shiphitmobileapppickup-fb7e2.firebasestorage.app/o/";
  //   const truncatedResult = fullUrl.replace(baseUrl, "");
  //   return truncatedResult;
  // }

  useEffect(() => {
    const fetchUserData = async () => {
      const matchedUser = await fetchRowByAWB(awbnumber);
      if (matchedUser) {
        setUser(matchedUser);
      } else {
        console.error("No user found with the given AWB number");
      }
      setLoading(false);
    };
    fetchUserData();
  }, [awbnumber]);

  const onSubmit = async (data) => {
    if (!finalWeightImage) {
      seterror("AWB Bar code image is required!");
      return;
    }
    setModalVisible(true);
  };

  async function finalsubmit() {
    // Function to upload the image to Firebase
    const uploadImage = async (imageUri) => {
      if (!imageUri) return null; // Return null if no image selected
      const response = await fetch(imageUri);
      const blob = await response.blob();

      const storageRef = ref(
        storage,
        `${awbnumber}/AWB NUMBER IMAGE/${Date.now()}.jpg`,
      ); // Create a reference in the specified folder
      await uploadBytes(storageRef, blob); // Upload the image
      const downloadURL = await getDownloadURL(storageRef); // Get the download URL
      return downloadURL; // Return the URL
    };

    const now = Timestamp.now();

    const updatedInternalTracking = user.internalTracking.map((step) => {
      if (step.code === "SHIPMENT_CONNECTED") {
        return {
          ...step,
          status: "COMPLETED",
          datetime: now,
          updatedAt: now,
          updatedBy: "system",
          notes: "Shipment Connected!",
        };
      }

      return step;
    });

    const updatedFields = {
      internalTracking: updatedInternalTracking,
      vendorName: vendorname,
      vendorAwbnumber: vendorAwbnumber.toUpperCase(),
      status: "SHIPMENT CONNECTED",
      packageConnectedDataTime: PickupCompletedDate(),
      AWbNumberImage: await uploadImage(finalWeightImage), // Upload image and store URL
    };

    const q = query(
      collection(db, DB.db_collection),
      where("awbNumber", "==", awbnumber),
    );
    const querySnapshot = await getDocs(q);

    let final_result = [];
    querySnapshot.forEach((doc) => {
      final_result.push({ id: doc.id, ...doc.data() });
    });

    const docRef = doc(db, DB.db_collection, final_result[0].id); // db is your Firestore instance

    updateDoc(docRef, updatedFields);

    if (
      user.vendorName == "ExPlus" ||
      user.vendorName == "UPS" ||
      user.vendorName == "ICL SELF"
    ) {
      try {
        const deliveryTime =
          user.service === "Economy"
            ? "5 - 7 Working Days"
            : user.service === "Express"
              ? "3 - 4 Working Days"
              : user.service === "Duty Free"
                ? "10 - 14 Working Days"
                : "";

        function getTruncatedURL(fullUrl) {
          const baseUrl =
            "https://firebasestorage.googleapis.com/v0/b/shiphitmobileapppickup-fb7e2.firebasestorage.app/o/";
          const truncatedResult = fullUrl.replace(baseUrl, "");
          return truncatedResult;
        }
        const data = {
          messages: [
            {
              content: {
                language: "en",
                templateData: {
                  body: {
                    placeholders: [
                      String(user.consignorname), // {{1}}
                      String(user.awbNumber), // {{2}}
                      String(user.service), // {{3}}
                      String(user.destination), // {{4}}
                      deliveryTime, // {{5}}
                    ],
                  },
                  buttons: [
                    {
                      // Track Shipment → uses {{1}} in URL
                      type: "URL",
                      parameter: String(user.awbHashedValue),
                    },
                    {
                      // View Receipt → uses {{receipt}}
                      type: "URL",
                      parameter: getTruncatedURL(user.payment_Receipt_URL),
                    },
                  ],
                },
                templateName: "shipment_connected_utility_v7",
              },
              from: "+919600690881",
              to: `+91${String(user.consignorphonenumber).trim()}`,
            },
          ],
        };

        axios
          .post(
            "https://public.doubletick.io/whatsapp/message/template",
            data,
            {
              headers: {
                Authorization: "key_z6hIuLo8GC",
                Accept: "application/json",
                "Content-Type": "application/json",
              },
            },
          )
          .then((response) => {
            console.log("Success:", response.data);
          })
          .catch((error) => {
            console.error("Error:", error.response?.data || error.message);
          });
      } catch (error) {
        console.log("Error", error);
      }

      try {
        const deliveryTime =
          user.service === "Economy"
            ? "5 - 7 Working Days"
            : user.service === "Express"
              ? "3 - 4 Working Days"
              : user.service === "Duty Free"
                ? "10 - 14 Working Days"
                : "";

        function getTruncatedURL(fullUrl) {
          const baseUrl =
            "https://firebasestorage.googleapis.com/v0/b/shiphitmobileapppickup-fb7e2.firebasestorage.app/o/";
          const truncatedResult = fullUrl.replace(baseUrl, "");
          return truncatedResult;
        }

        const data = {
          messages: [
            {
              content: {
                language: "en",
                templateData: {
                  body: {
                    placeholders: [
                      String(user.consigneename), // {{1}}
                      String(user.awbNumber), // {{2}}
                      String(user.service), // {{3}}
                      String(user.destination), // {{4}}
                      deliveryTime, // {{5}}
                    ],
                  },
                  buttons: [
                    {
                      // Track Shipment → uses {{1}} in URL
                      type: "URL",
                      parameter: String(user.awbHashedValue),
                    },
                    {
                      // View Receipt → uses {{receipt}}
                      type: "URL",
                      parameter: getTruncatedURL(user.payment_Receipt_URL),
                    },
                  ],
                },
                templateName: "shipment_connected_utility_v7",
              },
              from: "+919600690881",
              to: `${String(user.consigneephonenumber).trim()}`,
            },
          ],
        };

        axios
          .post(
            "https://public.doubletick.io/whatsapp/message/template",
            data,
            {
              headers: {
                Authorization: "key_z6hIuLo8GC",
                Accept: "application/json",
                "Content-Type": "application/json",
              },
            },
          )
          .then((response) => {
            console.log("Success:", response.data);
          })
          .catch((error) => {
            console.error("Error:", error.response?.data || error.message);
          });
      } catch (error) {
        console.log("Error", error);
      }
    } else {
      console.log("nothing");
    }

    setVendorAwbnumber("");
    setFinalWeightImage(null);
    setIsSubmitting(false);
    setModalVisible(false);
    navigation.navigate("Admin");
  }

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      setFinalWeightImage(result.assets[0].uri); // Set the image URI
    }
  };

  // Function to remove the image
  const removeImage = () => {
    setFinalWeightImage(null); // Clear the image
  };

  if (loading)
    return (
      <ActivityIndicator size="large" color="#6B21A8" style={styles.loading} />
    );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Vendor details</Text>
        <View style={styles.info}>
          <Text style={styles.label}>Name:</Text>
          <Text style={styles.value}>{user.consignorname}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.label}>Consignor Phone Number:</Text>
          <Text style={styles.value}>{user.consignorphonenumber}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.label}>Shiphit AWB Number:</Text>
          <Text style={styles.value}>{user.awbNumber}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Final weight:</Text>
          <Text style={styles.value}>{user.actualWeight}</Text>
          <FontAwesome
            name="check-circle"
            size={20}
            color="green"
            style={styles.icon}
          />
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Final No of boxes:</Text>
          <Text style={styles.value}>{user.actualNoOfPackages}</Text>
          <FontAwesome
            name="check-circle"
            size={20}
            color="green"
            style={styles.icon}
          />
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Vendor:</Text>
          <Text style={styles.value}>{user.vendorName}</Text>
          <FontAwesome
            name="check-circle"
            size={20}
            color="green"
            style={styles.icon}
          />
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Destination:</Text>
          <Text style={styles.value}>{user.destination}</Text>
          <FontAwesome
            name="check-circle"
            size={20}
            color="green"
            style={styles.icon}
          />
        </View>
        {/* Form */}
        <View style={styles.infoRowFromTo}>
          <Text style={styles.label}>From address:</Text>
          <View style={{ display: "flex", flexDirection: "row" }}>
            {user.consignorlocation ? (
              <>
                <Text style={styles.valueFromTo}>{user.consignorlocation}</Text>
                <FontAwesome
                  name="check-circle"
                  size={20}
                  color="green"
                  style={styles.icon}
                />
              </>
            ) : (
              <Text>-</Text>
            )}
          </View>
        </View>
        {/* To */}
        <View style={styles.infoRowFromTo}>
          <Text style={styles.label}>To address:</Text>
          <View style={{ display: "flex", flexDirection: "row" }}>
            {user.consigneelocation ? (
              <>
                <Text style={styles.valueFromTo}>{user.consigneelocation}</Text>
                <FontAwesome
                  name="check-circle"
                  size={20}
                  color="green"
                  style={styles.icon}
                />
              </>
            ) : (
              <Text>-</Text>
            )}
          </View>
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Enter Vendor AWB Number:</Text>
          <Controller
            name="vendorAwbnumber"
            control={control}
            rules={{
              required: "Vendor AWB number is required",
            }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[
                  styles.input,
                  errors.vendorAwbnumber ? styles.inputError : null,
                ]}
                placeholder="Enter Vendor AWB number"
                keyboardType="default"
                value={value}
                onChangeText={(text) => {
                  onChange(text); // update react-hook-form
                  setVendorAwbnumber(text); // update local state
                }}
              />
            )}
          />
          {errors.vendorAwbnumber && (
            <Text style={styles.errorText}>
              {errors.vendorAwbnumber.message}
            </Text>
          )}
        </View>
        <Text style={styles.label}>Select Vendor:</Text>

        <Controller
          name="vendorName"
          control={control}
          rules={{ required: "Vendor is required" }}
          render={({ field: { onChange, value } }) => (
            <View
              style={[
                styles.pickerWrapper,
                errors.vendorName && styles.inputError,
              ]}
            >
              <Picker
                style={[styles.input]}
                selectedValue={value}
                onValueChange={(itemValue) => {
                  onChange(itemValue);
                  setvendorname(itemValue);
                }}
              >
                <Picker.Item label="Select a vendor" value="" />
                <Picker.Item label="DHL" value="DHL" />
                <Picker.Item label="ARAMEX" value="Aramex" />
                <Picker.Item label="UPS" value="UPS" />
                <Picker.Item label="ExPlus" value="ExPlus" />
                <Picker.Item label="TurboFox" value="TurboFox" />
                <Picker.Item label="DESK SELF" value="DESK SELF" />
                <Picker.Item label="ICL SELF" value="ICL SELF" />
                <Picker.Item label="ICL FedEx" value="ICL FedEx" />
                <Picker.Item label="ATLANTIC" value="ATLANTIC" />
              </Picker>
            </View>
          )}
        />

        {errors.vendorName && (
          <Text style={styles.errorText}>{errors.vendorName.message}</Text>
        )}

        {/* Final Weight Image Upload */}
        <View style={styles.imageUploadContainer}>
          {finalWeightImage && (
            <View style={styles.imagePreview}>
              <Image source={{ uri: finalWeightImage }} style={styles.image} />
              <TouchableOpacity
                onPress={removeImage}
                style={styles.removeButton}
              >
                <Text style={styles.removeButtonText}>Remove</Text>
              </TouchableOpacity>
            </View>
          )}
          <View
            style={{
              marginBottom: 20,
            }}
          >
            <TouchableOpacity onPress={pickImage} style={styles.uploadButton}>
              <Text style={styles.uploadButtonText}>
                {finalWeightImage
                  ? "Change AWB BAR CODE Image"
                  : "Upload AWB BAR CODE Image"}
              </Text>
            </TouchableOpacity>
            {error ? (
              <Text style={{ color: "red", paddingTop: 5 }}>{error}</Text>
            ) : (
              <></>
            )}
          </View>
        </View>
        <TouchableOpacity
          onPress={handleSubmit(onSubmit)}
          style={styles.button}
          disabled={isSubmitting} // Disable button when submitting
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#fff" /> // Loading spinner inside button
          ) : (
            <Text style={styles.buttonText}>Submit</Text>
          )}
        </TouchableOpacity>
      </View>
      <VendorChangeModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleVendorSubmit}
        user={user}
        vendorName={vendorname}
        vendorAwbnumber={vendorAwbnumber}
        finalsubmit={finalsubmit}
        isSubmitting={isSubmitting}
        setIsSubmitting={setIsSubmitting}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 6,
    marginTop: 10,
  },

  picker: {
    height: 50,
    width: "100%",
  },

  inputError: {
    borderColor: "#DC2626",
  },
  container: {
    alignItems: "center",
    marginTop: 40,
    paddingBottom: 40,
    flexGrow: 1,
  },
  imageUploadContainer: {
    marginTop: 16,
  },
  imagePreview: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 8,
  },
  removeButton: {
    backgroundColor: "red",
    borderRadius: 8,
    padding: 8,
  },
  removeButtonText: {
    color: "#fff",
  },
  uploadButton: {
    backgroundColor: "#6B21A8",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  uploadButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  card: {
    width: "90%",
    height: "100%",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    padding: 10,
  },
  errorText: {
    color: "#DC2626",
    marginTop: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4B5563",
    marginBottom: 20,
  },
  info: {
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  infoRowFromTo: {
    flexDirection: "column",
    gap: 10,
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    color: "#6B7280",
  },
  value: {
    fontSize: 18,
    color: "#1F2937",
    marginLeft: 8,
  },
  valueFromTo: {
    fontSize: 18,
    marginLeft: 20,
    color: "#1F2937",
    width: "230px", // Set widdth to 100px
  },
  icon: {
    marginLeft: 8,
  },
  inputGroup: {
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
    marginTop: 10,
  },
  button: {
    backgroundColor: "#6B21A8",
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 20,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  loading: {
    flex: 1,
    justifyContent: "center",
  },
});

export default VendorDetails;
