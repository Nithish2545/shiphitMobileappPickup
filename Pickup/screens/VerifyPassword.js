import { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import Entypo from "@expo/vector-icons/Entypo";
import LottieView from "lottie-react-native";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../FirebaseConfig";
import DB from "../../Utility/DB";

export default function VerifyPassword() {
  const route = useRoute();
  const docID = route.params.docId;
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const handleChange = (text) => {
    const numericValue = text.replace(/[^0-9]/g, "");
    setOtp(numericValue);
  };
  const handleGetOtp = async () => {
    console.log("verify OTP docID", docID);

    if (otp.length !== 6) {
      Alert.alert("Invalid OTP", "Please enter a valid 6-digit OTP.");
      return;
    }

    setLoading(true);

    try {
      const docRef = doc(db, DB.db_collection, docID);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const storedOtp = docSnap.data().OTP;
        if (parseInt(otp) === parseInt(storedOtp)) {
          await updateDoc(docRef, {
            OtpVerified: true,
          });
          navigation.navigate("Pickup");
          Alert.alert("Success", "OTP Verified!");
          // navigation.navigate("NextScreen");
        } else {
          Alert.alert("Incorrect OTP", "Please enter the correct OTP.");
        }
      } else {
        Alert.alert("Error", "Document not found.");
      }
    } catch (error) {
      console.error("OTP Error:", error);
      Alert.alert("Error", "Failed to verify OTP.");
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.iconContainer}>
        <Entypo name="mobile" size={100} color="#fff" />
      </View>
      <View style={styles.card}>
        <Text style={styles.title}>Verification</Text>
        <Text style={styles.subtitle}>Enter the OTP</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter 6 digit OTP"
          placeholderTextColor="#ccc"
          keyboardType="phone-pad"
          maxLength={6}
          value={otp}
          onChangeText={handleChange}
        />
        <TouchableOpacity
          style={styles.button}
          onPress={handleGetOtp}
          disabled={loading}
        >
          {loading ? (
            <LottieView
              source={require("./loading.json")} // your Lottie file path
              autoPlay
              loop
              style={styles.loading}
            />
          ) : (
            <Text style={styles.buttonText}>Verify OTP</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#6a11cb",
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  iconContainer: {
    alignSelf: "center",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    alignSelf: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#f1f1f1",
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: "#333",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#6a11cb",
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    height: 50,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  loading: {
    width: 40,
    height: 40,
  },
});
