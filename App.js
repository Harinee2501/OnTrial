import React, { useState, useEffect } from 'react';
import { db } from './firebaseConfig';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import MapView, { Polyline, Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { collection, addDoc, getDocs, query, where, onSnapshot } from 'firebase/firestore';

const cautionOptions = [
  'Wildlife',
  'Slippery Area',
  'Landslide',
  'Earthquake',
  'Flooded Area',
];

export default function App() {
  const [location, setLocation] = useState(null);
  const [region, setRegion] = useState({
    latitude: 12.9716,
    longitude: 77.5946,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [trails, setTrails] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [cautionModalVisible, setCautionModalVisible] = useState(false);
  const [selectedCautions, setSelectedCautions] = useState([]);
  const [cautionMarkers, setCautionMarkers] = useState([]);
  const [cautionReports, setCautionReports] = useState([]);
  const [trailEndLocation, setTrailEndLocation] = useState(null);
  const [selectedTrailId, setSelectedTrailId] = useState(null);

  // Watch for location updates
  useEffect(() => {
    let locationSubscription = null;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required.');
        return;
      }

      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 5,
        },
        (loc) => {
          setLocation(loc.coords);
        }
      );
    })();

    return () => {
      if (locationSubscription) locationSubscription.remove();
    };
  }, []);

  // Listen for caution_zones updates in real-time
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'caution_zones'),
      (snapshot) => {
        const fetchedReports = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log('Fetched caution_zones:', fetchedReports);
        setCautionReports(fetchedReports);
      },
      (error) => {
        console.error('Error fetching caution_zones:', error);
      }
    );
    
    return () => unsubscribe();
  }, []);

  // Listen for cautionMarkers updates in real-time
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'cautionMarkers'),
      (snapshot) => {
        const markers = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log('Fetched cautionMarkers:', markers);
        setCautionMarkers(markers);
      },
      (error) => {
        console.error('Error fetching cautionMarkers:', error);
      }
    );
    
    return () => unsubscribe();
  }, []);

  const geocodeLocation = async (placeName) => {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      placeName
    )}`;
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
    const bbox = {
      minLat: lat - delta,
      minLon: lon - delta,
      maxLat: lat + delta,
      maxLon: lon + delta,
    };

    const overpassQuery = `
      [out:json][timeout:25];
      (
        way["highway"="path"]["sac_scale"](${bbox.minLat},${bbox.minLon},${bbox.maxLat},${bbox.maxLon});
      );
      out body;
      >;
      out skel qt;
    `;

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(overpassQuery)}`,
    });

    const data = await response.json();

    const nodes = {};
    for (const el of data.elements) {
      if (el.type === 'node') {
        nodes[el.id] = {
          latitude: el.lat,
          longitude: el.lon,
        };
      }
    }

    const ways = data.elements
      .filter((el) => el.type === 'way')
      .map((way) => ({
        id: way.id,
        coords: way.nodes.map((id) => nodes[id]).filter(Boolean),
      }))
      .filter((trail) => trail.coords.length > 1);

    return ways;
  };

  const handleSearch = async () => {
    if (!searchInput.trim()) return;
    setLoading(true);
    try {
      const { lat, lon } = await geocodeLocation(searchInput);
      const fetchedTrails = await fetchTrails(lat, lon);

      setRegion({
        latitude: lat,
        longitude: lon,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
      setTrails(fetchedTrails);
      if (fetchedTrails.length > 0) {
        const firstCoord = fetchedTrails[0].coords[0];
        setTrailEndLocation(firstCoord);
        setSelectedTrailId(fetchedTrails[0].id);
      } else {
        setTrailEndLocation(null);
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleCaution = (caution) => {
    if (selectedCautions.includes(caution)) {
      setSelectedCautions(selectedCautions.filter((c) => c !== caution));
    } else {
      setSelectedCautions([...selectedCautions, caution]);
    }
  };

  const submitCaution = async () => {
    if (!trailEndLocation) {
      Alert.alert('Error', 'Trail end location not available');
      return;
    }

    if (selectedCautions.length === 0) {
      Alert.alert('Error', 'Please select at least one caution type');
      return;
    }

    const newMarker = {
      latitude: trailEndLocation.latitude,
      longitude: trailEndLocation.longitude,
      cautions: selectedCautions, // For first file compatibility
      selectedCautions: selectedCautions, // For second file compatibility
      trail: selectedTrailId,
      timestamp: new Date().toISOString(),
    };

    try {
      // Store in both collections for full compatibility
      await addDoc(collection(db, 'cautionMarkers'), newMarker);
      await addDoc(collection(db, 'caution_zones'), newMarker);
      
      Alert.alert('Success', 'Caution report submitted successfully');
    } catch (error) {
      console.error('Error submitting caution:', error);
      Alert.alert('Error', 'Failed to report caution');
    }

    setSelectedCautions([]);
    setCautionModalVisible(false);
  };

  // De-duplicate caution markers
  const getUniqueMarkers = () => {
    const seen = new Set();
    const uniqueMarkers = [];
    
    // Process cautionMarkers first
    cautionMarkers.forEach(marker => {
      const key = `${marker.latitude}-${marker.longitude}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueMarkers.push({
          ...marker,
          source: 'cautionMarkers',
        });
      }
    });
    
    // Then process cautionReports
    cautionReports.forEach(report => {
      const key = `${report.latitude}-${report.longitude}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueMarkers.push({
          ...report,
          source: 'cautionReports',
        });
      }
    });
    
    return uniqueMarkers;
  };

  // Debug function to log marker data
  const logMarkerData = (marker) => {
    console.log('Marker data:', {
      source: marker.source,
      id: marker.id,
      cautions: marker.cautions,
      selectedCautions: marker.selectedCautions
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
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

        {trailEndLocation && (
          <View style={styles.gpsInfo}>
            <Text style={{ fontSize: 12 }}>
              Trail End: {trailEndLocation.latitude.toFixed(5)}, {trailEndLocation.longitude.toFixed(5)}
            </Text>
          </View>
        )}

        <View style={styles.buttonRow}>
          <Button 
            title="Report Caution" 
            onPress={() => {
              if (!trailEndLocation) {
                Alert.alert('Error', 'Please search for and select a trail first');
              } else {
                setCautionModalVisible(true);
              }
            }} 
          />
        </View>

        {loading && (
          <View style={styles.loader}>
            <ActivityIndicator size="large" />
            <Text>Loading trails...</Text>
          </View>
        )}

        <MapView 
          style={styles.map} 
          region={region}
          showsUserLocation={true}
        >
          {trails.map((trail) => (
            <Polyline
              key={trail.id}
              coordinates={trail.coords}
              strokeColor="#FF5733"
              strokeWidth={3}
            />
          ))}

          {trailEndLocation && (
            <Marker
              coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,}}
              title="Trail End"
              pinColor="blue"
            />
          )}

          {/* Display combined caution markers with callouts */}
          {getUniqueMarkers().map(marker => {
            // Extract caution data - prioritize cautions field, fall back to selectedCautions
            const cautionData = marker.cautions || marker.selectedCautions || [];
            
            return (
              <Marker
                key={`${marker.source}-${marker.id}`}
                coordinate={{
                  latitude: marker.latitude,
                  longitude: marker.longitude,
                }}
                pinColor="orange"
                calloutVisible={true}
                onPress={() => logMarkerData(marker)} // Debug: log data when pressed
              >
                <Callout tooltip style={styles.calloutContainer}>
                  <View style={styles.callout}>
                    <Text style={styles.calloutTitle}>Caution Zone</Text>
                    {marker.cautions && marker.cautions.length > 0 ? (
                    marker.cautions.map((caution, index) => (
                      <Text key={index} style={styles.cautionText}>• {caution}</Text>
                    ))
                  ) : (
                    <Text style={styles.cautionText}>No specific cautions listed</Text>
                  )}

                    {marker.timestamp && (
                      <Text style={styles.timestamp}>
                        Reported: {new Date(marker.timestamp).toLocaleString()}
                      </Text>
                    )}
                  </View>
                </Callout>
              </Marker>
            );
          })}
        </MapView>

        {/* Caution Modal */}
        <Modal visible={cautionModalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Select Caution Types</Text>
              <ScrollView style={styles.cautionList}>
                {cautionOptions.map((caution) => (
                  <Pressable
                    key={caution}
                    style={[
                      styles.cautionItem,
                      selectedCautions.includes(caution) && styles.cautionItemSelected,
                    ]}
                    onPress={() => toggleCaution(caution)}
                  >
                    <Text>{caution}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              <View style={styles.modalButtons}>
                <Button title="Cancel" onPress={() => setCautionModalVisible(false)} />
                <Button title="Report" onPress={submitCaution} />
              </View>
            </View>
          </View>
        </Modal>
        
        {/* Debug info display */}
        {__DEV__ && (
          <View style={styles.debugInfo}>
            <Text style={styles.debugText}>
              Markers: {cautionMarkers.length}, Reports: {cautionReports.length}
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: { 
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    marginTop: 30,
    zIndex: 1,
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
    zIndex: 1,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  map: { 
    flex: 1,
  },
  loader: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 2,
    backgroundColor: 'rgba(255,255,255,0.8)',
    padding: 10,
    borderRadius: 5,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: 6,
    zIndex: 1,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    elevation: 5,
    maxHeight: '70%',
  },
  modalTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
    fontSize: 16,
    textAlign: 'center',
  },
  cautionList: {
    maxHeight: '70%',
  },
  cautionItem: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#eee',
    marginVertical: 4,
  },
  cautionItemSelected: {
    backgroundColor: '#fda172',
  },
  modalButtons: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  // Enhanced callout styles
  calloutContainer: {
    width: 200,
    padding: 0,
    backgroundColor: 'transparent',
  },
  callout: {
    width: 200,
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 6,
    borderColor: '#ccc',
    borderWidth: 0.5,
    // Add shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    // Add elevation for Android
    elevation: 3,
  },
  calloutTitle: {
    fontWeight: 'bold',
    marginBottom: 6,
    fontSize: 16,
    color: '#333',
  },
  cautionText: {
    marginLeft: 5,
    marginBottom: 3,
    color: '#444',
    fontSize: 14,
  },
  timestamp: {
    fontSize: 11,
    color: '#666',
    marginTop: 5,
    fontStyle: 'italic',
  },
  debugInfo: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 5,
    borderRadius: 5,
  },
  debugText: {
    color: 'white',
    fontSize: 10,
  }
});