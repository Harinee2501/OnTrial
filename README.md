# OnTrail - WearOS Safety App for Hikers

OnTrail is a safety-focused WearOS application designed for hikers and outdoor enthusiasts. It provides real-time monitoring of vital signs and location, with automatic SOS triggering in emergency situations.

## Features

- **Real-time GPS Location Tracking**: Displays current coordinates and accuracy
- **Heart Rate Monitoring**: Tracks heart rate and triggers SOS if it drops too low
- **Fall Detection**: Uses accelerometer to detect potential falls
- **Manual SOS Button**: Allows users to manually trigger an SOS alert
- **Morse Code SOS Pattern**: Flashes the device's LED in a Morse code SOS pattern
- **Local Data Storage**: Stores all tracking data locally for later syncing
- **Offline Functionality**: Works without an internet connection

## Technical Details

- Built with Kotlin and Jetpack Compose for WearOS
- Uses Room database for local storage
- Implements sensor monitoring for heart rate and motion
- Efficient battery usage with optimized location updates

## Requirements

- WearOS device with GPS and heart rate sensor
- Android 11 (API level 30) or higher

## Getting Started

1. Clone the repository
2. Open the project in Android Studio
3. Build and run on a WearOS device or emulator

## License

This project is licensed under the Apache License 2.0 - see the LICENSE file for details. 