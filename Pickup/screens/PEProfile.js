import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { signOut } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FIREBASE_AUTH } from "../../FirebaseConfig";

const PEProfile = () => {
  const profile = { version: "v2.0.0" };
  const [user, setUser] = useState({});

  const handleSignOut = async () => {
    try {
      await signOut(FIREBASE_AUTH);
      await AsyncStorage.removeItem("userData");
      console.log("Signed out successfully.");
    } catch (error) {
      console.error("Sign-out error:", error);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = await AsyncStorage.getItem("userData");
        if (token) {
          const userData = JSON.parse(token);
          setUser(userData);
        }
      } catch (error) {
        console.error("Error fetching user from AsyncStorage", error);
      }
    };
    fetchUser();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileCard}>
          <Image
            // source={require("../../assets/avatar.png")}
            style={styles.avatar}
          />
          <View>
            <Text style={styles.name}>
              {user?.name || "Name not available"}
            </Text>
            <Text style={styles.email}>
              {user?.email || "Email not available"}
            </Text>
            <Text style={styles.role}>
              {user?.role || "Role not specified"}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      <Text style={styles.versionText}>App Version: {profile.version}</Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
    marginTop: 40,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  profileCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
    backgroundColor: "#e5e7eb",
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  email: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  role: {
    fontSize: 14,
    color: "#7c3aed",
    fontWeight: "500",
    marginTop: 2,
  },
  signOutButton: {
    backgroundColor: "#7c3aed",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  signOutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  versionText: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    textAlign: "center",
    color: "#9ca3af",
    fontSize: 13,
  },
});

export default PEProfile;
