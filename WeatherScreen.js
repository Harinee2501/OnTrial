// WeatherScreen.js
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Button, ScrollView, Alert } from 'react-native';

const WeatherScreen = ({ weatherData, airQualityData, onRefresh, location, isOffline }) => {
  if (!weatherData || !airQualityData) {
    return <Text>No data available</Text>;
  }

  const weather = weatherData.current;
  const airQuality = airQualityData.current.air_quality;

  useEffect(() => {
    const code = weather.condition.code;
    if ([1003, 1006, 1009, 1030].includes(code)) {
      Alert.alert("Weather Alert", `Be cautious! Condition: ${weather.condition.text}`);
    }
  }, [weather.condition.code]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Smart Hiker Report</Text>
      {location && (
        <Text style={styles.location}>Your Location: {location.latitude.toFixed(2)}, {location.longitude.toFixed(2)}</Text>
      )}
      {isOffline && <Text style={styles.offline}>You are viewing offline data.</Text>}

      <Text style={styles.subtitle}>Weather</Text>
      <Text>Temperature: {weather.temp_c}°C</Text>
      <Text>Condition: {weather.condition.text}</Text>
      <Text>Humidity: {weather.humidity}%</Text>
      <Text>Wind: {weather.wind_kph} kph</Text>

      <Text style={styles.subtitle}>Air Quality</Text>
      <Text>PM2.5: {airQuality.pm2_5.toFixed(2)}</Text>
      <Text>PM10: {airQuality.pm10.toFixed(2)}</Text>
      <Text>CO: {airQuality.co.toFixed(2)}</Text>
      <Text>NO₂: {airQuality.no2.toFixed(2)}</Text>

      <View style={styles.buttonContainer}>
        <Button title="Refresh" onPress={onRefresh} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 60,
    flexGrow: 1,
    alignItems: 'flex-start',
    backgroundColor: '#f0f4f8'
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 10
  },
  subtitle: {
    marginTop: 20,
    fontWeight: 'bold',
    fontSize: 18
  },
  location: {
    marginBottom: 10,
    fontStyle: 'italic'
  },
  offline: {
    color: 'red',
    marginBottom: 10
  },
  buttonContainer: {
    marginTop: 30,
    alignSelf: 'stretch'
  }
});

export default WeatherScreen;
