import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Alert,
    TouchableOpacity,
    RefreshControl,
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import theme from '../../../constants/theme';
import DatePickerInput from '../../../components/common/DatePickerInput'
import api from '../../../services/api';

// Helper to format numbers with 2 decimals
const formatSalary = (value) => (value || 0).toFixed(2);


const getDefaultFromDat = () => {
    const date = new Date();
    date.setMonth(date, getMonth() - 1);
    date.setDate(1);
    return date.toISOString().split('T')[0];
};
const getDefaultToDat = () => {
    const date = new Date();
    date.setDate(0);
    return date.toISOString().split('T')[0];

};

const payrol = () => {
    //date states

    const [fromDate, setFromDate] = useState(getDefaultFromDate());
    const [toDate, setToDate] = useState(getDefaultToDate());

    // data states
    const [payrollData, setPayrollData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [downloading, setDownloading] = useState(false);

    // fetch payroal dta from api

    const fetchPayroll = useCallback(async () => {
        if (!fromDate || !toDate) {
            setError("Please select both from and to date");
            return
        };
        setLoading(true);
        setError('');
        try {
            const response = await api.post("/payroal/generate-rnge", {
                fromDate, toDate
            })
            // the api returns {fromdate  tdate , payroasl}
            setPayrollData(response.data.payrolls || []);
        } catch (err) {
            const message = err.response?.data?.message || err.message || "failed to fetch payroal date";
            setError(message);
            Alert.alert("Error", message);
        } finally {
            setLoading(false)
        }

    }, [fromDate, toDate]);

    // fetch on mount and whenever dates chages (debounced to avoid excessive calss)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (fromDate && toDate) {
                fetchPayroll();
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [fromDate, toDate, fetchPayroll]);

    // doenload Payslip for a sepecific employee

    const downloadPayslip = async (empCode) => {
        if (!fromDate || !toDate) {
            Alert.alert("Error", "PLease select a date range");
            return;
        }
        setDownloading(true);
        setError('');

        try {
            // extract base url from axios config (removes trailing '/api')
            const baseURL = api.defaults.baseURL.replace("/api", '');
            const url = `${baseURL}/api/payroll/download-range?empCode=${empCode}&fromDate=${fromDate}&toDate=${toDate}`;
            console.log(`Opening download link: ${url}`);
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                Alert.alert('Error', 'Could not open the download link');
            }

        } catch (err) {
            const errorMessage = err.message || 'Failed to initiate download';
            setError(errorMessage);
            Alert.alert('Error', errorMessage);
        } finally {
            setDownloading(false);
        }
    };

    const columns = [
        { label: "Emp Code ", width: 90 },
        { label: 'Name', width: 180 },
        { label: 'Working Days', width: 100 },
        { label: 'Half Days', width: 80 },
        { label: 'Absent Days', width: 90 },
        { label: 'Paid Days', width: 80 },
        { label: 'Basic Salary', width: 100 },
        { label: 'Gross Salary', width: 100 },
        { label: 'Deduction', width: 90 },
        { label: 'Net Salary', width: 100 },
        { label: 'Payslip', width: 80 },

    ];

    const renderRow = (item)=>(

    )




}
// Default date range: first and last day of the previous month


const PayrollScreen = () => {

    // Table column definitions (widths for horizontal scrolling)


    // Render a single payroll row
    const renderRow = (item) => (
        <View style={styles.row} key={item.empCode}>
            <View style={[styles.cell, { width: columns[0].width }]}>
                <Text style={styles.cellText}>{item.empCode}</Text>
            </View>
            <View style={[styles.cell, { width: columns[1].width }]}>
                <Text style={styles.cellText} numberOfLines={1}>{item.empName}</Text>
            </View>
            <View style={[styles.cell, { width: columns[2].width }]}>
                <Text style={styles.cellText}>{(item.totalDaysInMonth - item.absentDays).toFixed(2)}</Text>
            </View>
            <View style={[styles.cell, { width: columns[3].width }]}>
                <Text style={styles.cellText}>{item.presentHalfDays}</Text>
            </View>
            <View style={[styles.cell, { width: columns[4].width }]}>
                <Text style={styles.cellText}>{item.absentDays}</Text>
            </View>
            <View style={[styles.cell, { width: columns[5].width }]}>
                <Text style={styles.cellText}>{item.paidDays.toFixed(2)}</Text>
            </View>
            <View style={[styles.cell, { width: columns[6].width }]}>
                <Text style={styles.cellText}>{formatSalary(item.monthlySalary)}</Text>
            </View>
            <View style={[styles.cell, { width: columns[7].width }]}>
                <Text style={styles.cellText}>{formatSalary(item.grossSalary)}</Text>
            </View>
            <View style={[styles.cell, { width: columns[8].width }]}>
                <Text style={styles.cellText}>{formatSalary(item.totalDeductions)}</Text>
            </View>
            <View style={[styles.cell, { width: columns[9].width }]}>
                <Text style={styles.cellText}>{formatSalary(item.netSalary)}</Text>
            </View>
            <View style={[styles.cell, { width: columns[10].width }]}>
                <TouchableOpacity
                    onPress={() => downloadPayslip(item.empCode)}
                    disabled={downloading}
                    style={styles.downloadButton}
                >
                    <Ionicons name="download-outline" size={18} color={theme.colors.primary} />
                    <Text style={styles.downloadText}>Payslip</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Date pickers and export button */}
            <View style={styles.topSection}>
                <View style={styles.dateRow}>
                    <DatePickerInput
                        label="From Date"
                        value={fromDate}
                        onChange={setFromDate}
                        maximumDate={toDate ? new Date(toDate) : undefined}
                        required
                    />
                    <DatePickerInput
                        label="To Date"
                        value={toDate}
                        onChange={setToDate}
                        minimumDate={fromDate ? new Date(fromDate) : undefined}
                        required
                    />
                </View>
                <TouchableOpacity
                    style={styles.exportButton}
                    onPress={() => Alert.alert('Info', 'Excel export coming soon')}
                >
                    <Ionicons name="download-outline" size={18} color="#fff" />
                    <Text style={styles.exportButtonText}>Export Excel (All Employees)</Text>
                </TouchableOpacity>
            </View>

            {/* Error message */}
            {error ? (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            ) : null}

            {/* Loading indicator */}
            {loading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={styles.loadingText}>Loading payroll data...</Text>
                </View>
            )}

            {/* Empty state */}
            {!loading && !error && payrollData.length === 0 && (
                <View style={styles.emptyContainer}>
                    <Ionicons name="document-text-outline" size={48} color={theme.colors.textSecondary} />
                    <Text style={styles.emptyText}>No payroll data for the selected date range</Text>
                </View>
            )}

            {/* Payroll table */}
            {!loading && !error && payrollData.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                    <View>
                        {/* Table header */}
                        <View style={styles.headerRow}>
                            {columns.map((col, index) => (
                                <View key={index} style={[styles.headerCell, { width: col.width }]}>
                                    <Text style={styles.headerText}>{col.label}</Text>
                                </View>
                            ))}
                        </View>

                        {/* Table rows */}
                        <ScrollView
                            showsVerticalScrollIndicator={true}
                            refreshControl={
                                <RefreshControl refreshing={loading} onRefresh={fetchPayroll} colors={[theme.colors.primary]} />
                            }
                        >
                            {payrollData.map((item) => renderRow(item))}
                        </ScrollView>
                    </View>
                </ScrollView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        padding: 16,
    },
    topSection: {
        marginBottom: 20,
    },
    dateRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    exportButton: {
        backgroundColor: theme.colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    exportButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
    errorContainer: {
        backgroundColor: '#fee',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: theme.colors.error,
    },
    errorText: {
        color: theme.colors.error,
        fontSize: 14,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: theme.colors.textSecondary,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        marginTop: 12,
        fontSize: 16,
        color: theme.colors.textSecondary,
    },
    headerRow: {
        flexDirection: 'row',
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 2,
        borderBottomColor: theme.colors.border,
        paddingVertical: 12,
    },
    headerCell: {
        paddingHorizontal: 8,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    headerText: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.colors.text,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    row: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        paddingVertical: 10,
        alignItems: 'center',
    },
    cell: {
        paddingHorizontal: 8,
        justifyContent: 'center',
    },
    cellText: {
        fontSize: 13,
        color: theme.colors.text,
    },
    downloadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e6f2ff',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 4,
    },
    downloadText: {
        fontSize: 12,
        color: theme.colors.primary,
        marginLeft: 4,
        fontWeight: '500',
    },
});

export default PayrollScreen;