import { Button, StyleSheet, Text, View } from "react-native";

const FileInput = ({ label, files, onAddFiles, onRemoveFile }) => (
  <View style={styles.fileContainer}>
    <Text style={styles.subtitle}>{label}</Text>
    <Button title="Add Files" onPress={onAddFiles} color="#8447D6" />
    {files.length > 0 && (
      <View style={styles.fileList}>
        {files.map((file, index) => (
          <View key={index} style={styles.fileItem}>
            <Text>{file.fileName}</Text>
            <Button
              title="Remove"
              onPress={() => onRemoveFile(file.fileName)}
              color="#8447D6"
            />
          </View>
        ))}
      </View>
    )}
  </View>
);

const styles = StyleSheet.create({
  fileContainer: {
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#8447D6",
    marginVertical: 8,
  },
  fileList: {
    marginTop: 8,
  },
  fileItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
});
export default FileInput;
