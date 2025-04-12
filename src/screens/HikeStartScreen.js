import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native'; // Import for navigation

// ✅ Ensure correct folder name: 'assets'
import HimalayasImage from '../assests/himalayas.jpeg';
import ManaliImage from '../assests/manali.jpeg';

const HikeStartScreen = () => {
  const [locationInput, setLocationInput] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const navigation = useNavigation(); // Initialize navigation

  const handleShowImage = () => {
    const keyword = locationInput.trim().toLowerCase();
    if (keyword.includes('himalaya')) {
      setSelectedImage(HimalayasImage);
    } else if (keyword.includes('manali')) {
      setSelectedImage(ManaliImage);
    } else {
      setSelectedImage(null);
    }
  };

  const handleImageClick = () => {
    if (selectedImage) {
      navigation.navigate('Trial', { imageSource: selectedImage }); // Navigate to ImageFullScreen screen
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Where are you going?</Text>
      <TextInput
        style={styles.input}
        value={locationInput}
        onChangeText={setLocationInput}
        placeholder="Type location name"
      />
      <Button title="Show Trial" onPress={handleShowImage} />

      {selectedImage && (
        <Image
          source={selectedImage}
          style={styles.image}
          resizeMode="cover"
          onTouchEnd={handleImageClick} // Navigate on image click
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    marginBottom: 12,
    fontWeight: '600',
  },
  input: {
    width: '100%',
    borderColor: '#aaa',
    borderWidth: 1,
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
  },
  image: {
    width: '100%',
    height: 250,
    marginTop: 20,
    borderRadius: 10,
  },
});

export default HikeStartScreen;
