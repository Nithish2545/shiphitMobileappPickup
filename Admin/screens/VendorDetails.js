import { View, Text } from "react-native";
import React from "react";

const VendorDetails = () => {
  const route = useRoute();
  const { awbnumber } = route.params;
  return (
    <View>
      <Text>VendorDetails</Text>
    </View>
  );
};

export default VendorDetails;