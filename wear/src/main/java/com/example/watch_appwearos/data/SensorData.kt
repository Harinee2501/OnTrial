package com.example.watch_appwearos.data

data class HeartRateData(
    val heartRate: Float = 0f,
    val timestamp: Long = System.currentTimeMillis(),
    val isLow: Boolean = false
)

data class MotionData(
    val accelerationX: Float = 0f,
    val accelerationY: Float = 0f,
    val accelerationZ: Float = 0f,
    val timestamp: Long = System.currentTimeMillis(),
    val isFallDetected: Boolean = false
)

data class SpO2Data(
    val spO2Level: Float = 0f,
    val timestamp: Long = System.currentTimeMillis(),
    val isLow: Boolean = false
) 