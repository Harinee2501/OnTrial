package com.example.watch_appwearos.services

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.net.Uri
import android.os.VibrationEffect
import android.os.VibratorManager
import androidx.core.content.ContextCompat
import com.example.watch_appwearos.data.HeartRateData
import com.example.watch_appwearos.data.LocationData
import com.google.android.gms.wearable.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await

class WearableCommunicationService(private val context: Context) {
    private val dataClient = Wearable.getDataClient(context)
    private val messageClient = Wearable.getMessageClient(context)
    private val nodeClient = Wearable.getNodeClient(context)
    private val scope = CoroutineScope(Dispatchers.IO)
    
    private val EMERGENCY_PATH = "/emergency"
    private val LOCATION_PATH = "/location"
    private val HEART_RATE_PATH = "/heart_rate"
    
    suspend fun sendEmergencyAlert(
        reason: String,
        location: LocationData,
        heartRate: HeartRateData
    ) {
        try {
            // Get connected nodes
            val nodes = nodeClient.connectedNodes.await()
            
            // Send emergency data to all connected nodes
            nodes.forEach { node ->
                val putDataMapRequest = PutDataMapRequest.create(EMERGENCY_PATH)
                putDataMapRequest.dataMap.apply {
                    putString("reason", reason)
                    putDouble("latitude", location.latitude)
                    putDouble("longitude", location.longitude)
                    putFloat("heart_rate", heartRate.heartRate)
                    putLong("timestamp", System.currentTimeMillis())
                }
                
                val request = putDataMapRequest.asPutDataRequest().setUrgent()
                dataClient.putDataItem(request).await()
                
                // Also send a message to ensure immediate delivery
                messageClient.sendMessage(
                    node.id,
                    EMERGENCY_PATH,
                    "EMERGENCY: $reason".toByteArray()
                ).await()
            }
            
            // Trigger local emergency alert
            triggerLocalEmergencyAlert()
        } catch (e: Exception) {
            // Handle communication error
        }
    }
    
    private fun triggerLocalEmergencyAlert() {
        if (hasVibratePermission()) {
            // Vibrate
            val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
            val vibrator = vibratorManager.defaultVibrator
            val vibrationPattern = longArrayOf(0, 1000, 1000, 1000) // Vibrate for 1 second, pause for 1 second
            vibrator.vibrate(VibrationEffect.createWaveform(vibrationPattern, 0))
            
            // Play emergency sound
            val notification = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
            val ringtone = RingtoneManager.getRingtone(context, notification)
            ringtone.play()
            
            // Stop after 30 seconds
            scope.launch {
                kotlinx.coroutines.delay(30000)
                ringtone.stop()
                vibrator.cancel()
            }
        }
    }
    
    suspend fun sendLocationUpdate(location: LocationData) {
        try {
            val putDataMapRequest = PutDataMapRequest.create(LOCATION_PATH)
            putDataMapRequest.dataMap.apply {
                putDouble("latitude", location.latitude)
                putDouble("longitude", location.longitude)
                putFloat("accuracy", location.accuracy)
                putLong("timestamp", location.timestamp)
            }
            
            val request = putDataMapRequest.asPutDataRequest().setUrgent()
            dataClient.putDataItem(request).await()
        } catch (e: Exception) {
            // Handle communication error
        }
    }
    
    suspend fun sendHeartRateUpdate(heartRate: HeartRateData) {
        try {
            val putDataMapRequest = PutDataMapRequest.create(HEART_RATE_PATH)
            putDataMapRequest.dataMap.apply {
                putFloat("heart_rate", heartRate.heartRate)
                putBoolean("is_low", heartRate.isLow)
                putLong("timestamp", heartRate.timestamp)
            }
            
            val request = putDataMapRequest.asPutDataRequest().setUrgent()
            dataClient.putDataItem(request).await()
        } catch (e: Exception) {
            // Handle communication error
        }
    }
    
    private fun hasVibratePermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.VIBRATE
        ) == PackageManager.PERMISSION_GRANTED
    }
} 