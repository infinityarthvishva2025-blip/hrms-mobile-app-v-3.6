/**
 * AttendanceSummaryScreen.js
 * ─────────────────────────────────────────────────────────
 * Premium attendance history screen with date filtering,
 * quick summary stats, and the existing table-based view.
 *
 * All existing functionality preserved:
 *  • Date range filter (DatePickerInput + GradientButton)
 *  • Pull-to-refresh
 *  • AttendanceTable with correction request handling
 *  • Loading / empty states
 *  • useFocusEffect auto-refresh
 * ─────────────────────────────────────────────────────────
 */
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AttendanceTable from '../../../components/common/AttendanceTable';
import DatePickerInput from '../../../components/common/DatePickerInput';
import GradientButton from '../../../components/common/GradientButton';
import theme from '../../../constants/theme';
import { useAuth } from '../../../context/AuthContext';
import AttendanceService from '../../../services/AttendanceService';

// ── Helpers ──
const formatDateToString = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const att = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();

    // state 

    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [attendanceData, setAttendanceData] = useState([]);

    // default 30 days back to today

    const [fromDate, setFromDate] = useState(formatDateToString(new Date(Date.now() - 30 * 8640000)));
    const [toDate, setToDate] = useState(formatDateToString(new Date()));

    // data fetching (unchanged logic) -->
    const fetchAttendanceSummary = useCallback((
        async (isRefresh = false) => {
            if (!refreshing) {
                setLoading(true);
            }
            try {
                if (!fromDate || !toDate) {
                    Alert.alert("Validation", 'Please select both from and to dates');
                    setLoading(false);
                    return;
                };
                if (new Date(fromDate) > new Date(toDate)) {
                    Alert.alert("Validation", "From date can not be after to date");
                    setLoading(false)
                    return;
                };
                const data = await AttendanceService.getMySummary({
                    fromDate: fromDate, toDate: toDate
                });
                if (data && data.records) {
                    setAttendanceData(data.records);
                } else {
                    setAttendanceData([]);
                }

            } catch (error) {
                console.error("Fetch sumamry error", error);
                Alert.alert(
                    'Error',
                    error.response?.data?.message || 'Failed to fetch attendance summary',
                );
                setAttendanceData([]);

            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        }, [fromDate, toDate]
    ));

    useFocusEffect(
        useCallback(() => {
            fetchAttendanceSummary();
        }, [fetchAttendanceSummary])
    );

    const onRefresh = ()=>{
        setRefreshing(true);
        fetchAttendanceSummary(true);
    }
    // corr ection handler (uncahnged)

    const handleCorrectionRequest = (record)=>{
        if (!record.token) {
            Alert.alert("Not Allowed" , "Correction request is not availabe for this record");
            return;
        };
        if (record.correctionStatus === 'Pending') {
            Alert.alert("Already Approved" , "A correctionrequest is already pending for this record");
            return;
        }
        if (record.correctionStatus == 'Approved') {
            Alert.alert("Already approved" , "COrrection has already been approved for this record");
            return;
        }
    }
}

const AttendanceSummaryScreen = ({ navigation }) => {

    // ── Correction Handler (unchanged) ──
    const handleCorrectionRequest = (record) => {
        if (!record.token) {
            Alert.alert('Not Allowed', 'Correction request is not available for this record');
            return;
        }
        if (record.correctionStatus === 'Pending') {
            Alert.alert('Already Requested', 'A correction request is already pending for this record');
            return;
        }
        if (record.correctionStatus === 'Approved') {
            Alert.alert('Already Approved', 'Correction has already been approved for this record');
            return;
        }
        if (record.status === 'A') {
            Alert.alert('cant send the request', 'you were absent');
            return;
        }
        if (record.status === 'WO') {
            Alert.alert('cant send the request', 'It was a weekly off');
            return;
        }
        if (record.status === 'WO') {
            Alert.alert('Already Approved', 'Correction has already been approved for this record');
            return;
        }
        navigation.navigate('Regularization', { attendanceRecord: record });
    };

    // ── Render ──
    return (
        <View style={styles.container}>
            {/* ═══════════════════════════════════════
                GRADIENT HEADER
            ═══════════════════════════════════════ */}
            <LinearGradient
                colors={theme.colors.gradientHeader}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.headerGradient, { paddingTop: insets.top + 12 }]}
            >
                {/* Top Bar */}
                <View style={styles.headerRow}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backBtn}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="arrow-back" size={22} color="#FFF" />
                    </TouchableOpacity>
                    <View style={styles.headerTextBlock}>
                        <Text style={styles.headerTitle}>Attendance History</Text>
                        <Text style={styles.headerSub}>
                            {user?.employeeName || 'Employee'} • {user?.employeeCode || ''}
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={onRefresh}
                        style={styles.refreshBtn}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="refresh" size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>

                {/* ── Quick Stats Bar ──
                <View style={styles.statsBar}>
                    <StatPill label="Total" value={stats.total} color="#FFF" />
                    <View style={styles.statDivider} />
                    <StatPill label="Present" value={stats.present} color="#6EE7B7" />
                    <View style={styles.statDivider} />
                    <StatPill label="Absent" value={stats.absent} color="#FCA5A5" />
                    <View style={styles.statDivider} />
                    <StatPill label="Late" value={stats.late} color="#FDE68A" />
                </View> */}
            </LinearGradient>

            {/* ═══════════════════════════════════════
                CONTENT
            ═══════════════════════════════════════ */}
            <View style={styles.contentWrapper}>
                {/* ── Date Filter Card (overlapping header) ── */}

                <View style={[styles.filterCard, theme.shadow.medium]}>
                    <View style={styles.filterHeader}>
                        <View style={styles.filterIconWrap}>
                            <Ionicons name="funnel" size={16} color={theme.colors.primary} />
                        </View>
                        <Text style={styles.filterTitle}>Date Range</Text>
                    </View>

                    <View style={styles.filterRow}>
                        <View style={styles.dateInputWrap}>
                            <DatePickerInput
                                label="From"
                                value={fromDate}
                                onChange={setFromDate}
                                maximumDate={new Date()}
                            />
                        </View>
                        <View style={styles.filterArrow}>
                            <Ionicons name="arrow-forward" size={14} color={theme.colors.textTertiary} />
                        </View>
                        <View style={styles.dateInputWrap}>
                            <DatePickerInput
                                label="To"
                                value={toDate}
                                onChange={setToDate}
                                maximumDate={new Date()}
                            />
                        </View>
                    </View>

                    {/* <GradientButton
                        title="Apply Filter"
                        onPress={() => fetchAttendanceSummary()}
                        icon={<Ionicons name="search" size={16} color="#FFF" />}
                        style={styles.filterBtn}
                    /> */}
                </View>

                {/* ── Scrollable Table Area ── */}
                <ScrollView
                    style={styles.scrollArea}
                    contentContainerStyle={styles.scrollContent}
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
                    {loading && !refreshing ? (
                        <View style={styles.loaderWrap}>
                            <View style={styles.loaderCircle}>
                                <ActivityIndicator size="large" color={theme.colors.primary} />
                            </View>
                            <Text style={styles.loaderText}>Syncing records…</Text>
                            <Text style={styles.loaderSub}>Fetching your attendance data</Text>
                        </View>
                    ) : attendanceData.length === 0 ? (
                        <View style={styles.emptyWrap}>
                            <View style={styles.emptyIconBg}>
                                <Ionicons name="calendar-clear" size={40} color={theme.colors.primary} />
                            </View>
                            <Text style={styles.emptyTitle}>No Records Found</Text>
                            <Text style={styles.emptySub}>
                                No attendance logs for the selected date range. Try adjusting the filter above.
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.tableWrap}>
                            {/* Record count badge */}
                            <View style={styles.recordCountRow}>
                                <Ionicons name="list" size={14} color={theme.colors.textSecondary} />
                                <Text style={styles.recordCountText}>
                                    {attendanceData.length} record{attendanceData.length !== 1 ? 's' : ''} found
                                </Text>
                            </View>

                            {/* Existing AttendanceTable — UNTOUCHED */}
                            <AttendanceTable
                                data={attendanceData}
                                onRequestCorrection={handleCorrectionRequest}
                            />
                        </View>
                    )}
                    <View style={{ height: 40 }} />
                </ScrollView>
            </View>
        </View>
    );
};

// ── Stat Pill Component ──
const StatPill = ({ label, value, color }) => (
    <View style={styles.statPill}>
        <Text style={[styles.statValue, { color }]}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
);

// ─────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },

    // ── Header ──
    headerGradient: {
        paddingHorizontal: 20,
        paddingBottom: 48,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTextBlock: {
        flex: 1,
        marginLeft: 16,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#FFF',
        letterSpacing: -0.5,
    },
    headerSub: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.85)',
        marginTop: 4,
        fontWeight: '600',
    },
    refreshBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // ── Stats Bar ──
    statsBar: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: 20,
        paddingVertical: 14,
        paddingHorizontal: 8,
        alignItems: 'center',
        justifyContent: 'space-around',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    statPill: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '900',
        fontVariant: ['tabular-nums'],
        letterSpacing: -0.5,
    },
    statLabel: {
        fontSize: 9,
        fontWeight: '800',
        color: 'rgba(255,255,255,0.7)',
        marginTop: 4,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
    },
    statDivider: {
        width: 1,
        height: 24,
        backgroundColor: 'rgba(255,255,255,0.15)',
    },

    // ── Content ──
    contentWrapper: {
        flex: 1,
        marginTop: -32,
        paddingHorizontal: 16,
    },

    // ── Filter Card ──
    filterCard: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 2,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 6,
    },
    filterHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 10,
    },
    filterIconWrap: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: '#EFF6FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    filterTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#1E293B',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    filterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 18,
    },
    dateInputWrap: {
        flex: 1,
    },
    filterArrow: {
        paddingHorizontal: 10,
        justifyContent: 'center',
    },
    filterBtn: {
        borderRadius: 16,
        height: 52,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },

    // ── Scroll / Table ──
    scrollArea: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    tableWrap: {
        flex: 1,
    },
    recordCountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
        paddingHorizontal: 6,
    },
    recordCountText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748B',
        letterSpacing: 0.3,
    },

    // ── Loading ──
    loaderWrap: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    loaderCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#EFF6FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    loaderText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
    },
    loaderSub: {
        fontSize: 13,
        color: '#64748B',
        marginTop: 6,
        fontWeight: '500',
    },

    // ── Empty State ──
    emptyWrap: {
        alignItems: 'center',
        padding: 40,
        backgroundColor: '#FFF',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
    },
    emptyIconBg: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 8,
    },
    emptySub: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        maxWidth: 280,
        lineHeight: 22,
        fontWeight: '500',
    },
});

export default AttendanceSummaryScreen;
