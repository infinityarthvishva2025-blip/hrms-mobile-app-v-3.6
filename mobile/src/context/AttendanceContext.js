/**
 * AttendanceContext.js
 * ─────────────────────────────────────────────────────────
 * Global attendance state — clean, modular, no syncWithServer.
 *
 * Architecture:
 *  • Optimistic UI updates for instant check-in/out feedback
 *  • AsyncStorage persistence survives app close & logout
 *  • New-day auto-reset on mount + foreground
 *  • Deduplication guards prevent double check-in/out
 *  • getMySummary only called on-demand (DailySummaryScreen)
 *
 * Check-out flow:
 *   Swipe → navigate to DailyReportForm → submit report →
 *   performCheckOut() → geo-checkout API → navigate to DailySummary.
 * ─────────────────────────────────────────────────────────
 */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Alert } from 'react-native';

import AttendanceService, {
  STORAGE_KEYS,
  getUserStorageKey,
} from '../services/AttendanceService';
import { useAuth } from './AuthContext';
import { getLocationForAttendance } from '../utils/locationUtils';
import { useTimer } from '../utils/useTimer';

const AttendanceContext = createContext(null);

// ── Constants ─────────────────────────────────────────────
const SHIFT_DURATION_MON_FRI_SECONDS = 8.5 * 3600;
const SHIFT_DURATION_SAT_SECONDS = 7 * 3600;

const getShiftDurationForDate = (date) =>
  date.getDay() === 6 ? SHIFT_DURATION_SAT_SECONDS : SHIFT_DURATION_MON_FRI_SECONDS;

const isoDateOnly = (d) => d.toISOString().slice(0, 10);
const todayDateString = () => new Date().toDateString();

// ── Provider ──────────────────────────────────────────────
export const AttendanceProvider = ({ children }) => {
  const { user } = useAuth();
  const userId = user?.employeeId;

  // Core state
  const [attendanceStatus, setAttendanceStatus] = useState('NOT_CHECKED_IN');
  const [checkInTime, setCheckInTime] = useState(null);
  const [shiftEndTime, setShiftEndTime] = useState(null);
  const [checkOutTime, setCheckOutTime] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [loading, setLoading] = useState(false);

  // Deduplication guards
  const checkInInProgressRef = useRef(false);
  const checkOutInProgressRef = useRef(false);

  // Timer hook
  const { stopTimer, elapsedSeconds } = useTimer(
    checkInTime,
    shiftEndTime,
    setRemainingSeconds,
    () => {
      console.log('[Attendance] Shift duration reached');
    }
  );

  // Per-user storage keys
  const keys = useMemo(() => {
    if (!userId) return null;
    return {
      checkIn: getUserStorageKey(STORAGE_KEYS.CHECK_IN_TIMESTAMP, userId),
      shiftEnd: getUserStorageKey(STORAGE_KEYS.SHIFT_END_TIMESTAMP, userId),
      duration: getUserStorageKey(STORAGE_KEYS.SHIFT_DURATION, userId),
      status: getUserStorageKey('attendanceStatus', userId),
      checkOut: getUserStorageKey('checkOutTimestamp', userId),
    };
  }, [userId]);

  // ── Persistence helpers ─────────────────────────────────
  const persistTimerData = useCallback(
    async (cInTime, sEndTime, duration) => {
      if (!keys) return;
      try {
        await AsyncStorage.multiSet([
          [keys.checkIn, String(cInTime.getTime())],
          [keys.shiftEnd, String(sEndTime.getTime())],
          [keys.duration, String(duration)],
          [keys.status, 'CHECKED_IN'],
        ]);
      } catch (e) {
        console.error('[Attendance] Persist failed', e);
      }
    },
    [keys]
  );

  const persistCheckOutData = useCallback(
    async (coTime) => {
      if (!keys) return;
      try {
        await AsyncStorage.multiSet([
          [keys.status, 'CHECKED_OUT'],
          [keys.checkOut, String(coTime.getTime())],
        ]);
        // Keep checkIn and shiftEnd keys so DailySummary can read them
      } catch (e) {
        console.error('[Attendance] Persist checkout failed', e);
      }
    },
    [keys]
  );

  const clearPersistedData = useCallback(async () => {
    if (!keys) return;
    try {
      await AsyncStorage.multiRemove([
        keys.checkIn,
        keys.shiftEnd,
        keys.duration,
        keys.status,
        keys.checkOut,
      ]);
    } catch (e) {
      console.error('[Attendance] Clear persisted failed', e);
    }
  }, [keys]);

  // ── New-Day Detection & Reset ───────────────────────────
  const checkAndResetForNewDay = useCallback(async () => {
    if (!keys) return;
    try {
      const [checkInRaw] = await AsyncStorage.multiGet([
        keys.checkIn,
      ]);
      const storedCheckIn = checkInRaw[1] ? new Date(parseInt(checkInRaw[1], 10)) : null;

      if (!storedCheckIn) return; // Nothing stored — nothing to reset

      const todayStr = todayDateString();
      const storedDateStr = storedCheckIn.toDateString();

      if (storedDateStr !== todayStr) {
        // New day detected — clear stale data
        console.log('[Attendance] New day detected — resetting state');
        await clearPersistedData();
        setAttendanceStatus('NOT_CHECKED_IN');
        setCheckInTime(null);
        setShiftEndTime(null);
        setCheckOutTime(null);
        setRemainingSeconds(0);
        stopTimer();
        return true; // Signal that reset occurred
      }
      return false;
    } catch (e) {
      console.error('[Attendance] Day check error', e);
      return false;
    }
  }, [keys, clearPersistedData, stopTimer]);

  // ── Bootstrap from AsyncStorage ─────────────────────────
  const bootstrapAsync = useCallback(async () => {
    if (!keys) return;
    try {
      // First check for new day
      const wasReset = await checkAndResetForNewDay();
      if (wasReset) return;

      const [checkInRaw, shiftEndRaw, statusRaw, checkOutRaw] = await AsyncStorage.multiGet([
        keys.checkIn,
        keys.shiftEnd,
        keys.status,
        keys.checkOut,
      ]);

      const checkIn = checkInRaw[1] ? new Date(parseInt(checkInRaw[1], 10)) : null;
      const shiftEnd = shiftEndRaw[1] ? new Date(parseInt(shiftEndRaw[1], 10)) : null;
      const storedStatus = statusRaw[1];
      const checkOut = checkOutRaw[1] ? new Date(parseInt(checkOutRaw[1], 10)) : null;

      if (storedStatus === 'CHECKED_OUT' && checkIn) {
        // Restore checked-out state
        setCheckInTime(checkIn);
        setShiftEndTime(null);
        setCheckOutTime(checkOut);
        setAttendanceStatus('CHECKED_OUT');
        setRemainingSeconds(0);
      } else if (checkIn && shiftEnd) {
        // Restore checked-in state with running timer
        setCheckInTime(checkIn);
        setShiftEndTime(shiftEnd);
        setAttendanceStatus('CHECKED_IN');
      } else {
        // No valid data — fresh state
        setAttendanceStatus('NOT_CHECKED_IN');
      }
    } catch (e) {
      console.error('[Attendance] Bootstrap error', e);
    }
  }, [keys, checkAndResetForNewDay]);

  // ── Actions ─────────────────────────────────────────────

  /** Geo Check-In: fetch GPS → call API → optimistic update */
  const markCheckIn = useCallback(async () => {
    // Deduplication guard
    if (checkInInProgressRef.current) {
      console.log('[Attendance] Check-in already in progress — skipped');
      return;
    }
    checkInInProgressRef.current = true;
    setLoading(true);

    try {
      // Small delay to let UI stabilize after button interaction
      await new Promise(resolve => setTimeout(resolve, 500));

      // Use strict location with mock detection + accuracy threshold
      const location = await getLocationForAttendance();
      if (!location) {
        return; // Location alerts already shown by getLocationForAttendance
      }

      // 1. API call FIRST (for robustness and backend-confirmed timing)
      try {
        await AttendanceService.geoCheckIn({
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
        });
        console.log('[Attendance] Geo check-in API success');

        // 2. State update ONLY after successful confirmation
        const now = new Date();
        const duration = getShiftDurationForDate(now);
        const localShiftEnd = new Date(now.getTime() + duration * 1000);

        setAttendanceStatus('CHECKED_IN');
        setCheckInTime(now);
        setShiftEndTime(localShiftEnd);
        setCheckOutTime(null);
        setRemainingSeconds(Math.max(0, Math.floor((localShiftEnd.getTime() - now.getTime()) / 1000)));

        // 3. Persist after confirmation
        await persistTimerData(now, localShiftEnd, duration);
        Alert.alert('✅ Checked In', 'Your geo check-in has been recorded.');
      } catch (apiError) {
        console.error('[Attendance] Geo check-in API failed', apiError);
        const msg = apiError?.response?.data?.message || apiError.message || 'Check-in failed';
        Alert.alert('Check-In Failed', msg);
      }
    } catch (e) {
      const msg = e?.response?.data?.message || e.message || 'Check-in failed';
      Alert.alert('Check-In Failed', msg);
    } finally {
      setLoading(false);
      checkInInProgressRef.current = false;
    }
  }, [persistTimerData, clearPersistedData, stopTimer]);

  /**
   * Perform Geo Check-Out (called AFTER daily report submission).
   * This does NOT navigate — it only calls the API and resets state.
   */
  const performCheckOut = useCallback(async () => {
    // Deduplication guard
    if (checkOutInProgressRef.current) {
      console.log('[Attendance] Check-out already in progress — skipped');
      return { success: false, message: 'Check-out already in progress' };
    }
    checkOutInProgressRef.current = true;
    setLoading(true);

    try {
      const location = await getLocationForAttendance();

      if (!location) {
        throw new Error('Unable to fetch location for check-out');
      }

      await AttendanceService.geoCheckOut({
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
      });

      const now = new Date();
      setAttendanceStatus('CHECKED_OUT');
      setCheckOutTime(now);
      setRemainingSeconds(0);
      setShiftEndTime(null);
      stopTimer();

      await persistCheckOutData(now);

      return { success: true };
    } catch (e) {
      const msg = e?.response?.data?.message || e.message || 'Check-out failed';
      throw new Error(msg);
    } finally {
      setLoading(false);
      checkOutInProgressRef.current = false;
    }
  }, [stopTimer, persistCheckOutData]);

  /**
   * Fetch today's daily summary on-demand.
   * Only used by DailySummaryScreen — not called automatically.
   */
  const fetchDailySummary = useCallback(async () => {
    try {
      const todayStr = isoDateOnly(new Date());
      const summary = await AttendanceService.getMySummary({
        fromDate: todayStr,
        toDate: todayStr,
      });

      const records = Array.isArray(summary?.records) ? summary.records : [];
      const todaysRecord = records.find(
        (r) => isoDateOnly(new Date(r.date)) === todayStr
      );

      return todaysRecord || null;
    } catch (e) {
      console.error('[Attendance] Fetch daily summary error', e);
      return null;
    }
  }, []);

  /**
   * Reset state for a new day (can be called manually or via day-change detection).
   */
  const resetForNewDay = useCallback(async () => {
    setAttendanceStatus('NOT_CHECKED_IN');
    setCheckInTime(null);
    setShiftEndTime(null);
    setCheckOutTime(null);
    setRemainingSeconds(0);
    stopTimer();
    await clearPersistedData();
  }, [stopTimer, clearPersistedData]);

  // ── Effects ─────────────────────────────────────────────

  // Bootstrap on mount (when userId is available)
  useEffect(() => {
    if (userId) {
      bootstrapAsync();
    } else {
      // User logged out – clear UI state but timer data persists in AsyncStorage
      setAttendanceStatus('NOT_CHECKED_IN');
      setCheckInTime(null);
      setShiftEndTime(null);
      setCheckOutTime(null);
      setRemainingSeconds(0);
      checkInInProgressRef.current = false;
      checkOutInProgressRef.current = false;
    }
  }, [userId, bootstrapAsync]);

  // Check for new day on app foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && userId) {
        checkAndResetForNewDay();
      }
    });
    return () => sub.remove();
  }, [userId, checkAndResetForNewDay]);

  // ── Provider Value ──────────────────────────────────────
  const value = useMemo(
    () => ({
      attendanceStatus,
      checkInTime,
      shiftEndTime,
      checkOutTime,
      remainingSeconds,
      elapsedSeconds,
      loading,
      markCheckIn,
      performCheckOut,
      fetchDailySummary,
      resetForNewDay,
      stopTimer,
    }),
    [
      attendanceStatus,
      checkInTime,
      shiftEndTime,
      checkOutTime,
      remainingSeconds,
      elapsedSeconds,
      loading,
      markCheckIn,
      performCheckOut,
      fetchDailySummary,
      resetForNewDay,
      stopTimer,
    ]
  );

  return (
    <AttendanceContext.Provider value={value}>
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendance = () => useContext(AttendanceContext);