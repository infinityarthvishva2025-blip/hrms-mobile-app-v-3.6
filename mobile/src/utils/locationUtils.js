/**
 * locationUtils.js
 * ─────────────────────────────────────────────────────────
 * Reusable geo‑location utilities with caching, permission
 * handling, mock location detection, accuracy thresholds,
 * and error resilience.
 * ─────────────────────────────────────────────────────────
 */
import * as Location from 'expo-location';
import { Alert, Linking, Platform } from 'react-native';

// Cache the last known location to avoid unnecessary GPS wakes
let lastLocation = null;
let lastLocationTimestamp = 0;
const LOCATION_CACHE_MAX_AGE = 60 * 1000; // 1 minute

// GPS accuracy threshold for attendance operations (meters)
const ACCURACY_THRESHOLD_METERS = 100;

// ──────────────────────────────────────────────────────────
// Permission Handling
// ──────────────────────────────────────────────────────────

/**
 * Requests foreground location permission.
 * @returns {Promise<boolean>} true if granted, false otherwise
 */
export const requestLocationPermission = async () => {
  const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();

  if (status === 'granted') return true;

  if (!canAskAgain) {
    Alert.alert(
      'Location Blocked',
      'Please enable location in your device settings to use geo attendance.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: () => {
            if (Platform.OS === 'ios') Linking.openURL('app-settings:');
            else Linking.openSettings();
          },
        },
      ]
    );
  } else {
    Alert.alert(
      'Permission Required',
      'Location permission is needed for geo check‑in/out.'
    );
  }
  return false;
};

// ──────────────────────────────────────────────────────────
// Mock Location Detection
// ──────────────────────────────────────────────────────────

/**
 * Checks if the given location is mocked/spoofed.
 * On Android, the `mocked` flag is set to true if a mock provider is active.
 * On iOS, mock locations are not easily detectable, so we rely on accuracy heuristics.
 *
 * @param {object} locationResult - raw expo-location result
 * @returns {boolean} true if location appears to be mocked
 */
const isMockLocation = (locationResult) => {
  if (Platform.OS === 'android') {
    // expo-location exposes `mocked` on Android
    return locationResult?.mocked === true;
  }
  // iOS: no reliable flag — we use accuracy heuristics instead
  // (handled by accuracy threshold check below)
  return false;
};

// ──────────────────────────────────────────────────────────
// Location Fetching (with caching)
// ──────────────────────────────────────────────────────────

/**
 * Gets the current device location.
 * - Returns cached location if it exists and is fresh enough.
 * - Otherwise requests a new high‑accuracy fix.
 *
 * @param {Object} options - { useCache: boolean, maxAgeMs: number, timeoutMs: number }
 * @returns {Promise<{latitude: number, longitude: number, accuracy: number} | null>}
 */
export const getCurrentLocation = async (options = {}) => {
  const {
    useCache = true,
    maxAgeMs = LOCATION_CACHE_MAX_AGE,
    timeoutMs = 15000,
  } = options;

  // 1. Check cache
  if (useCache && lastLocation && Date.now() - lastLocationTimestamp < maxAgeMs) {
    return lastLocation;
  }

  // 2. Request permission
  const granted = await requestLocationPermission();
  if (!granted) return null;

  // 3. Verify location services are enabled
  const enabled = await Location.hasServicesEnabledAsync();
  if (!enabled) {
    Alert.alert('GPS Disabled', 'Please enable GPS to use geo attendance.');
    return null;
  }

  try {
    // 4. Get fresh location with balanced accuracy for better stability
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
      timeout: timeoutMs,
    }).catch(async (err) => {
      console.warn('getCurrentPositionAsync failed, trying getLastKnownPositionAsync', err);
      return await Location.getLastKnownPositionAsync({
        maxAge: 60000,
      });
    });

    if (!location) {
      throw new Error('Location could not be determined');
    }

    const result = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
      mocked: location.mocked || false,
    };

    // Update cache
    lastLocation = result;
    lastLocationTimestamp = Date.now();

    return result;
  } catch (error) {
    console.error('Location fetch error:', error);

    // If a high‑accuracy fix fails, fall back to last known location (if any)
    if (lastLocation) {
      Alert.alert(
        'Using approximate location',
        'Could not get precise GPS. Using last known location.'
      );
      return lastLocation;
    }

    Alert.alert('Location Error', 'Unable to determine your location.');
    return null;
  }
};

// ──────────────────────────────────────────────────────────
// Strict Location for Attendance (Mock + Accuracy checks)
// ──────────────────────────────────────────────────────────

/**
 * Gets location strictly for attendance operations.
 * Enforces:
 *  - No mock/spoofed locations
 *  - GPS accuracy within ACCURACY_THRESHOLD_METERS
 *
 * @returns {Promise<{latitude: number, longitude: number, accuracy: number} | null>}
 */
export const getLocationForAttendance = async () => {
  const location = await getCurrentLocation({ useCache: false, timeoutMs: 15000 });

  if (!location) return null;

  // Check for mock/spoofed location
  if (location.mocked) {
    Alert.alert(
      '⚠️ Mock Location Detected',
      'Your device appears to be using a fake/mock location. Geo attendance cannot be recorded with spoofed GPS data. Please disable any mock location apps and try again.',
      [{ text: 'OK' }]
    );
    return null;
  }

  // Check GPS accuracy threshold
  if (location.accuracy > ACCURACY_THRESHOLD_METERS) {
    Alert.alert(
      'Low GPS Accuracy',
      `Your current GPS accuracy is ±${Math.round(location.accuracy)}m, which is too low for attendance recording (requires ±${ACCURACY_THRESHOLD_METERS}m or better).\n\nTry moving to an open area or wait for better GPS signal.`,
      [{ text: 'OK' }]
    );
    return null;
  }

  return location;
};

/**
 * Clears the cached location (useful after check‑out or manual refresh).
 */
export const clearLocationCache = () => {
  lastLocation = null;
  lastLocationTimestamp = 0;
};

// ──────────────────────────────────────────────────────────
// Formatting Helpers
// ──────────────────────────────────────────────────────────
export const formatCoordinates = (latitude, longitude) => {
  if (latitude == null || longitude == null) return 'Fetching...';
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
};

export const getAccuracyLabel = (accuracyMeters) => {
  if (accuracyMeters == null) return 'Unknown';
  const rounded = Math.round(accuracyMeters);
  if (rounded <= 10) return `High (±${rounded}m)`;
  if (rounded <= 30) return `Medium (±${rounded}m)`;
  return `Low (±${rounded}m)`;
};