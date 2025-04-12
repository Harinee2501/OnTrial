// HomeScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Location from 'expo-location';

const HomeScreen = () => {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    let locationWatcher;

    const startWatching = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      locationWatcher = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10
        },
        (newLocation) => {
          setLocation(newLocation.coords);
        }
      );
    };

    startWatching();

    return () => {
      if (locationWatcher) locationWatcher.remove();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Live GPS Tracking</Text>
      {errorMsg ? (
        <Text style={styles.error}>{errorMsg}</Text>
      ) : location ? (
        <>
          <Text>Latitude: {location.latitude.toFixed(5)}</Text>
          <Text>Longitude: {location.longitude.toFixed(5)}</Text>
        </>
      ) : (
        <Text>Fetching location...</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 30,
    justifyContent: 'center',
    backgroundColor: '#f0f4f8'
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: 'bold'
  },
  error: {
    color: 'red'
  }
});

export default HomeScreen;
