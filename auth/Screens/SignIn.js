import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import { FIREBASE_AUTH } from "../../FirebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useForm, Controller } from "react-hook-form";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Feather from "@expo/vector-icons/Feather";

const SignIn = ({ navigation }) => {
  const auth = FIREBASE_AUTH;
  const [Autherror, setAuthError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const handleSignIn = async (data) => {
    const { email, password } = data;
    setLoading(true);
    setAuthError(""); // Clear previous error

    try {
      const response = await signInWithEmailAndPassword(auth, email, password);
      console.log(response);

      let userData = {
        name: (() => {
          switch (response.user.email) {
            case "dhanush@gmail.com":
              return "dhanush";
            case "sathish@gmail.com":
              return "sathish";
            case "sangeetha@gmail.com":
              return "sangeetha";
            case "jaga@gmail.com":
              return "jaga";
            case "pravin@gmail.com":
              return "pravin";
            default:
              return response.user.email;
          }
        })(),
        email: response.user.email,
        role: response.user.email === "dhanush@gmail.com" ? "admin" : "pickup",
      };

      await AsyncStorage.setItem("userData", JSON.stringify(userData));
      setLoading(false);
    } catch (error) {
      console.log(error.code);
      setLoading(false);

      // Map Firebase errors to custom messages
      switch (error.code) {
        case "auth/invalid-email":
          setAuthError("Invalid email address.");
          break;
        case "auth/wrong-password":
          setAuthError("Incorrect password.");
          break;
        case "auth/user-not-found":
          setAuthError("No user found with this email.");
          break;
        default:
          setAuthError("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <View style={styles.container}>
      <Image source={require("../.././assets/logo.png")} style={styles.logo} />
      <Text style={styles.title}>Sign In</Text>
      <View style={styles.form}>
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
          <Text style={styles.errorText}>{errors.email?.message || " "}</Text>
        </View>

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
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                secureTextEntry={!isPasswordVisible} // Toggle visibility
                value={value}
                onChangeText={onChange}
                placeholderTextColor="#9CA3AF"
              ></TextInput>
              <TouchableOpacity
                onPress={togglePasswordVisibility}
                style={styles.showHideButton}
              >
                <View style={styles.showHideText}>
                  {isPasswordVisible ? (
                    <Feather name="eye" size={22} color="black" />
                  ) : (
                    <Feather name="eye-off" size={22} color="black" />
                  )}
                </View>
                <Image source={""} />
              </TouchableOpacity>
            </View>
          )}
        />
        <Text style={styles.errorText}>{errors.password?.message || " "}</Text>

        {Autherror && <Text style={styles.autherror}>{Autherror}</Text>}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit(handleSignIn)}
          disabled={loading}
        >
          <View style={styles.buttonContent}>
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
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
  buttonDisabled: {
    backgroundColor: "#9CA3AF", // lighter shade when disabled
  },
  buttonContent: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 18,
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
    minHeight: 20,
  },
  inputContainer: {
    marginBottom: 20,
    position: "relative",
  },
  showHideButton: {
    position: "absolute",
    right: 20,
    top: "30%",
  },
  autherror: {
    color: "red",
    paddingTop: 10,
    paddingBottom: 10,
  },
});

export default SignIn;
