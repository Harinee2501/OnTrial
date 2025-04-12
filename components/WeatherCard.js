// WeatherScreen.js
import React from 'react';
import { View, Text, StyleSheet, Button, ScrollView } from 'react-native';

const WeatherScreen = ({ weatherData, airQualityData, onRefresh }) => {
  if (!weatherData || !airQualityData) {
    return <Text>No data available</Text>;
  }

  const weather = weatherData.current;
  const airQuality = airQualityData.current.air_quality;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Weather & Air Quality</Text>
      <Text>Temperature: {weather.temp_c}°C</Text>
      <Text>Condition: {weather.condition.text}</Text>
      <Text>Humidity: {weather.humidity}%</Text>
      <Text>Wind: {weather.wind_kph} kph</Text>

      <Text style={styles.subtitle}>Air Quality Index:</Text>
      <Text>PM2.5: {airQuality.pm2_5.toFixed(2)}</Text>
      <Text>PM10: {airQuality.pm10.toFixed(2)}</Text>
      <Text>CO: {airQuality.co.toFixed(2)}</Text>
      <Text>NO₂: {airQuality.no2.toFixed(2)}</Text>

      <View style={{ marginTop: 30 }}>
        <Button title="Refresh" onPress={onRefresh} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    marginTop: 50,
    alignItems: 'flex-start'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10
  },
  subtitle: {
    marginTop: 20,
    fontWeight: 'bold'
  }
});

export default WeatherScreen;
