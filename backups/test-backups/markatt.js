/**
 * MarkAttendanceScreen.js
 * ─────────────────────────────────────────────────────────
 * Enterprise-grade geo-based attendance screen.
 *
 * Features:
 *  • GEO CHECK-IN / GEO CHECK-OUT with prominent branding
 *  • Today's attendance details (inTime, outTime, hours)
 *  • Live countdown timer during active shift
 *  • Location coordinates and accuracy display
 *  • Animated pulsing live dot
 *  • Clean swipe button interaction
 * ─────────────────────────────────────────────────────────
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import theme from '../../../constants/theme';
import { useAuth } from '../../../context/AuthContext';
import { useAttendance } from '../../../context/AttendanceContext';
import AttendanceActionButton from '../../../components/common/AttendanceActionButton';
import {
  getCurrentLocation,
  formatCoordinates,
  getAccuracyLabel,
} from '../../../utils/locationUtils';

// ── Constants ──
const getShiftLabel = () =>
  new Date().getDay() === 6 ? '7-Hour Shift (Saturday)' : '8h 30m Shift';

const MarkAttendanceScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const {
    attendanceStatus,
    checkInTime,
    checkOutTime,
    remainingSeconds,
    elapsedSeconds,
    loading,
    markCheckIn,
  } = useAttendance();

  const [swipeLoading, setSwipeLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [swipeKey, setSwipeKey] = useState(0); // Kept for SwipeButton compatibility if used elsewhere, but marked as unused here

  // Live geo coordinates for display
  const [geoCoords, setGeoCoords] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);

  // Pulsing live dot animation
  const liveDotScale = useSharedValue(1);
  const liveDotOpacity = useSharedValue(1);

  useEffect(() => {
    if (attendanceStatus === 'CHECKED_IN') {
      liveDotScale.value = withRepeat(
        withTiming(1.8, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
      liveDotOpacity.value = withRepeat(
        withTiming(0.3, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      liveDotScale.value = 1;
      liveDotOpacity.value = 1;
    }
  }, [attendanceStatus]);

  const liveDotAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: liveDotScale.value }],
    opacity: liveDotOpacity.value,
  }));

  // ── Fetch location on mount for display ──
  const fetchLocationForDisplay = useCallback(async () => {
    setGeoLoading(true);
    try {
      const loc = await getCurrentLocation();
      if (loc) setGeoCoords(loc);
    } catch {
      // Silently fail — location display is informational
    } finally {
      setGeoLoading(false);
    }
  }, []);

  useEffect(() => {
    if (attendanceStatus !== 'CHECKED_OUT') {
      fetchLocationForDisplay();
    }
  }, [attendanceStatus, fetchLocationForDisplay]);

  // ── UI Helpers ──
  const getCurrentDate = () =>
    new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  const formatTime = (date) => {
    if (!date) return '--:--';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatCountdown = (seconds) => {
    const s = Math.max(0, seconds);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, '0')}:${m
      .toString()
      .padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handleCheckIn = async () => {
    setSwipeLoading(true);
    await markCheckIn();
    setSwipeLoading(false);
  };

  const handleCheckOut = () => {
    // Navigate to Daily Report form — check-out happens after report submission
    navigation.navigate('DailyReportForm');
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (attendanceStatus !== 'CHECKED_OUT') {
      await fetchLocationForDisplay();
    }
    setRefreshing(false);
  };

  // ── Derived state ──
  const isCheckedIn = attendanceStatus === 'CHECKED_IN';
  const isCheckedOut = attendanceStatus === 'CHECKED_OUT';
  const isNotCheckedIn = attendanceStatus === 'NOT_CHECKED_IN';
  const isProcessing = loading || swipeLoading;

  // ── Render ──
  return (
    <View style={styles.container}>
      {/* Gradient Background Header */}
      <LinearGradient
        colors={theme.colors.gradientHeader}
        style={[styles.headerBg, { height: insets.top + 80 }]}
      />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.title}>Attendance</Text>
            <Text style={styles.subtitle}>{user?.name || user?.employeeName}</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* ═══════════════════════════════════════════════
            GEO LOCATION CARD
        ═══════════════════════════════════════════════ */}
        <View style={styles.geoCard}>
          <View style={styles.geoHeader}>
            <View style={styles.geoIconContainer}>
              <Ionicons name="navigate" size={20} color="#FFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.geoTitle}>Geo-Location Based Attendance</Text>
              <Text style={styles.geoSubtitle}>{getCurrentDate()}</Text>
            </View>
            {isCheckedIn && (
              <View style={styles.liveBadge}>
                <Animated.View style={[styles.liveDotOuter, liveDotAnimStyle]} />
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            )}
            {isCheckedOut && (
              <View style={styles.completedBadge}>
                <Ionicons name="checkmark-circle" size={14} color={theme.colors.success} />
                <Text style={styles.completedBadgeText}>DONE</Text>
              </View>
            )}
          </View>

          {/* Location Info */}
          {!isCheckedOut && (
            <View style={styles.locationInfo}>
              <View style={styles.locationRow}>
                <Ionicons name="location" size={14} color={theme.colors.primary} />
                <Text style={styles.locationText}>
                  {geoLoading
                    ? 'Fetching location...'
                    : geoCoords
                      ? formatCoordinates(geoCoords.latitude, geoCoords.longitude)
                      : 'Location unavailable'}
                </Text>
              </View>
              {geoCoords && (
                <View style={styles.locationRow}>
                  <Ionicons name="radio" size={14} color={theme.colors.secondary} />
                  <Text style={styles.locationText}>
                    Accuracy: {getAccuracyLabel(geoCoords.accuracy)}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* ═══════════════════════════════════════════════
            TODAY'S STATUS CARD
        ═══════════════════════════════════════════════ */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <LinearGradient
              colors={['#FDE68A', '#F59E0B']}
              style={styles.cardIconContainer}
            >
              <Ionicons name="time" size={24} color="#FFF" />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Today&apos;s Status</Text>
              <Text style={styles.cardSubtitle}>
                {isCheckedOut
                  ? 'Shift completed'
                  : isCheckedIn
                    ? 'Currently working'
                    : 'Not checked in yet'}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Time Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: '#DEF7EC' }]}>
                <Ionicons name="log-in" size={18} color={theme.colors.success} />
              </View>
              <View>
                <Text style={styles.statLabel}>In Time</Text>
                <Text style={styles.statValue}>
                  {formatTime(checkInTime)}
                </Text>
              </View>
            </View>

            <View style={styles.verticalDivider} />

            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: '#FDE8E8' }]}>
                <Ionicons name="log-out" size={18} color={theme.colors.error} />
              </View>
              <View>
                <Text style={styles.statLabel}>Out Time</Text>
                <Text style={styles.statValue}>
                  {formatTime(checkOutTime)}
                </Text>
              </View>
            </View>
          </View>

          {/* Elapsed Hours (shown when checked out) */}
          {isCheckedOut && checkInTime && checkOutTime && (
            <View style={styles.workingHoursContainer}>
              <View style={styles.workingHoursRow}>
                <Ionicons name="hourglass" size={16} color={theme.colors.accent} />
                <Text style={styles.workingHoursLabel}>Total Worked</Text>
              </View>
              <Text style={styles.workingHoursValue}>
                {formatCountdown(
                  Math.floor((checkOutTime.getTime() - checkInTime.getTime()) / 1000)
                )}
              </Text>
            </View>
          )}

          {/* Timer Section */}
          {isCheckedIn && (
            <View style={styles.timerWrapper}>
              <Text style={styles.timerLabel}>
                {remainingSeconds > 0 ? 'Shift Remaining' : 'Overtime'}
              </Text>
              <View style={styles.timerContainer}>
                <Text style={styles.timerValue}>
                  {remainingSeconds > 0
                    ? formatCountdown(remainingSeconds)
                    : formatCountdown(elapsedSeconds)}
                </Text>
                <Text style={styles.timerSubtext}>
                  {remainingSeconds > 0 ? 'remaining' : 'worked'}
                </Text>
              </View>
              <Text style={styles.shiftLabel}>
                {remainingSeconds > 0
                  ? getShiftLabel()
                  : `Elapsed: ${formatCountdown(elapsedSeconds)}`}
              </Text>
            </View>
          )}

          {/* ═══════════════════════════════════════════
              ACTION BUTTONS (STRICT RULES)
              ─────────────────────────────────────────
              NOT_CHECKED_IN → Check-In visible
              CHECKED_IN     → Check-Out visible
              CHECKED_OUT    → Both disabled
          ═══════════════════════════════════════════ */}
          <View style={styles.actionContainer}>
            {/* GEO CHECK-IN */}
            {isNotCheckedIn && (
              <View>
                <View style={styles.geoActionHeader}>
                  <LinearGradient
                    colors={[theme.colors.success, '#059669']}
                    style={styles.geoActionBadge}
                  >
                    <Ionicons name="navigate" size={12} color="#FFF" />
                    <Text style={styles.geoActionBadgeText}>GEO CHECK-IN</Text>
                  </LinearGradient>
                </View>
                <AttendanceActionButton
                  label="SECURE CHECK IN"
                  onPress={handleCheckIn}
                  loading={isProcessing}
                  gradientColors={[theme.colors.success, '#059669']}
                  iconName="finger-print"
                />
              </View>
            )}

            {/* GEO CHECK-OUT */}
            {isCheckedIn && (
              <View>
                <View style={styles.geoActionHeader}>
                  <LinearGradient
                    colors={[theme.colors.error, '#DC2626']}
                    style={styles.geoActionBadge}
                  >
                    <Ionicons name="navigate" size={12} color="#FFF" />
                    <Text style={styles.geoActionBadgeText}>GEO CHECK-OUT</Text>
                  </LinearGradient>
                </View>
                <AttendanceActionButton
                  label="SECURE CHECK OUT"
                  onPress={handleCheckOut}
                  loading={isProcessing}
                  gradientColors={[theme.colors.error, '#DC2626']}
                  iconName="log-out"
                />
              </View>
            )}

            {/* COMPLETED STATE */}
            {isCheckedOut && (
              <View style={styles.completedContainer}>
                <View style={styles.completedIconWrapper}>
                  <LinearGradient
                    colors={[theme.colors.success, '#059669']}
                    style={styles.completedIconGradient}
                  >
                    <Ionicons name="checkmark-circle" size={40} color="#FFF" />
                  </LinearGradient>
                </View>
                <Text style={styles.completedText}>
                  Attendance Completed for Today!
                </Text>
                <Text style={styles.completedSubtext}>
                  You&apos;ve completed your shift. Have a great rest of your day.
                </Text>
                <TouchableOpacity
                  style={styles.viewSummaryBtn}
                  onPress={() => navigation.navigate('DailySummary')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="document-text" size={18} color={theme.colors.primary} />
                  <Text style={styles.viewSummaryText}>View Today&apos;s Summary</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* View History Button */}
        <TouchableOpacity
          style={styles.summaryButton}
          onPress={() => navigation.navigate('AttendanceSummaryy')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#FFFFFF', '#F8FAFC']}
            style={styles.summaryGradient}
          >
            <View style={styles.summaryIcon}>
              <Ionicons name="calendar" size={22} color={theme.colors.primary} />
            </View>
            <View style={styles.summaryTextContainer}>
              <Text style={styles.summaryTitle}>View Attendance History</Text>
              <Text style={styles.summarySubtitle}>
                Check past records & request corrections
              </Text>
            </View>
            <Ionicons
              name="arrow-forward-circle"
              size={28}
              color={theme.colors.primary}
            />
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

// ─────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },

  // Header
  headerBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  content: { padding: 20 },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 20, fontWeight: '700', color: '#FFF', textAlign: 'center' },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },

  // Geo Location Card
  geoCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.light,
  },
  geoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  geoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  geoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
  },
  geoSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  locationInfo: {
    marginTop: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },

  // Live / Completed Badges
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DEF7EC',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
    position: 'relative',
  },
  liveDotOuter: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.success,
    position: 'absolute',
    left: 10,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.success,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.success,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  completedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.success,
  },

  // Main Card
  card: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text },
  cardSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },

  divider: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 20 },

  // Stats Grid
  statsGrid: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  statValue: { fontSize: 16, fontWeight: '700', color: theme.colors.text },
  verticalDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 16,
  },

  // Working Hours
  workingHoursContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  workingHoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  workingHoursLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.accent,
  },
  workingHoursValue: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
  },

  // Timer
  timerWrapper: {
    alignItems: 'center',
    marginVertical: 24,
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  timerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
  },
  timerValue: {
    fontSize: 42,
    fontWeight: '800',
    color: theme.colors.text,
    fontVariant: ['tabular-nums'],
  },
  timerSubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: 4,
    fontWeight: '500',
  },
  shiftLabel: {
    fontSize: 12,
    color: theme.colors.textTertiary,
    marginTop: 4,
  },

  // Action Container
  actionContainer: { marginTop: 8 },
  geoActionHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  geoActionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  geoActionBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 1,
  },

  // Completed State
  completedContainer: { alignItems: 'center', padding: 20 },
  completedIconWrapper: {
    marginBottom: 16,
    borderRadius: 40,
    overflow: 'hidden',
  },
  completedIconGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedText: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
  },
  completedSubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
  },
  viewSummaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
  },
  viewSummaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },

  // Summary Button
  summaryButton: {
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
    backgroundColor: '#FFF',
  },
  summaryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  summaryTextContainer: { flex: 1 },
  summaryTitle: { fontSize: 16, fontWeight: '600', color: theme.colors.text },
  summarySubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
});

export default MarkAttendanceScreen;
