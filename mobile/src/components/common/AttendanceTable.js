import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../../constants/theme';
import StatusBadge from './StatusBadge';

const AttendanceTable = ({ data, onRequestCorrection, isHrView = false }) => {

    const formatDate = (dateString) => {
        if (!dateString) return '—';
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    };

    const formatTime = (timeString) => {
        if (!timeString) return '—';
        // If time is already in HH:MM format
        if (timeString.length === 5 && timeString.includes(':')) {
            return timeString;
        }
        // Try parsing as date-time
        const date = new Date(timeString);
        if (isNaN(date.getTime())) return timeString;
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    const formatWorkingHours = (hours) => {
        if (!hours) return '—';
        // If it's already formatted (like "8.5")
        if (typeof hours === 'number') {
            return `${hours.toFixed(1)}h`;
        }
        // If it's a string, return as-is
        return hours;
    };

    const renderTableHeader = () => (
        <View style={styles.tableHeader}>
            <Text style={[styles.columnHeader, { flex: 1.2 }]}>Date</Text>
            <Text style={[styles.columnHeader, { flex: 0.9 }]}>In</Text>
            <Text style={[styles.columnHeader, { flex: 0.9 }]}>Out</Text>
            <Text style={[styles.columnHeader, { flex: 0.8 }]}>Hours</Text>
            <Text style={[styles.columnHeader, { flex: 1 }]}>Status</Text>
            <Text style={[styles.columnHeader, { flex: 1, textAlign: 'center' }]}>
                {isHrView ? 'Correction' : 'Action'}
            </Text>
        </View>
    );

    const renderCorrectionColumn = (item) => {
        // If correction is pending
        if (item.correctionStatus === 'Pending') {
            return (
                <View style={styles.correctionBadge}>
                    <Ionicons name="time-outline" size={14} color={theme.colors.warning} />
                    <Text style={styles.pendingText}>Pending</Text>
                </View>
            );
        }

        // If correction is approved
        if (item.correctionStatus === 'Approved') {
            return (
                <View style={styles.correctionBadge}>
                    <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
                    <Text style={styles.approvedText}>Approved</Text>
                </View>
            );
        }

        // If correction is rejected
        if (item.correctionStatus === 'Rejected') {
            return (
                <View style={styles.correctionBadge}>
                    <Ionicons name="close-circle" size={16} color={theme.colors.error} />
                    <Text style={styles.rejectedText}>Rejected</Text>
                </View>
            );
        }

        // For HR view without correction
        if (isHrView) {
            return <Text style={styles.cellText}>—</Text>;
        }

        // For employee: Show Request button only if token exists
        if (item.token) {
            return (
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => onRequestCorrection(item)}
                    activeOpacity={0.8}
                >
                    <Ionicons name="create-outline" size={14} color="#FFF" />
                    <Text style={styles.actionButtonText}>Request</Text>
                </TouchableOpacity>
            );
        }

        // No token = no correction allowed
        return <Text style={[styles.cellText, styles.naText]}>N/A</Text>;
    };

    const renderTableRow = (item, index) => {
        const isAlternate = index % 2 === 1;
        return (
            <View key={index} style={[styles.tableRow, isAlternate && styles.tableRowAlt]}>
                <Text style={[styles.cellText, styles.dateCell, { flex: 1.2 }]}>
                    {formatDate(item.date)}
                </Text>
                <Text style={[styles.cellText, styles.inTimeCell, { flex: 0.9 }]}>
                    {formatTime(item.inTime)}
                </Text>
                <Text style={[styles.cellText, styles.outTimeCell, { flex: 0.9 }]}>
                    {formatTime(item.outTime)}
                </Text>
                <Text style={[styles.cellText, styles.hoursCell, { flex: 0.8 }]}>
                    {formatWorkingHours(item.workingHours)}
                </Text>
                <View style={{ flex: 1 }}>
                    <StatusBadge
                        status={item.status}
                        style={styles.statusBadge}
                        textStyle={styles.statusText}
                    />
                </View>
                <View style={{ flex: 1, alignItems: 'center' }}>
                    {renderCorrectionColumn(item)}
                </View>
            </View>
        );
    };

    return (
        <View style={styles.tableContainer}>
            {renderTableHeader()}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.tableBody}>
                    {data.length > 0 ? (
                        data.map((item, index) => renderTableRow(item, index))
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="folder-open-outline" size={48} color={theme.colors.textTertiary} />
                            <Text style={styles.emptyText}>No attendance records</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    tableContainer: {
        flex: 1,
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        ...theme.shadow.medium,
        overflow: 'hidden',
        marginHorizontal: 0,
        marginTop: 8,
        marginBottom: 16,
    },
    scrollContent: {
        flexGrow: 1,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#1E293B',
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    columnHeader: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 13,
        letterSpacing: 0.3,
        textTransform: 'uppercase',
    },
    tableBody: {
        width: '100%',
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.divider,
        alignItems: 'center',
    },
    tableRowAlt: {
        backgroundColor: theme.colors.surfaceAlt || '#F8FAFC',
    },
    cellText: {
        fontSize: 13,
        color: theme.colors.text,
        fontWeight: '400',
    },
    dateCell: {
        fontWeight: '600',
    },
    inTimeCell: {
        color: theme.colors.success,
        fontWeight: '500',
    },
    outTimeCell: {
        color: theme.colors.error,
        fontWeight: '500',
    },
    hoursCell: {
        fontWeight: '600',
        color: theme.colors.primary,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
        ...theme.shadow.small,
    },
    actionButtonText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    correctionBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 20,
        backgroundColor: theme.colors.surfaceAlt || '#F1F5F9',
    },
    pendingText: {
        fontSize: 11,
        fontWeight: '600',
        color: theme.colors.warning,
    },
    approvedText: {
        fontSize: 11,
        fontWeight: '600',
        color: theme.colors.success,
    },
    rejectedText: {
        fontSize: 11,
        fontWeight: '600',
        color: theme.colors.error,
    },
    naText: {
        fontSize: 11,
        color: theme.colors.textTertiary,
        fontStyle: 'italic',
    },
    emptyContainer: {
        padding: 60,
        alignItems: 'center',
        gap: 16,
    },
    emptyText: {
        fontSize: 15,
        color: theme.colors.textSecondary,
        fontWeight: '500',
    },
});

export default AttendanceTable;