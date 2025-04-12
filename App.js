import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import MapView, { Polyline, Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const WEATHER_API_KEY = '96756d6c068f44c8aee134226251104'; // Weather API key

export default function App() {
  const [location, setLocation] = useState(null);
  const [region, setRegion] = useState(null);
  const [trails, setTrails] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [trailEndLocation, setTrailEndLocation] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [airQualityData, setAirQualityData] = useState(null);
  const [isOffline, setIsOffline] = useState(false);


  const fetchWeatherData = async (latitude, longitude) => {
    setLoading(true);
    try {
      const { isConnected } = await NetInfo.fetch();
      setIsOffline(!isConnected);
      
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
  };

  useEffect(() => {
    let locationSubscription = null;

    

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required.');
        return;
      }

      locationSubscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 5 },
        (loc) => {
          setLocation(loc.coords);
          fetchWeatherData(loc.coords.latitude, loc.coords.longitude); // Fetch weather when location updates
        }
      );
    })();

    return () => {
      if (locationSubscription) locationSubscription.remove();
    };
  }, []);

  const geocodeLocation = async (placeName) => {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(placeName)}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'hiking-trail-app' },
    });
    const data = await response.json();
    if (data.length === 0) throw new Error('Location not found');
    return {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon),
    };
  };

  const fetchTrails = async (lat, lon) => {
    const delta = 0.02;
    const bbox = { minLat: lat - delta, minLon: lon - delta, maxLat: lat + delta, maxLon: lon + delta };
    const overpassQuery = `[out:json][timeout:25];(way["highway"="path"]["sac_scale"](${bbox.minLat},${bbox.minLon},${bbox.maxLat},${bbox.maxLon}););out body; >;out skel qt;`;

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(overpassQuery)}`,
    });
    
    const data = await response.json();

    const nodes = {};
    for (const el of data.elements) {
      if (el.type === 'node') {
        nodes[el.id] = { latitude: el.lat, longitude: el.lon };
      }
    }

    const ways = data.elements.filter((el) => el.type === 'way').map((way) => ({
      id: way.id,
      coords: way.nodes.map((id) => nodes[id]).filter(Boolean),
    })).filter((trail) => trail.coords.length > 1);

    return ways;
  };

  const handleSearch = async () => {
    if (!searchInput.trim()) return;
    setLoading(true);
    try {
      const { lat, lon } = await geocodeLocation(searchInput);
      const fetchedTrails = await fetchTrails(lat, lon);

      setRegion({ latitude: lat, longitude: lon, latitudeDelta: 0.05, longitudeDelta: 0.05 });
      setTrails(fetchedTrails);
      if (fetchedTrails.length > 0) {
        const firstCoord = fetchedTrails[0].coords[0];
        setTrailEndLocation(firstCoord);
      } else {
        setTrailEndLocation(null);
      }

      fetchWeatherData(lat, lon); // Fetch weather data based on searched location
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter location (e.g., Manali)"
          value={searchInput}
          onChangeText={setSearchInput}
        />
        <Button title="Search" onPress={handleSearch} />
      </View>

      {weatherData && !loading && (
        <View style={styles.weatherInfo}>
          <Text>Weather: {weatherData.current.temp_c}°C</Text>
          <Text>Condition: {weatherData.current.condition.text}</Text>
          <Text>Air Quality: {airQualityData ? airQualityData.current.air_quality.pm10 : 'N/A'}</Text>
        </View>
      )}

      {loading && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" />
          <Text>Loading trails and weather...</Text>
        </View>
      )}

      {region && (
        <MapView style={styles.map} region={region}>
          {trails.map((trail) => (
            <Polyline key={trail.id} coordinates={trail.coords} strokeColor="#FF5733" strokeWidth={3} />
          ))}

          {trailEndLocation && (
            <Marker coordinate={trailEndLocation} title="Trail End" pinColor="blue" />
          )}
        </MapView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    marginTop: 30,
  },
  input: {
    flex: 1,
    borderColor: '#aaa',
    borderWidth: 1,
    marginRight: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
  },
  gpsInfo: {
    alignItems: 'center',
    paddingBottom: 4,
  },
  map: { flex: 1 },
  loader: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  weatherInfo: {
    padding: 10,
    backgroundColor: '#fff',
    marginBottom: 10,
    alignItems: 'center',
  },
});
