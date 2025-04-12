package com.example.watch_appwearos.ui

import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.wear.compose.foundation.lazy.ScalingLazyColumn
import androidx.wear.compose.foundation.lazy.items
import androidx.wear.compose.material.*
import com.example.watch_appwearos.data.HeartRateData
import com.example.watch_appwearos.data.LocationData
import com.example.watch_appwearos.data.MotionData
import com.example.watch_appwearos.data.SosStatus
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@Composable
fun MainScreen(
    viewModel: MainViewModel,
    modifier: Modifier = Modifier
) {
    val locationData by viewModel.locationData.collectAsState()
    val sosStatus by viewModel.sosStatus.collectAsState()
    val heartRateData by viewModel.heartRateData.collectAsState()
    val motionData by viewModel.motionData.collectAsState()
    val scope = rememberCoroutineScope()
    
    // Update location every 30 seconds
    LaunchedEffect(Unit) {
        while (true) {
            viewModel.updateLocation()
            delay(30000)
        }
    }
    
    ScalingLazyColumn(
        modifier = modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        item {
            LocationDisplay(locationData)
        }
        
        item {
            Spacer(modifier = Modifier.height(8.dp))
            HeartRateDisplay(heartRateData)
        }
        
        item {
            Spacer(modifier = Modifier.height(8.dp))
            MotionDisplay(motionData)
        }
        
        item {
            Spacer(modifier = Modifier.height(8.dp))
            SosButton(
                isActive = sosStatus.isActive,
                onSosTrigger = { viewModel.triggerSos() },
                onSosCancel = { viewModel.cancelSos() }
            )
        }
        
        if (sosStatus.isActive) {
            item {
                Spacer(modifier = Modifier.height(8.dp))
                SosStatusDisplay(sosStatus)
            }
        }
    }
}

@Composable
fun LocationDisplay(location: LocationData) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(8.dp),
        onClick = { }
    ) {
        Column(
            modifier = Modifier
                .padding(8.dp)
                .fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "Location",
                style = MaterialTheme.typography.title3
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "Lat: ${location.latitude.format(6)}\nLong: ${location.longitude.format(6)}",
                style = MaterialTheme.typography.body2,
                textAlign = TextAlign.Center
            )
            Text(
                text = "Accuracy: ±${location.accuracy.format(1)}m",
                style = MaterialTheme.typography.caption2,
                textAlign = TextAlign.Center
            )
        }
    }
}

@Composable
fun HeartRateDisplay(heartRateData: HeartRateData) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(8.dp),
        onClick = { }
    ) {
        Column(
            modifier = Modifier
                .padding(8.dp)
                .fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "Heart Rate",
                style = MaterialTheme.typography.title3
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "${heartRateData.heartRate.toInt()} BPM",
                style = MaterialTheme.typography.body2,
                color = if (heartRateData.isLow) Color.Red else MaterialTheme.colors.onSurface,
                textAlign = TextAlign.Center
            )
        }
    }
}

@Composable
fun MotionDisplay(motionData: MotionData) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(8.dp),
        onClick = { }
    ) {
        Column(
            modifier = Modifier
                .padding(8.dp)
                .fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "Motion",
                style = MaterialTheme.typography.title3
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = if (motionData.isFallDetected) "FALL DETECTED!" else "Normal",
                style = MaterialTheme.typography.body2,
                color = if (motionData.isFallDetected) Color.Red else MaterialTheme.colors.onSurface,
                textAlign = TextAlign.Center
            )
        }
    }
}

@Composable
fun SosStatusDisplay(sosStatus: SosStatus) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(8.dp),
        onClick = { }
    ) {
        Column(
            modifier = Modifier
                .padding(8.dp)
                .fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "SOS ACTIVE",
                style = MaterialTheme.typography.title3,
                color = Color.Red
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "Reason: ${sosStatus.triggerReason ?: "Unknown"}",
                style = MaterialTheme.typography.body2,
                textAlign = TextAlign.Center
            )
            Text(
                text = "Triggered: ${formatTime(sosStatus.lastTriggered ?: 0)}",
                style = MaterialTheme.typography.caption2,
                textAlign = TextAlign.Center
            )
        }
    }
}

@Composable
fun SosButton(
    isActive: Boolean,
    onSosTrigger: () -> Unit,
    onSosCancel: () -> Unit
) {
    Button(
        onClick = { if (isActive) onSosCancel() else onSosTrigger() },
        colors = ButtonDefaults.buttonColors(
            backgroundColor = if (isActive) MaterialTheme.colors.error else MaterialTheme.colors.primary
        ),
        modifier = Modifier
            .size(48.dp)
            .padding(8.dp)
    ) {
        Text(
            text = if (isActive) "SOS" else "SOS",
            style = MaterialTheme.typography.button
        )
    }
}

private fun Double.format(digits: Int) = "%.${digits}f".format(this)
private fun Float.format(digits: Int) = "%.${digits}f".format(this)
private fun formatTime(timestamp: Long): String {
    val seconds = (System.currentTimeMillis() - timestamp) / 1000
    return when {
        seconds < 60 -> "$seconds seconds ago"
        seconds < 3600 -> "${seconds / 60} minutes ago"
        else -> "${seconds / 3600} hours ago"
    }
} 