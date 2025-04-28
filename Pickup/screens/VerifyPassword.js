import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { OtpInput } from "react-native-otp-entry";
import Entypo from "@expo/vector-icons/Entypo";

export default function VerifyPassword() {
  const [phone, setPhone] = useState("");
  const navigation = useNavigation();

  const handleChange = (text) => {
    const numericValue = text.replace(/[^0-9]/g, ""); // Allow only numbers
    setPhone(numericValue);
  };

  const handleGetOtp = () => {
    if (phone.length === 10) {
      // Navigate to OTP screen (update with actual screen name)
      navigation.navigate("OtpScreen", { phoneNumber: phone });
    } else {
      Alert.alert(
        "Invalid Number",
        "Please enter a valid 10-digit phone number."
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Entypo name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Verify OTP</Text>
      </View>

      <View style={styles.iconContainer}>
        <Entypo name="mobile" size={100} color="#fff" />
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Verification</Text>
        <Text style={styles.subtitle}>
          We will send you a One Time Password on your phone number
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Enter Phone Number"
          placeholderTextColor="#ccc"
          keyboardType="phone-pad"
          maxLength={10}
          value={phone}
          onChangeText={handleChange}
        />

        <TouchableOpacity style={styles.button} onPress={handleGetOtp}>
          <Text style={styles.buttonText}>GET OTP</Text>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    position: "absolute",
    top: 50,
    left: 20,
  },
  headerText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 10,
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
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
