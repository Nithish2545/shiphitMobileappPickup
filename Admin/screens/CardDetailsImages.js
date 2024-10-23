import { View, Text, Modal } from 'react-native'
import React from 'react'

const CardDetailsImages = () => {
    const [selectedImage, setSelectedImage] = useState(null); // State to track the selected image
  const [modalVisible, setModalVisible] = useState(false); // State to track modal visibility

  return (
    <View>
    <View style={styles.card}>
    <Text>PACKAGEWEIGHTIMAGES</Text>
    {details.PACKAGEWEIGHTIMAGES.map((d, index) => (
      <TouchableOpacity key={index} onPress={() => handleImageClick(d)}>
        <Image source={{ uri: d }} style={styles.image} />
      </TouchableOpacity>
    ))}
  </View>
  <View style={styles.card}>
    <Text>PACKAGEWEIGHTIMAGES</Text>
    {details.PACKAGEWEIGHTIMAGES.map((d) => (
      <Image source={{ uri: d }} style={styles.image} />
    ))}
  </View>
  <Modal visible={modalVisible} transparent={true} animationType="fade">
    <View style={styles.modalContainer}>
      <View style={styles.modalContent}>
        <TouchableOpacity onPress={closeModal}>
          <Text style={styles.closeButton}>Close</Text>
        </TouchableOpacity>
        {selectedImage && (
          <Image
            source={{ uri: selectedImage }}
            style={styles.modalImage}
          />
        )}
      </View>
    </View>
    </View>

  </Modal>
  )
}

export default CardDetailsImages