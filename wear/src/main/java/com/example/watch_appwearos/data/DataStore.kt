package com.example.watch_appwearos.data

import android.content.Context
import android.content.SharedPreferences
import androidx.core.content.edit

class DataStore(context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    fun saveTrackingData(timestamp: Long, latitude: Double, longitude: Double) {
        val key = "tracking_${timestamp}"
        prefs.edit {
            putString(key, "$latitude,$longitude")
        }
    }

    fun getTrackingData(): List<TrackingData> {
        return prefs.all.mapNotNull { (key, value) ->
            if (key.startsWith("tracking_")) {
                val timestamp = key.removePrefix("tracking_").toLongOrNull() ?: return@mapNotNull null
                val (lat, lon) = (value as String).split(",").map { it.toDoubleOrNull() ?: return@mapNotNull null }
                TrackingData(timestamp, lat, lon)
            } else null
        }.sortedBy { it.timestamp }
    }

    fun clearTrackingData() {
        prefs.edit {
            clear()
        }
    }

    companion object {
        private const val PREFS_NAME = "tracking_prefs"
    }
}

data class TrackingData(
    val timestamp: Long,
    val latitude: Double,
    val longitude: Double
) 