import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.6;

const SwipeToConfirm = ({
  onSwipe,
  buttonText = "Swipe to confirm",
  railColor = "#e0e0e0",
  thumbColor = "#6a1b9a",
  successColor = "#4caf50",
  disabled = false,
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const [confirmed, setConfirmed] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10 && !confirmed;
      },
      onPanResponderMove: Animated.event([null, { dx: translateX }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > SWIPE_THRESHOLD) {
          Animated.timing(translateX, {
            toValue: SCREEN_WIDTH - 80,
            duration: 300,
            useNativeDriver: false,
          }).start(() => {
            setConfirmed(true);
            onSwipe && onSwipe();
          });
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.rail,
          { backgroundColor: confirmed ? successColor : railColor },
        ]}
      >
        <Text
          style={[
            styles.label,
            { color: confirmed ? "#fff" : "#555", fontWeight: "600" },
          ]}
        >
          {confirmed ? "✔ Warehouse Reached" : buttonText}
        </Text>

        {!confirmed && (
          <Animated.View
            {...panResponder.panHandlers}
            style={[
              styles.thumb,
              {
                transform: [{ translateX }],
                backgroundColor: disabled ? "#b0b0b0" : thumbColor,
              },
            ]}
          >
            <FontAwesome name="arrow-right" size={20} color="#fff" />
          </Animated.View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // paddingHorizontal: 20,
    alignItems: "center",
    marginVertical: 10,
    marginLeft: "auto",
  },
  rail: {
    borderRadius: 25,
    height: 48,
    justifyContent: "center",
    overflow: "hidden",
    width: SCREEN_WIDTH - 120,
  },
  label: {
    position: "absolute",
    alignSelf: "center",
    zIndex: 1,
    fontSize: 14,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 1, height: 2 },
  },
});

export default SwipeToConfirm;
