// App.js
import React, { useEffect, useState, useCallback } from 'react';
import { View, ActivityIndicator } from 'react-native';
import WeatherScreen from './WeatherScreen';
import HomeScreen from './HomeScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import NetInfo from '@react-native-community/netinfo';

const WEATHER_API_KEY = '96756d6c068f44c8aee134226251104';

export default function App() {
  const [weatherData, setWeatherData] = useState(null);
  const [airQualityData, setAirQualityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [location, setLocation] = useState(null);

  const fetchWeatherData = useCallback(async () => {
    setLoading(true);
    try {
      const { isConnected } = await NetInfo.fetch();
      setIsOffline(!isConnected);
      
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        console.log('Permission denied');
        setLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
      const { latitude, longitude } = loc.coords;

      if (isConnected) {
        const weatherRes = await fetch(`https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${latitude},${longitude}`);
        const weatherJson = await weatherRes.json();

        const airRes = await fetch(`https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${latitude},${longitude}&aqi=yes`);
        const airJson = await airRes.json();

        setWeatherData(weatherJson);
        setAirQualityData(airJson);

        // Cache both
        await AsyncStorage.setItem('weatherData', JSON.stringify(weatherJson));
        await AsyncStorage.setItem('airQualityData', JSON.stringify(airJson));
      } else {
        const cachedWeather = await AsyncStorage.getItem('weatherData');
        const cachedAir = await AsyncStorage.getItem('airQualityData');
        if (cachedWeather) setWeatherData(JSON.parse(cachedWeather));
        if (cachedAir) setAirQualityData(JSON.parse(cachedAir));
      }
    } catch (e) {
      console.error('Error fetching data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeatherData();
  }, []);

  if (loading) {
    return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator size="large" /></View>;
  }

  return (
    <WeatherScreen
      weatherData={weatherData}
      airQualityData={airQualityData}
      onRefresh={fetchWeatherData}
      location={location}
      isOffline={isOffline}
    />
  );
}
