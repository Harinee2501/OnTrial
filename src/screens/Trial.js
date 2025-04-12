import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

const Trial = ({ route }) => {
  const { imageSource } = route.params; // Retrieve image source passed from HikeStartScreen

  return (
    <View style={styles.container}>
      <Image source={imageSource} style={styles.image} resizeMode="contain" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

export default Trial;
