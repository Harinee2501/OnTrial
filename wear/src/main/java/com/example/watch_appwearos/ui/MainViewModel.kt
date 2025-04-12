package com.example.watch_appwearos.ui

import android.Manifest
import android.app.Application
import android.content.Context
import android.content.pm.PackageManager
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.location.Location
import android.os.Handler
import android.os.Looper
import androidx.core.content.ContextCompat
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.watch_appwearos.data.DataStore
import com.example.watch_appwearos.data.HeartRateData
import com.example.watch_appwearos.data.LocationData
import com.example.watch_appwearos.data.MotionData
import com.example.watch_appwearos.data.SosStatus
import com.example.watch_appwearos.services.WearableCommunicationService
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import kotlin.math.sqrt

class MainViewModel(application: Application) : AndroidViewModel(application), SensorEventListener {
    private val fusedLocationClient: FusedLocationProviderClient = LocationServices.getFusedLocationProviderClient(application)
    private val sensorManager = application.getSystemService(Context.SENSOR_SERVICE) as SensorManager
    private val heartRateSensor = sensorManager.getDefaultSensor(Sensor.TYPE_HEART_RATE)
    private val accelerometerSensor = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
    private val handler = Handler(Looper.getMainLooper())
    private val dataStore = DataStore(application)
    private val communicationService = WearableCommunicationService(application)
    
    private val _locationData = MutableStateFlow(LocationData())
    val locationData: StateFlow<LocationData> = _locationData.asStateFlow()
    
    private val _sosStatus = MutableStateFlow(SosStatus())
    val sosStatus: StateFlow<SosStatus> = _sosStatus.asStateFlow()
    
    private val _heartRateData = MutableStateFlow(HeartRateData())
    val heartRateData: StateFlow<HeartRateData> = _heartRateData.asStateFlow()
    
    private val _motionData = MutableStateFlow(MotionData())
    val motionData: StateFlow<MotionData> = _motionData.asStateFlow()
    
    private val LOW_HEART_RATE_THRESHOLD = 40f
    private val HIGH_HEART_RATE_THRESHOLD = 120f
    private val FALL_ACCELERATION_THRESHOLD = 15f
    
    init {
        startSensors()
    }
    
    private fun startSensors() {
        if (hasBodySensorsPermission()) {
            heartRateSensor?.let {
                sensorManager.registerListener(this, it, SensorManager.SENSOR_DELAY_NORMAL)
            }
            
            accelerometerSensor?.let {
                sensorManager.registerListener(this, it, SensorManager.SENSOR_DELAY_NORMAL)
            }
        }
    }
    
    override fun onSensorChanged(event: SensorEvent) {
        when (event.sensor.type) {
            Sensor.TYPE_HEART_RATE -> {
                val heartRate = event.values[0]
                val isLow = heartRate < LOW_HEART_RATE_THRESHOLD
                val isHigh = heartRate > HIGH_HEART_RATE_THRESHOLD
                
                _heartRateData.value = HeartRateData(
                    heartRate = heartRate,
                    isLow = isLow
                )
                
                // Send heart rate update to phone
                viewModelScope.launch {
                    communicationService.sendHeartRateUpdate(_heartRateData.value)
                }
                
                if ((isLow || isHigh) && !_sosStatus.value.isActive) {
                    triggerSos("Abnormal heart rate detected: ${heartRate.toInt()} BPM")
                }
                
                // Save tracking data
                saveTrackingData()
            }
            Sensor.TYPE_ACCELEROMETER -> {
                val x = event.values[0]
                val y = event.values[1]
                val z = event.values[2]
                
                // Calculate total acceleration
                val totalAcceleration = sqrt(x * x + y * y + z * z)
                
                // Check for fall detection (sudden high acceleration followed by low)
                val isFallDetected = totalAcceleration > FALL_ACCELERATION_THRESHOLD
                
                _motionData.value = MotionData(
                    accelerationX = x,
                    accelerationY = y,
                    accelerationZ = z,
                    isFallDetected = isFallDetected
                )
                
                if (isFallDetected && !_sosStatus.value.isActive) {
                    triggerSos("Fall detected")
                }
                
                // Save tracking data
                saveTrackingData()
            }
        }
    }
    
    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {
        // Not needed for this implementation
    }
    
    fun updateLocation() {
        if (hasLocationPermission()) {
            viewModelScope.launch {
                try {
                    val location = fusedLocationClient.getCurrentLocation(
                        Priority.PRIORITY_HIGH_ACCURACY,
                        null
                    ).await()
                    
                    location?.let { updateLocationData(it) }
                    
                    // Send location update to phone
                    communicationService.sendLocationUpdate(_locationData.value)
                    
                    // Save tracking data after location update
                    saveTrackingData()
                } catch (e: SecurityException) {
                    // Handle permission denial
                }
            }
        }
    }
    
    private fun updateLocationData(location: Location) {
        _locationData.value = LocationData(
            latitude = location.latitude,
            longitude = location.longitude,
            accuracy = location.accuracy
        )
    }
    
    fun triggerSos(reason: String = "Manual trigger") {
        _sosStatus.value = SosStatus(
            isActive = true,
            lastTriggered = System.currentTimeMillis(),
            triggerReason = reason
        )
        
        // Send emergency alert to phone
        viewModelScope.launch {
            communicationService.sendEmergencyAlert(
                reason = reason,
                location = _locationData.value,
                heartRate = _heartRateData.value
            )
        }
        
        // Start Morse code pattern
        startMorseCodePattern()
        
        // Save tracking data
        saveTrackingData()
    }
    
    fun cancelSos() {
        _sosStatus.value = SosStatus()
        // Stop Morse code pattern
        stopMorseCodePattern()
        
        // Save tracking data
        saveTrackingData()
    }
    
    private fun saveTrackingData() {
        dataStore.saveTrackingData(
            timestamp = System.currentTimeMillis(),
            latitude = _locationData.value.latitude,
            longitude = _locationData.value.longitude
        )
    }
    
    // Morse code SOS pattern: ... --- ...
    private val morseCodeRunnable = object : Runnable {
        private var count = 0
        
        override fun run() {
            if (_sosStatus.value.isActive) {
                // Toggle LED or screen brightness
                // This is a placeholder - actual implementation would depend on device capabilities
                
                count = (count + 1) % 12
                handler.postDelayed(this, 200) // 200ms for each dot/dash
            }
        }
    }
    
    private fun startMorseCodePattern() {
        handler.post(morseCodeRunnable)
    }
    
    private fun stopMorseCodePattern() {
        handler.removeCallbacks(morseCodeRunnable)
    }
    
    private fun hasLocationPermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            getApplication(),
            Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED ||
        ContextCompat.checkSelfPermission(
            getApplication(),
            Manifest.permission.ACCESS_COARSE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
    }
    
    private fun hasBodySensorsPermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            getApplication(),
            Manifest.permission.BODY_SENSORS
        ) == PackageManager.PERMISSION_GRANTED
    }
    
    override fun onCleared() {
        super.onCleared()
        sensorManager.unregisterListener(this)
        stopMorseCodePattern()
    }
} 