import React, { useRef } from "react";
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
const RAIL_WIDTH = SCREEN_WIDTH - 120;
const THUMB_SIZE = 48;
const SWIPE_THRESHOLD = RAIL_WIDTH * 0.6;

const SwipeToConfirm = ({
  onSwipe,
  buttonText = "Swipe to confirm",
  railColor = "#e0e0e0",
  thumbColor = "#6a1b9a",
  successColor = "#4caf50",
  disabled = false,
  confirmed,
}) => {
  const translateX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 10 && !confirmed && !disabled,

      onPanResponderMove: (_, gestureState) => {
        if (disabled || confirmed) return;

        const dx = Math.max(
          0,
          Math.min(gestureState.dx, RAIL_WIDTH - THUMB_SIZE)
        );
        translateX.setValue(dx);
      },

      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > SWIPE_THRESHOLD) {
          Animated.timing(translateX, {
            toValue: RAIL_WIDTH - THUMB_SIZE,
            duration: 250,
            useNativeDriver: false,
          }).start(() => {
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
                backgroundColor: disabled ? "#b0b0b0" : thumbColor,
                transform: [{ translateX }],
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
    alignItems: "center",
    marginVertical: 10,
    marginLeft: "auto",
    position: "relative",
    zIndex: 10,
  },
  rail: {
    borderRadius: 25,
    height: THUMB_SIZE,
    justifyContent: "center",
    overflow: "hidden",
    width: RAIL_WIDTH,
  },
  label: {
    position: "absolute",
    alignSelf: "center",
    zIndex: 1,
    fontSize: 14,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 1, height: 2 },
    position: "absolute",
    left: 0,
    zIndex: 2,
  },
});

export default SwipeToConfirm;
