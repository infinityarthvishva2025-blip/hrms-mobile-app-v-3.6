/**
 * AttendanceContext.js
 * ─────────────────────────────────────────────────────────
 * Global attendance state with:
 *  • Optimistic updates
 *  • AsyncStorage persistence
 *  • Automatic backend sync on mount & foreground
 *  • Built‑in timer (no external hook)
 *  • Deduplication guards
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

const AttendanceContext = createContext(null);




// ── Constants ─────────────────────────────────────────────
const SHIFT_DURATION_MON_FRI_SECONDS = 8.5 * 3600;      // 8h 30m
const SHIFT_DURATION_SAT_SECONDS     = 7 * 3600;        // 7h

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
  const syncInProgressRef = useRef(false);

  // Timer interval ref
  const timerIntervalRef = useRef(null);

  // Per‑user storage keys
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

  // ── Timer management ────────────────────────────────────
  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    if (!checkInTime || !shiftEndTime || attendanceStatus !== 'CHECKED_IN') {
      stopTimer();
      return;
    }

    // Initial update
    const updateRemaining = () => {
      const now = new Date();
      const diff = shiftEndTime.getTime() - now.getTime();
      setRemainingSeconds(Math.max(0, Math.floor(diff / 1000)));
    };
    updateRemaining();

    // Set interval
    stopTimer(); // ensure no duplicate
    timerIntervalRef.current = setInterval(updateRemaining, 1000);
  }, [checkInTime, shiftEndTime, attendanceStatus, stopTimer]);

  // Stop timer when status leaves CHECKED_IN
  useEffect(() => {
    if (attendanceStatus !== 'CHECKED_IN') {
      stopTimer();
    } else {
      startTimer();
    }
  }, [attendanceStatus, startTimer, stopTimer]);

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

  // ── New‑day detection & reset ───────────────────────────
  const checkAndResetForNewDay = useCallback(async () => {
    if (!keys) return false;
    try {
      const [checkInRaw] = await AsyncStorage.multiGet([keys.checkIn]);
      const storedCheckIn = checkInRaw[1] ? new Date(parseInt(checkInRaw[1], 10)) : null;

      if (!storedCheckIn) return false;

      const todayStr = todayDateString();
      const storedDateStr = storedCheckIn.toDateString();

      if (storedDateStr !== todayStr) {
        console.log('[Attendance] New day detected – resetting');
        await clearPersistedData();
        setAttendanceStatus('NOT_CHECKED_IN');
        setCheckInTime(null);
        setShiftEndTime(null);
        setCheckOutTime(null);
        setRemainingSeconds(0);
        stopTimer();
        return true;
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
        setCheckInTime(checkIn);
        setShiftEndTime(null);
        setCheckOutTime(checkOut);
        setAttendanceStatus('CHECKED_OUT');
        setRemainingSeconds(0);
      } else if (checkIn && shiftEnd) {
        setCheckInTime(checkIn);
        setShiftEndTime(shiftEnd);
        setAttendanceStatus('CHECKED_IN');
        // timer will start via effect
      } else {
        setAttendanceStatus('NOT_CHECKED_IN');
      }
    } catch (e) {
      console.error('[Attendance] Bootstrap error', e);
    }
  }, [keys, checkAndResetForNewDay]);

  // ── Backend sync (web/mobile cross‑platform) ────────────
  const syncWithBackend = useCallback(async () => {
    if (!userId || syncInProgressRef.current) return;
    syncInProgressRef.current = true;

    try {
      const data = await AttendanceService.getTodayAttendance();
      const record = data?.record;

      // No record → not checked in
      if (!record || !record.inTime) {
        if (attendanceStatus !== 'NOT_CHECKED_IN') {
          // Backend says not checked in, but local says otherwise → reset
          await clearPersistedData();
          setAttendanceStatus('NOT_CHECKED_IN');
          setCheckInTime(null);
          setShiftEndTime(null);
          setCheckOutTime(null);
          setRemainingSeconds(0);
          stopTimer();
        }
        return;
      }

      // Parse record date + time
      const recordDate = new Date(record.date); // e.g., 2026-02-23T00:00:00
      const [hours, minutes, seconds] = record.inTime.split(':').map(Number);
      const backendCheckIn = new Date(recordDate);
      backendCheckIn.setHours(hours, minutes, seconds, 0);

      let backendCheckOut = null;
      if (record.outTime) {
        const [outHours, outMinutes, outSeconds] = record.outTime.split(':').map(Number);
        backendCheckOut = new Date(recordDate);
        backendCheckOut.setHours(outHours, outMinutes, outSeconds, 0);
      }

      // CASE 1: Backend has outTime → checked out
      if (backendCheckOut) {
        if (attendanceStatus !== 'CHECKED_OUT' || !checkOutTime) {
          // Update to checked out
          setAttendanceStatus('CHECKED_OUT');
          setCheckInTime(backendCheckIn);
          setShiftEndTime(null);
          setCheckOutTime(backendCheckOut);
          setRemainingSeconds(0);
          stopTimer();
          await persistCheckOutData(backendCheckOut);
        }
        return;
      }

      // CASE 2: Backend has inTime only → checked in
      if (backendCheckIn) {
        // Compute shift end based on day of check‑in
        const duration = getShiftDurationForDate(backendCheckIn);
        const backendShiftEnd = new Date(backendCheckIn.getTime() + duration * 1000);

        if (attendanceStatus !== 'CHECKED_IN') {
          // Update to checked in
          setAttendanceStatus('CHECKED_IN');
          setCheckInTime(backendCheckIn);
          setShiftEndTime(backendShiftEnd);
          setCheckOutTime(null);
          // remaining will be set by timer
          await persistTimerData(backendCheckIn, backendShiftEnd, duration);
        } else {
          // Already checked in – but verify if times differ (e.g., daylight saving)
          // For simplicity, trust backend and update if mismatch
          if (checkInTime?.getTime() !== backendCheckIn.getTime()) {
            setCheckInTime(backendCheckIn);
            setShiftEndTime(backendShiftEnd);
            persistTimerData(backendCheckIn, backendShiftEnd, duration);
          }
        }
      }
    } catch (e) {
      console.error('[Attendance] Sync error', e);
    } finally {
      syncInProgressRef.current = false;
    }
  }, [userId, attendanceStatus, checkInTime, checkOutTime, clearPersistedData, persistTimerData, persistCheckOutData, stopTimer]);

  // ── Actions ─────────────────────────────────────────────

  /** Geo Check‑In: fetch GPS → call API → optimistic update */
  const markCheckIn = useCallback(async () => {
    if (checkInInProgressRef.current) {
      console.log('[Attendance] Check‑in already in progress – skipped');
      return;
    }
    checkInInProgressRef.current = true;
    setLoading(true);

    try {
      // Get location with accuracy check
      const location = await getLocationForAttendance();
      if (!location) return; // user already alerted

      // API call
      await AttendanceService.geoCheckIn({
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
      });

      // Success – update state
      const now = new Date();
      const duration = getShiftDurationForDate(now);
      const localShiftEnd = new Date(now.getTime() + duration * 1000);

      setAttendanceStatus('CHECKED_IN');
      setCheckInTime(now);
      setShiftEndTime(localShiftEnd);
      setCheckOutTime(null);
      // remaining will be set by timer start

      await persistTimerData(now, localShiftEnd, duration);
      Alert.alert('✅ Checked In', 'Your geo check‑in has been recorded.');
    } catch (error) {
      console.error('[Attendance] Check‑in API error', error);
      const msg = error?.response?.data?.message || error.message || 'Check‑in failed';
      Alert.alert('Check‑In Failed', msg);
    } finally {
      setLoading(false);
      checkInInProgressRef.current = false;
    }
  }, [persistTimerData]);

  /** Perform Geo Check‑Out (called after daily report submission) */
  const performCheckOut = useCallback(async () => {
    if (checkOutInProgressRef.current) {
      console.log('[Attendance] Check‑out already in progress – skipped');
      return { success: false, message: 'Check‑out already in progress' };
    }
    checkOutInProgressRef.current = true;
    setLoading(true);

    try {
      const location = await getLocationForAttendance();
      if (!location) throw new Error('Unable to fetch location for check‑out');

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
    } catch (error) {
      const msg = error?.response?.data?.message || error.message || 'Check‑out failed';
      throw new Error(msg);
    } finally {
      setLoading(false);
      checkOutInProgressRef.current = false;
    }
  }, [stopTimer, persistCheckOutData]);

  /** Fetch today's summary on‑demand (used by DailySummaryScreen) */
  const fetchDailySummary = useCallback(async () => {
    try {
      const todayStr = isoDateOnly(new Date());
      const summary = await AttendanceService.getMySummary({
        fromDate: todayStr,
        toDate: todayStr,
      });
      const records = Array.isArray(summary?.records) ? summary.records : [];
      return records.find((r) => isoDateOnly(new Date(r.date)) === todayStr) || null;
    } catch (e) {
      console.error('[Attendance] Fetch daily summary error', e);
      return null;
    }
  }, []);

  /** Reset state for a new day (manual trigger) */
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

  // Bootstrap on mount (when userId available)
  useEffect(() => {
    if (userId) {
      bootstrapAsync();
    } else {
      // User logged out – clear UI but keep storage
      setAttendanceStatus('NOT_CHECKED_IN');
      setCheckInTime(null);
      setShiftEndTime(null);
      setCheckOutTime(null);
      setRemainingSeconds(0);
      stopTimer();
      checkInInProgressRef.current = false;
      checkOutInProgressRef.current = false;
    }
  }, [userId, bootstrapAsync, stopTimer]);

  // Sync with backend after bootstrap and on app foreground
  useEffect(() => {
    if (!userId) return;

    // Initial sync after bootstrap
    const timer = setTimeout(() => {
      syncWithBackend();
    }, 500); // small delay to let bootstrap settle

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        syncWithBackend();
      }
    });

    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, [userId, syncWithBackend]);

  // ── Compute elapsed seconds for UI ──────────────────────
  const elapsedSeconds = useMemo(() => {
    if (attendanceStatus === 'CHECKED_OUT' && checkInTime && checkOutTime) {
      return Math.floor((checkOutTime.getTime() - checkInTime.getTime()) / 1000);
    }
    if (attendanceStatus === 'CHECKED_IN' && checkInTime) {
      return Math.floor((new Date().getTime() - checkInTime.getTime()) / 1000);
    }
    return 0;
  }, [attendanceStatus, checkInTime, checkOutTime]);

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