package com.example.watch_appwearos.presentation

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import android.os.Looper
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import androidx.wear.compose.material.*
import com.google.android.gms.location.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import androidx.compose.runtime.collectAsState

class MainActivity : ComponentActivity() {
    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private val _locationFlow = MutableStateFlow<LocationData?>(null)
    private val locationFlow = _locationFlow.asStateFlow()
    private var sosActive = mutableStateOf(false)
    private var heartRate = mutableStateOf<Int?>(null)
    private var fallDetected = mutableStateOf(false)

    private val locationPermissionRequest = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        when {
            permissions[Manifest.permission.ACCESS_FINE_LOCATION] == true -> {
                startLocationUpdates()
            }
            permissions[Manifest.permission.ACCESS_COARSE_LOCATION] == true -> {
                startLocationUpdates()
            }
            permissions[Manifest.permission.BODY_SENSORS] == true -> {
                startHeartRateMonitoring()
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)
        checkPermissions()

        setContent {
            MaterialTheme {
                OnTrailApp(
                    locationFlow = locationFlow.collectAsState().value,
                    heartRate = heartRate.value,
                    sosActive = sosActive.value,
                    fallDetected = fallDetected.value,
                    onSosToggle = { toggleSOS() }
                )
            }
        }
    }

    private fun checkPermissions() {
        locationPermissionRequest.launch(
            arrayOf(
                Manifest.permission.ACCESS_FINE_LOCATION,
                Manifest.permission.ACCESS_COARSE_LOCATION,
                Manifest.permission.BODY_SENSORS,
                Manifest.permission.WAKE_LOCK
            )
        )
    }

    private fun startHeartRateMonitoring() {
        // Simulated heart rate for demo
        lifecycleScope.launch {
            while (true) {
                heartRate.value = (60..100).random()
                kotlinx.coroutines.delay(1000)
            }
        }
    }

    private fun toggleSOS() {
        sosActive.value = !sosActive.value
        if (sosActive.value) {
            fallDetected.value = false // Reset fall detection when SOS is manually activated
        }
    }

    private fun startLocationUpdates() {
        try {
            val locationRequest = LocationRequest.Builder(10000) // 10 seconds
                .setPriority(Priority.PRIORITY_HIGH_ACCURACY)
                .build()

            fusedLocationClient.requestLocationUpdates(
                locationRequest,
                object : LocationCallback() {
                    override fun onLocationResult(result: LocationResult) {
                        result.lastLocation?.let { location ->
                            _locationFlow.value = LocationData(
                                latitude = location.latitude,
                                longitude = location.longitude,
                                accuracy = location.accuracy
                            )
                        }
                    }
                },
                Looper.getMainLooper()
            )

            // Simulate fall detection for demo
            lifecycleScope.launch {
                while (true) {
                    kotlinx.coroutines.delay(15000) // Every 15 seconds
                    if (!sosActive.value && (0..10).random() == 0) { // 10% chance
                        fallDetected.value = true
                        sosActive.value = true
                    }
                }
            }
        } catch (e: SecurityException) {
            // Handle permission denial
        }
    }
}

data class LocationData(
    val latitude: Double,
    val longitude: Double,
    val accuracy: Float
)

@Composable
fun OnTrailApp(
    locationFlow: LocationData?,
    heartRate: Int?,
    sosActive: Boolean,
    fallDetected: Boolean,
    onSosToggle: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colors.background),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            TimeText()
            
            Spacer(modifier = Modifier.height(4.dp))
            
            locationFlow?.let { location ->
                Text(
                    text = String.format("%.6f°", location.latitude),
                    fontSize = 12.sp,
                    color = MaterialTheme.colors.primary
                )
                Text(
                    text = String.format("%.6f°", location.longitude),
                    fontSize = 12.sp,
                    color = MaterialTheme.colors.primary
                )
            } ?: Text(
                text = "Acquiring GPS...",
                fontSize = 12.sp,
                color = MaterialTheme.colors.primary
            )
            
            Text(
                text = heartRate?.let { "❤️ $it BPM" } ?: "Measuring HR...",
                fontSize = 14.sp,
                color = MaterialTheme.colors.primary
            )
            
            if (fallDetected) {
                Text(
                    text = "⚠️ Fall Detected!",
                    fontSize = 16.sp,
                    color = Color.Red,
                    fontWeight = FontWeight.Bold
                )
            }
            
            Button(
                onClick = onSosToggle,
                colors = ButtonDefaults.buttonColors(
                    backgroundColor = if (sosActive) Color.Red else MaterialTheme.colors.primary
                ),
                modifier = Modifier.size(width = 80.dp, height = 40.dp)
            ) {
                Text(
                    text = "SOS",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
            }
        }
    }
}