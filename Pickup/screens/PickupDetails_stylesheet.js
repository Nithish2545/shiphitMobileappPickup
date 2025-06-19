import { StyleSheet } from "react-native";

export default StyleSheet.create({
  // --- General Layout & Containers ---
  container: {
    flexGrow: 1,
    padding: 20,
    marginTop: 50,
    paddingBottom: 100,
    backgroundColor: "#F0F2F5", // Light, modern background
  },
  backButton: {
    marginBottom: 20,
    fontSize: 18,
    color: "#8447D6", // Accent color for navigation
    fontWeight: "600",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F0F2F5",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#333333", // Darker for main titles
    marginBottom: 25, // More breathing room
    textAlign: "center",
  },

  // --- Detail Section ---
  detailContainer: {
    marginBottom: 15,
    backgroundColor: "#FFFFFF",
    borderRadius: 10, // Slightly more rounded
    padding: 18, // More padding
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 }, // Deeper shadow
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 3,
    borderLeftWidth: 6, // Slightly thicker border
    borderLeftColor: "#8447D6", // Accent color
  },
  label: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4A4A4A", // Darker label for clarity
    marginBottom: 5,
  },
  text: {
    fontSize: 17,
    color: "#666666", // Improved readability
    lineHeight: 24,
  },

  // --- "Update Details" Section (Form Container) ---
  formContainer: {
    marginTop: 40, // Increased separation
    padding: 30, // Generous padding for a spacious feel
    backgroundColor: "#FFFFFF",
    borderRadius: 15, // Significantly more rounded for a modern card look
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 }, // Prominent shadow for depth
    shadowOpacity: 0.18, // More visible shadow
    shadowRadius: 15, // Softer shadow
    elevation: 10,
  },
  subtitle: {
    // This is the heading for "Update Details"
    fontSize: 24, // Larger and more impactful
    fontWeight: "800", // Extra bold
    color: "#8447D6", // Accent color
    marginBottom: 30, // More space below the heading
    textAlign: "center",
    textTransform: "uppercase", // Make it uppercase for emphasis
    letterSpacing: 0.5, // Slight letter spacing
  },
  weighttext: {
    // Labels like "Pickup weight" and "No. of boxes"
    color: "#333333", // Darker and clearer
    fontSize: 18, // Slightly larger
    marginBottom: 10, // More space below the label
    marginTop: 25, // More space above
    fontWeight: "700", // Bolder
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D1D1",
    borderRadius: 10, // More rounded input fields
    padding: 14, // More internal padding
    marginBottom: 20, // Increased space below inputs
    backgroundColor: "#F9F9F9", // Slight off-white background for inputs
    fontSize: 16,
    color: "#333",
    shadowColor: "#000", // Subtle inner shadow for inputs
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30, // More space below quantity controls
  },
  increDecre: {
    paddingHorizontal: 22, // Wider
    paddingVertical: 10, // Taller
    backgroundColor: "#8447D6", // Strong accent color
    borderRadius: 30, // Fully rounded, pill-shaped buttons
    alignItems: "center",
    justifyContent: "center",
    minWidth: 50, // Ensure a minimum width
  },
  buttonText: {
    // Text for the +/- buttons
    color: "#FFFFFF",
    fontSize: 32, // Larger plus/minus symbols
    fontWeight: "bold",
  },
  quantityInput: {
    borderWidth: 1,
    borderColor: "#D1D1D1",
    borderRadius: 10, // Match other inputs
    padding: 12,
    marginHorizontal: 20, // Increased spacing
    width: 80, // Wider input for quantity
    fontSize: 20, // Larger text
    textAlign: "center",
    backgroundColor: "#F9F9F9",
    color: "#333",
    fontWeight: "bold",
    shadowColor: "#000", // Subtle shadow
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  errorText: {
    color: "#E74C3C",
    fontSize: 16, // Slightly larger error text
    marginTop: 20, // More space above error
    marginBottom: 15, // Space before submit button
    textAlign: "center",
    fontWeight: "600", // Bolder error text
    paddingHorizontal: 15,
  },
  // Submit Button Style - Applied directly to Button component if possible,
  // or wrap Button in a View with this style for custom styling.
  submitButton: {
    backgroundColor: "#8447D6", // Accent color for the main action
    borderRadius: 10,
    paddingVertical: 15, // Taller button
    marginTop: 20, // Space above the button
    shadowColor: "#8447D6", // Shadow matching button color
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  // --- File Input Specific Styles (Adjusted for consistency) ---
  fileContainer: {
    marginBottom: 25, // More space above and below file input sections
    marginTop: 20,
  },
  fileList: {
    marginTop: 15, // More space above the list of files
  },
  fileItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12, // More space between file items
    backgroundColor: "#F7F7F7",
    borderRadius: 10, // Match other rounded elements
    padding: 14, // More padding
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E0E0E0",
  },

  // --- Image Upload (Selfie) Section ---
  container2: {
    // This is the container for the selfie upload section
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9F9F9",
    paddingVertical: 25, // Increased vertical padding
    paddingHorizontal: 20, // Added horizontal padding
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E0E0E0",
    marginTop: 30, // More space above this section
    marginBottom: 35, // More space below this section
  },
  imageContainer: {
    // Container around the displayed selfie
    alignItems: "center",
    marginBottom: 30,
    borderColor: "#D1D1D1",
    borderWidth: 1,
    borderRadius: 12,
    padding: 18,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    width: "95%",
    maxWidth: 340, // Increased max width
  },
  image: {
    // The selfie image itself
    width: "100%",
    height: 280, // Taller image for better visibility
    marginBottom: 18,
    borderRadius: 12, // Match container
    resizeMode: "cover",
  },
  buttonContainer: {
    // "Pick an Image from Gallery" button
    backgroundColor: "#8447D6",
    paddingVertical: 16, // Taller button
    borderRadius: 10, // More rounded
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18, // More space above
    marginBottom: 10,
  },
  buttonContainer2: {
    // Wrapper for the selfie picker components
    width: "100%",
    padding: 0,
    marginBottom: 15,
  },
  removeButtonContainer: {
    // Container for the "Remove Image" button
    marginTop: 18,
    width: "100%",
  },

  // --- Typography (specific to original design, kept for compatibility) ---
  subtitle2: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#8447D6",
    marginVertical: 8,
    marginBottom: 10,
  },
});
