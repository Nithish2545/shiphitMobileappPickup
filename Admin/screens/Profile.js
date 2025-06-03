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
import { useRoute } from "@react-navigation/native";
import { FIREBASE_AUTH } from "../../FirebaseConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Profile = () => {
  const [user, setuser] = useState({});
  const route = useRoute();
  const { overview } = route.params;

  const profile = {
    version: "v1.0.6",
  };

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const token = await AsyncStorage.getItem("userData");
        if (token) {
          const user = JSON.parse(token);
          setuser(user);
        }
      } catch (error) {
        console.error("Error fetching user from AsyncStorage", error);
      }
    };
    fetchUserRole();
  }, []);

  const handleSignOut = () => {
    signOut(FIREBASE_AUTH)
      .then(() => console.log("Signed out successfully."))
      .catch((error) => console.error("Sign-out error:", error));
  };

  const statusCards = [
    {
      label: "Run Sheet",
      value: overview["RUN SHEET"],
      bgColor: "#fee2e2",
      textColor: "#b91c1c",
    },
    {
      label: "Warehouse",
      value: overview["INCOMING MANIFEST"],
      bgColor: "#fef3c7",
      textColor: "#92400e",
    },
    {
      label: "Payment Pending",
      value: overview["PAYMENT PENDING"],
      bgColor: "#dbeafe",
      textColor: "#1e3a8a",
    },
    {
      label: "NOT CONNECTED",
      value: overview["PAYMENT DONE"],
      bgColor: "#e5e7eb",
      textColor: "#374151",
    },
    {
      label: "SHIPMENT CONNECTED",
      value: overview["SHIPMENT CONNECTED"],
      bgColor: "#F3E8FF",
      textColor: "#374151",
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Info */}
        <View style={styles.profileCard}>
          <Image
            source={require("./avatar-svgrepo-com.png")}
            style={styles.avatar}
          />
          <View>
            <Text style={styles.name}>{user?.name || "Loading..."}</Text>
            <Text style={styles.email}>{user?.email || ""}</Text>
          </View>
        </View>

        {/* Status Overview */}
        <View style={styles.statusWrapper}>
          {statusCards.map((card, idx) => (
            <View
              key={idx}
              style={[styles.statusCard, { backgroundColor: card.bgColor }]}
            >
              <Text style={[styles.statusLabel, { color: card.textColor }]}>
                {card.label}
              </Text>
              <Text style={[styles.statusValue, { color: card.textColor }]}>
                {card.value}
              </Text>
            </View>
          ))}
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* App Version */}
      </ScrollView>
      <Text style={styles.versionText}>App Version: {profile.version}</Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
    paddingTop: 20,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 32,
    marginRight: 16,
  },
  name: {
    fontSize: 20,
    fontWeight: "600",
  },
  email: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  statusWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statusCard: {
    width: "48%",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: "center",
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  statusValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  signOutButton: {
    marginTop: 10,
    backgroundColor: "#7c3aed",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    elevation: 2,
  },
  signOutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  versionText: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: "center",
    color: "#9ca3af",
    fontSize: 13,
  },
});

export default Profile;
