package com.example.watch_appwearos.services

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.RingtoneManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.example.watch_appwearos.MainActivity
import com.example.watch_appwearos.R
import com.google.android.gms.wearable.*

class WearableListenerService : com.google.android.gms.wearable.WearableListenerService() {
    
    override fun onDataChanged(dataEvents: DataEventBuffer) {
        super.onDataChanged(dataEvents)
        
        dataEvents.forEach { event ->
            if (event.type == DataEvent.TYPE_CHANGED) {
                val dataItem = event.dataItem
                when (dataItem.uri.path) {
                    "/emergency" -> {
                        val dataMap = DataMapItem.fromDataItem(dataItem).dataMap
                        handleEmergencyAlert(dataMap)
                    }
                    "/location" -> {
                        val dataMap = DataMapItem.fromDataItem(dataItem).dataMap
                        handleLocationUpdate(dataMap)
                    }
                    "/heart_rate" -> {
                        val dataMap = DataMapItem.fromDataItem(dataItem).dataMap
                        handleHeartRateUpdate(dataMap)
                    }
                }
            }
        }
    }
    
    private fun handleEmergencyAlert(dataMap: DataMap) {
        val reason = dataMap.getString("reason", "Unknown reason")
        val latitude = dataMap.getDouble("latitude")
        val longitude = dataMap.getDouble("longitude")
        val heartRate = dataMap.getFloat("heart_rate")
        val timestamp = dataMap.getLong("timestamp")
        
        // Create notification
        createEmergencyNotification(
            reason = reason,
            latitude = latitude,
            longitude = longitude,
            heartRate = heartRate
        )
        
        // TODO: Send SMS to emergency contacts
        // TODO: Make emergency call
    }
    
    private fun handleLocationUpdate(dataMap: DataMap) {
        val latitude = dataMap.getDouble("latitude")
        val longitude = dataMap.getDouble("longitude")
        val accuracy = dataMap.getFloat("accuracy")
        val timestamp = dataMap.getLong("timestamp")
        
        // TODO: Update UI with new location
        // TODO: Store location history
    }
    
    private fun handleHeartRateUpdate(dataMap: DataMap) {
        val heartRate = dataMap.getFloat("heart_rate")
        val isLow = dataMap.getBoolean("is_low")
        val timestamp = dataMap.getLong("timestamp")
        
        // TODO: Update UI with new heart rate
        // TODO: Store heart rate history
    }
    
    private fun createEmergencyNotification(
        reason: String,
        latitude: Double,
        longitude: Double,
        heartRate: Float
    ) {
        // Create notification channel for Android O and above
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                "emergency_channel",
                "Emergency Alerts",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Emergency alerts from OnTrail Safety"
                enableVibration(true)
                enableLights(true)
            }
            
            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
        
        // Create intent for notification tap
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            intent,
            PendingIntent.FLAG_IMMUTABLE
        )
        
        // Create notification
        val notification = NotificationCompat.Builder(this, "emergency_channel")
            .setSmallIcon(R.drawable.ic_launcher_foreground)
            .setContentTitle("EMERGENCY ALERT")
            .setContentText(reason)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM))
            .setVibrate(longArrayOf(0, 1000, 1000, 1000))
            .setAutoCancel(false)
            .setOngoing(true)
            .setContentIntent(pendingIntent)
            .addAction(
                R.drawable.ic_launcher_foreground,
                "View Location",
                createLocationIntent(latitude, longitude)
            )
            .build()
        
        // Show notification
        NotificationManagerCompat.from(this).notify(1, notification)
    }
    
    private fun createLocationIntent(latitude: Double, longitude: Double): PendingIntent {
        val intent = Intent(Intent.ACTION_VIEW).apply {
            data = android.net.Uri.parse("geo:$latitude,$longitude?q=$latitude,$longitude")
        }
        return PendingIntent.getActivity(
            this,
            1,
            intent,
            PendingIntent.FLAG_IMMUTABLE
        )
    }
} 