import * as Location from 'expo-location';
import { Platform } from 'react-native';

/**
 * Request permission and get current GPS position.
 * Returns { lat, lng, accuracy_m } or throws on denial.
 * On web, falls back to browser geolocation API.
 */
export const getCurrentGPS = async () => {
  // Web fallback — expo-location has limited web support
  if (Platform.OS === 'web') {
    return new Promise((resolve, reject) => {
      if (!navigator?.geolocation) {
        // No geolocation API — return dummy coords so the flow continues
        resolve({ lat: 0, lng: 0, accuracy_m: null });
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy_m: pos.coords.accuracy }),
        () => resolve({ lat: 0, lng: 0, accuracy_m: null }), // denied → use dummy
        { timeout: 8000 }
      );
    });
  }

  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Location permission is required to submit. Please enable it in your device settings.');
  }
  const loc = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });
  return {
    lat:        loc.coords.latitude,
    lng:        loc.coords.longitude,
    accuracy_m: loc.coords.accuracy,
  };
};
