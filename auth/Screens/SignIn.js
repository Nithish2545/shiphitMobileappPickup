import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from "react-native";
import { FIREBASE_AUTH } from "../../FirebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useForm, Controller } from "react-hook-form";
import AsyncStorage from "@react-native-async-storage/async-storage"; // Import AsyncStorage

const SignIn = ({ navigation }) => {
  const auth = FIREBASE_AUTH;
  const [Autherror, setAuthError] = useState("");
  const [loading, setLoading] = useState(false); // Add loading state

  // Initialize useForm from react-hook-form
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm();

  // Handle SignIn action
  const handleSignIn = async (data) => {
    const { email, password } = data;
    setLoading(true); // Set loading to true when starting sign-in

    try {
      const response = await signInWithEmailAndPassword(auth, email, password);
      console.log(response);

      // Check if the email is 'deepak@gmail.com' to assign the role
      let userData = {
        name: (() => {
          switch (response.user.email) {
            case "deepak@gmail.com":
              return "deepak";
            case "sathish@gmail.com":
              return "sathish";
            case "anish@gmail.com":
              return "anish";
            default:
              return response.user.email;
          }
        })(),
        email: response.user.email,
        role: response.user.email === "deepak@gmail.com" ? "admin" : "pickup", // Assign role based on email
      };

      // Store the user data in AsyncStorage
      await AsyncStorage.setItem("userData", JSON.stringify(userData));
      setLoading(false); // Stop loading after successful sign-in
    } catch (error) {
      console.log(error.code);
      setLoading(false); // Stop loading after error

      if (error.code === "auth/invalid-credential") {
        setAuthError("Invalid email or password. Please try again.");
      } else {
        setAuthError("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <View style={styles.container}>
      <Image source={require("../.././assets/logo.png")} style={styles.logo} />
      <Text style={styles.title}>Sign In</Text>
      <View style={styles.form}>
        {/* Email Input */}
        <View style={styles.inputContainer}>
          <Controller
            control={control}
            name="email"
            rules={{
              required: "Email is required",
              pattern: {
                value: /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/,
                message: "Enter a valid email address",
              },
            }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                keyboardType="email-address"
                value={value}
                onChangeText={onChange}
                placeholderTextColor="#9CA3AF"
              />
            )}
          />
          {/* Error message for email */}
          <Text style={styles.errorText}>{errors.email?.message || " "}</Text>
        </View>

        {/* Password Input */}
        <Controller
          control={control}
          name="password"
          rules={{
            required: "Password is required",
            minLength: {
              value: 6,
              message: "Password must be at least 6 characters long",
            },
          }}
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              secureTextEntry
              value={value}
              onChangeText={onChange}
              placeholderTextColor="#9CA3AF"
            />
          )}
        />
        {/* Error message for password */}
        <Text style={styles.errorText}>{errors.password?.message || " "}</Text>

        {Autherror && <Text style={styles.autherror}>{Autherror}</Text>}

        {/* Sign In Button */}
        <TouchableOpacity
          style={[styles.button]} // Update button style when loading
          onPress={handleSubmit(handleSignIn)}
          disabled={loading} // Disable the button when loading
        >
          <View style={styles.buttonContent}>
            <Text style={styles.buttonText}>Sign In</Text>
            {/* {loading && (
              <LottieView
                source={require("../../assets/loading.json")} // Replace with your Lottie file path
                autoPlay
                loop
                style={styles.lottie}
              />
            )} */}
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          onPress={() =>
            Alert.alert("Forgot Password", "Forgot Password pressed")
          }
        >
          <Text style={styles.forgotPassword}>Forgot your password?</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    padding: 16,
  },
  logo: {
    height: 60,
    marginBottom: 24,
    objectFit: "contain",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
    color: "#1F2937",
  },
  form: {
    width: "100%",
    maxWidth: 400,
  },
  input: {
    height: 48,
    borderColor: "#D1D5DB",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    fontSize: 16,
  },
  button: {
    backgroundColor: "#6D28D9",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    elevation: 3,
    marginBottom: 16,
    marginTop: 16,
  },
  buttonLoading: {
    color: "White",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 18,
    position: "relative",
  },
  buttonContent: {
    flexDirection: "row", // Aligns Sign In text and Lottie horizontally
    justifyContent: "center", // Centers content horizontally
    alignItems: "center", // Aligns items vertically within the button
  },
  buttonTextLoading: {
    color: "white", // Darker text when loading
    fontWeight: "700",
    fontSize: 18,
    marginRight: 10, // Add space before the loader
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  lottie: {
    width: 30,
    height: 30,
    marginLeft: 10, // Adds spacing between text and Lottie
  },
  footer: {
    marginTop: 15,
    alignItems: "center",
  },
  forgotPassword: {
    marginTop: 8,
    fontSize: 14,
    color: "#6D28D9",
    textDecorationLine: "underline",
  },
  errorText: {
    color: "red",
    minHeight: 20, // Fixed height for error text
  },
  inputContainer: {
    marginBottom: 20,
  },
  autherror: {
    color: "red",
    paddingTop: 10,
    paddingBottom: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default SignIn;