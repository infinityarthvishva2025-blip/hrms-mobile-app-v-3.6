/**
 * ApplyLeaveScreen.js
 * ─────────────────────────────────────────────────────────
 * Best-in-class Apply Leave form with intuitive UX.
 *
 * Preserved Logic:
 *  • Categories: Full Day, Half Day, Early Going, Late Coming
 *  • Date validation (Start <= End)
 *  • Time input (HH:MM regex) for partial days
 *  • Auto-set end date on start change
 *  • API submission via LeaveService
 *  • Loading states & Alert feedback
 * ─────────────────────────────────────────────────────────
 */
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Alert,
    Platform,
    KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import theme from '../../../constants/theme';
import LeaveService from '../../../services/employee/leaveService';
import { useAuth } from '../../../context/AuthContext';
import GradientButton from '../../../components/common/GradientButton';

const ApplyLeaveScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();

    // ── State ──
    const [loading, setLoading] = useState(false);
    const [category, setCategory] = useState(0); // 0=FullDay, 1=HalfDay, 2=EarlyGoing, 3=LateComing
    const [leaveType, setLeaveType] = useState('FullDay');
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [timeValue, setTimeValue] = useState('');
    const [reason, setReason] = useState('');

    // Date Pickers
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);

    // Categories Configuration
    const categories = [
        { id: 0, label: 'Full Day', value: 'FullDay', icon: 'sunny-outline' },
        { id: 1, label: 'Half Day', value: 'HalfDay', icon: 'partly-sunny-outline' },
        { id: 2, label: 'Early Going', value: 'EarlyGoing', icon: 'log-out-outline' },
        { id: 3, label: 'Late Coming', value: 'LateComing', icon: 'time-outline' },
    ];

    // ── Handlers ──
    const handleCategorySelect = (cat) => {
        setCategory(cat.id);
        setLeaveType(cat.value);
    };

    const handleStartDateChange = (event, selectedDate) => {
        setShowStartDatePicker(false);
        if (selectedDate) {
            setStartDate(selectedDate);
            // Auto-adjust end date if needed
            if (selectedDate > endDate) {
                setEndDate(selectedDate);
            }
        }
    };

    const handleEndDateChange = (event, selectedDate) => {
        setShowEndDatePicker(false);
        if (selectedDate) {
            setEndDate(selectedDate);
        }
    };

    const validateForm = () => {
        if (!reason.trim()) {
            Alert.alert('Missing Detail', 'Please enter a reason for your leave.');
            return false;
        }

        // Time validation for partial leaves
        if (category === 2 || category === 3) {
            if (!timeValue.trim()) {
                Alert.alert('Missing Time', `Please enter the time for ${leaveType.replace(/([A-Z])/g, ' $1').trim()}.`);
                return false;
            }
            const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
            if (!timeRegex.test(timeValue)) {
                Alert.alert('Invalid Time', 'Please enter time in HH:MM format (e.g., 14:30).');
                return false;
            }
        }

        if (endDate < startDate) {
            Alert.alert('Invalid Dates', 'End date cannot be before start date.');
            return false;
        }

        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setLoading(true);
        try {
            const leaveData = {
                category: category,
                leaveType: leaveType,
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
                timeValue: (category === 2 || category === 3) ? timeValue : null,
                reason: reason.trim(),
            };

            const response = await LeaveService.applyLeave(leaveData);

            Alert.alert(
                'Application Submitted',
                response.message || 'Your leave request has been sent for approval.',
                [
                    {
                        text: 'Done',
                        onPress: () => {
                            // Reset & Navigate
                            setCategory(0);
                            setLeaveType('FullDay');
                            setStartDate(new Date());
                            setEndDate(new Date());
                            setTimeValue('');
                            setReason('');
                            navigation.navigate('MyLeavesScreen');
                        },
                    },
                ]
            );
        } catch (error) {
            console.error('Apply leave error:', error);
            Alert.alert(
                'Submission Failed',
                error.response?.data?.message || 'Something went wrong. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    // Calculate duration for display
    const durationDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

    // ── Render ──
    return (
        <View style={styles.container}>
            {/* ══ Gradient Header ══ */}
            <LinearGradient
                colors={theme.colors.gradientHeader}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.headerGradient, { paddingTop: insets.top + 16 }]}
            >
                <View style={styles.headerRow}>
                    {/* <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backBtn}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity> */}
                    <View style={styles.headerTextContainer}>
                        <Text style={styles.headerTitle}>Apply Leave</Text>
                        <Text style={styles.headerSub}>Request time off</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.historyBtn}
                        onPress={() => navigation.navigate('LeaveBalance')}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="wallet-outline" size={22} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView
                    style={styles.scrollArea}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* 1. Leave Category */}
                    <Text style={styles.sectionTitle}>Select Leave Type</Text>
                    <View style={styles.categoryGrid}>
                        {categories.map((cat) => (
                            <TouchableOpacity
                                key={cat.id}
                                style={[
                                    styles.catCard,
                                    category === cat.id && styles.catCardActive,
                                ]}
                                onPress={() => handleCategorySelect(cat)}
                                activeOpacity={0.8}
                            >
                                <View
                                    style={[
                                        styles.catIcon,
                                        category === cat.id ? styles.catIconActive : styles.catIconInactive,
                                    ]}
                                >
                                    <Ionicons
                                        name={cat.icon}
                                        size={22}
                                        color={category === cat.id ? theme.colors.primary : theme.colors.textSecondary}
                                    />
                                </View>
                                <Text
                                    style={[
                                        styles.catLabel,
                                        category === cat.id && styles.catLabelActive,
                                    ]}
                                >
                                    {cat.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* 2. Duration / Date Section */}
                    <Text style={styles.sectionTitle}>Duration</Text>
                    <View style={styles.datesRow}>
                        {/* Start Date */}
                        <TouchableOpacity
                            style={styles.dateInput}
                            onPress={() => setShowStartDatePicker(true)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.inputLabel}>Start Date</Text>
                            <View style={styles.dateValueRow}>
                                <Ionicons name="calendar" size={18} color={theme.colors.primary} />
                                <Text style={styles.dateValueText}>
                                    {startDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </Text>
                            </View>
                        </TouchableOpacity>

                        <View style={styles.arrowContainer}>
                            <Ionicons name="arrow-forward" size={18} color={theme.colors.textTertiary} />
                        </View>

                        {/* End Date */}
                        <TouchableOpacity
                            style={styles.dateInput}
                            onPress={() => setShowEndDatePicker(true)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.inputLabel}>End Date</Text>
                            <View style={styles.dateValueRow}>
                                <Ionicons name="calendar-outline" size={18} color={theme.colors.textSecondary} />
                                <Text style={styles.dateValueText}>
                                    {endDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Date Pickers */}
                    {showStartDatePicker && (
                        <DateTimePicker
                            value={startDate}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={handleStartDateChange}
                            minimumDate={new Date()}
                        />
                    )}
                    {showEndDatePicker && (
                        <DateTimePicker
                            value={endDate}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={handleEndDateChange}
                            minimumDate={startDate}
                        />
                    )}

                    {/* 3. Conditional Time Input */}
                    {(category === 2 || category === 3) && (
                        <View style={styles.formGroup}>
                            <Text style={styles.sectionTitle}>
                                Time <Text style={styles.subLabel}>(HH:MM)</Text>
                            </Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="time-outline" size={20} color={theme.colors.textTertiary} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.textInput}
                                    value={timeValue}
                                    onChangeText={setTimeValue}
                                    placeholder="e.g. 14:30"
                                    placeholderTextColor={theme.colors.textQuarterly}
                                    keyboardType="numbers-and-punctuation"
                                />
                            </View>
                        </View>
                    )}

                    {/* 4. Reason Input */}
                    <View style={styles.formGroup}>
                        <Text style={styles.sectionTitle}>Reason</Text>
                        <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                            <TextInput
                                style={styles.textArea}
                                value={reason}
                                onChangeText={setReason}
                                placeholder="Please describe why you need leave..."
                                placeholderTextColor={theme.colors.textQuarterly}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />
                        </View>
                    </View>

                    {/* 5. Summary & Action */}
                    <View style={styles.summaryBox}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Total Request</Text>
                            <Text style={styles.summaryValue}>{durationDays} Day{durationDays !== 1 ? 's' : ''}</Text>
                        </View>
                        <View style={styles.divider} />
                        <Text style={styles.summaryNote}>Request will be sent to your manager for approval.</Text>

                        <GradientButton
                            title={loading ? "Submitting..." : "Submit Application"}
                            onPress={handleSubmit}
                            disabled={loading}
                            icon={!loading && <Ionicons name="paper-plane-outline" size={18} color="#FFF" />}
                            style={styles.submitBtn}
                        />
                    </View>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

// ─────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    // Header
    headerGradient: {
        paddingHorizontal: 20,
        paddingBottom: 24,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTextContainer: {
        flex: 1,
        marginLeft: 16,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFF',
    },
    headerSub: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.85)',
        marginTop: 2,
    },
    historyBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Employee Strip in header
    employeeStrip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        padding: 10,
        borderRadius: 16,
    },
    avatarMini: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    avatarText: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.primary,
    },
    empName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFF',
    },
    empId: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.8)',
    },

    // Content
    scrollArea: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.text,
        marginBottom: 12,
        marginLeft: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    subLabel: {
        fontSize: 11,
        color: theme.colors.textTertiary,
        textTransform: 'none',
    },

    // Category Grid
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    catCard: {
        width: '48%',
        backgroundColor: '#FFF',
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
        ...theme.shadow.light,
    },
    catCardActive: {
        backgroundColor: '#EFF6FF',
        borderColor: theme.colors.primary,
    },
    catIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginBottom: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    catIconInactive: {
        backgroundColor: '#F3F4F6',
    },
    catIconActive: {
        backgroundColor: '#FFF',
    },
    catLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.textSecondary,
    },
    catLabelActive: {
        color: theme.colors.primary,
        fontWeight: '700',
    },

    // Dates Row
    datesRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    dateInput: {
        flex: 1,
        backgroundColor: '#FFF',
        padding: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: theme.colors.border,
        ...theme.shadow.light,
    },
    inputLabel: {
        fontSize: 11,
        color: theme.colors.textTertiary,
        marginBottom: 6,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    dateValueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dateValueText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text,
    },
    arrowContainer: {
        paddingHorizontal: 10,
    },

    // Form Groups
    formGroup: {
        marginBottom: 20,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 14,
        paddingHorizontal: 16,
        height: 50,
    },
    textAreaWrapper: {
        height: 'auto',
        paddingVertical: 12,
        alignItems: 'flex-start',
    },
    inputIcon: {
        marginRight: 10,
    },
    textInput: {
        flex: 1,
        fontSize: 15,
        color: theme.colors.text,
    },
    textArea: {
        flex: 1,
        fontSize: 15,
        color: theme.colors.text,
        minHeight: 80,
    },

    // Summary Box
    summaryBox: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 20,
        marginTop: 10,
        borderWidth: 1,
        borderColor: theme.colors.border,
        ...theme.shadow.medium,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    summaryLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.textSecondary,
    },
    summaryValue: {
        fontSize: 18,
        fontWeight: '800',
        color: theme.colors.primary,
    },
    divider: {
        height: 1,
        backgroundColor: theme.colors.divider,
        marginBottom: 16,
    },
    summaryNote: {
        fontSize: 12,
        color: theme.colors.textTertiary,
        textAlign: 'center',
        marginBottom: 20,
        fontStyle: 'italic',
    },
    submitBtn: {
        borderRadius: 14,
    },
});

export default ApplyLeaveScreen;
