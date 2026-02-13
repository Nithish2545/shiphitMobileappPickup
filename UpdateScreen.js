import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  BackHandler,
  Linking,
  SafeAreaView,
} from "react-native";

export default function UpdateScreen({ route }) {
  const { apkUrl, forceUpdate } = route.params;

  useEffect(() => {
    let backHandler;

    if (forceUpdate) {
      backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        () => true, // disable back button
      );
    }

    return () => {
      backHandler?.remove();
    };
  }, [forceUpdate]);

  const handleUpdate = () => {
    Linking.openURL(apkUrl);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>🚀 Update Available</Text>

        <Text style={styles.description}>
          A newer version of the app is available with improvements and bug
          fixes.
        </Text>

        {forceUpdate && (
          <Text style={styles.forceText}>
            This update is required to continue using the app.
          </Text>
        )}

        <TouchableOpacity style={styles.button} onPress={handleUpdate}>
          <Text style={styles.buttonText}>Update Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F3FF", // light purple background
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    elevation: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    color: "#4C1D95", // deep purple
  },
  description: {
    marginTop: 12,
    fontSize: 15,
    textAlign: "center",
    color: "#555",
    lineHeight: 22,
  },
  forceText: {
    marginTop: 10,
    fontSize: 14,
    textAlign: "center",
    color: "#B91C1C",
    fontWeight: "600",
  },
  button: {
    marginTop: 24,
    backgroundColor: "#7C3AED", // purple
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
