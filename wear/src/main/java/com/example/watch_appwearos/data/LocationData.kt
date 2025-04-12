package com.example.watch_appwearos.data

data class LocationData(
    val latitude: Double = 0.0,
    val longitude: Double = 0.0,
    val accuracy: Float = 0f,
    val timestamp: Long = System.currentTimeMillis()
)

data class SosStatus(
    val isActive: Boolean = false,
    val lastTriggered: Long? = null,
    val triggerReason: String? = null
) 