// screens/hrms/dailyreports/DailyReportsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../../services/api';
import DatePickerInput from '../../../components/common/DatePickerInput';
import theme from '../../../constants/theme';
// import api from '../../../services/api'; // your configured axios instance
// import theme from '../../../constants/theme';
// import DatePickerInput from '../../../components/common/DatePickerInput'; // existing component

// Helper to format ISO date to "DD MMM YYYY"
const formatDisplayDate = (isoString) => {
  const date = new Date(isoString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = date.toLocaleString('default', { month: 'short' }); // "Feb"
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

// Helper to get today's date in YYYY-MM-DD format
const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const DailyReportsScreen = () => {
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch reports when selectedDate changes (or on mount)
  useEffect(() => {
    fetchReports();
  }, [selectedDate]); // refetch when date changes

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      // Use the provided API with selectedDate query param
      const response = await api.get('/DailyReportApi/mysent', {
        params: { selectedDate },
      });
      setReports(response.data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const renderRecipients = (recipients) => {
    if (!recipients || recipients.length === 0) {
      return <Text style={styles.placeholder}>No recipients</Text>;
    }
    return recipients.map((recipient, index) => (
      <View key={index} style={styles.recipientItem}>
        <View style={styles.recipientInfo}>
          <Text style={styles.recipientName}>{recipient.receiverName}</Text>
          <Text style={styles.recipientRole}>{recipient.receiverRole}</Text>
        </View>
        <View style={[styles.readStatus, recipient.isRead ? styles.read : styles.unread]}>
          <Text style={styles.readStatusText}>
            {recipient.isRead ? 'Read' : 'Unread'}
          </Text>
        </View>
      </View>
    ));
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      {/* Premium Header */}
      <View style={styles.dateContainer}>
        <View style={styles.dateTag}>
          <Ionicons name="calendar" size={14} color={theme.colors.primary} />
          <Text style={styles.dateText}>{formatDisplayDate(item.createdDate)}</Text>
        </View>
        <View style={styles.idChip}>
          <Text style={styles.idChipText}>#{item.id}</Text>
        </View>
      </View>

      {/* Today's Work */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Today's Outcome</Text>
        <Text style={styles.sectionContent}>{item.todaysWork || 'Not reported'}</Text>
      </View>

      {/* Pending Work */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Pipeline / Pending</Text>
        <Text style={styles.sectionContent}>{item.pendingWork || 'None'}</Text>
      </View>

      {/* Issues */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Blockers & Issues</Text>
        <Text style={styles.sectionContent}>{item.issues || 'No issues reported'}</Text>
      </View>

      {/* Attachment */}
      {item.attachment ? (
        <View style={styles.attachmentContainer}>
          <Ionicons name="document-attach" size={20} color={theme.colors.primary} />
          <Text style={styles.attachmentText} numberOfLines={1}>{item.attachment}</Text>
          <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
        </View>
      ) : null}

      {/* Recipients */}
      <View style={styles.section}>
        <View style={styles.recipientsBox}>
          <Text style={styles.sectionLabel}>Tracking & Recipients</Text>
          {renderRecipients(item.recipients)}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Premium Header/Filter Section */}
      <View style={styles.headerCard}>
        <View style={styles.filterRow}>
          <View style={styles.filterIconBox}>
            <Ionicons name="funnel-outline" size={20} color={theme.colors.primary} />
          </View>
          <View style={styles.filterContent}>
            <DatePickerInput
              label="Report Date"
              value={selectedDate}
              onChange={setSelectedDate}
              maximumDate={new Date()}
            />
          </View>
        </View>
      </View>

      {loading && (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Fetching reports...</Text>
        </View>
      )}

      {!loading && error && (
        <View style={styles.centerContainer}>
          <View style={styles.errorCircle}>
            <Ionicons name="alert-circle-outline" size={40} color={theme.colors.error} />
          </View>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchReports}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && reports.length === 0 && (
        <View style={styles.centerContainer}>
          <View style={styles.emptyCircle}>
            <Ionicons name="document-text-outline" size={48} color={theme.colors.textTertiary} />
          </View>
          <Text style={styles.emptyTitle}>Empty Queue</Text>
          <Text style={styles.emptyText}>No reports documented for this date</Text>
        </View>
      )}

      {!loading && !error && reports.length > 0 && (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC', // theme.colors.background
  },
  headerCard: {
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filterIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterContent: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  dateTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  dateText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '700',
  },
  idChip: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  idChipText: {
    fontSize: 10,
    color: '#3B82F6',
    fontWeight: '800',
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    marginBottom: 6,
    letterSpacing: 1,
  },
  sectionContent: {
    fontSize: 15,
    color: '#1E293B',
    lineHeight: 22,
    fontWeight: '500',
  },
  attachmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    padding: 12,
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  attachmentText: {
    flex: 1,
    fontSize: 13,
    color: '#0369A1',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  recipientsBox: {
    marginTop: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
  },
  recipientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  recipientInfo: {
    flex: 1,
  },
  recipientName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  recipientRole: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  readStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  read: {
    backgroundColor: '#DCFCE7',
  },
  unread: {
    backgroundColor: '#FEF3C7',
  },
  readStatusText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
  errorCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  errorText: {
    color: '#991B1B',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#2076C7',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#2076C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  retryButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },
  emptyCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
  },
  placeholder: {
    fontSize: 14,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
});

export default DailyReportsScreen;