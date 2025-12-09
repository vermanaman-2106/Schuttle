import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography, borderRadius } from '../../theme/colors';
import { Card } from '../../components/Card';
import { getMyBookings, cancelBooking } from '../../api/bookings';
import { Ionicons } from '@expo/vector-icons';

export default function MyBookingsScreen() {
  const insets = useSafeAreaInsets();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadBookings = async () => {
    try {
      const response = await getMyBookings();
      if (response.success) {
        setBookings(response.bookings);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadBookings();
  };

  const handleCancel = async (bookingId) => {
    Alert.alert('Cancel Booking', 'Are you sure you want to cancel this booking?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelBooking(bookingId);
            loadBookings();
            Alert.alert('Success', 'Booking cancelled');
          } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to cancel booking');
          }
        },
      },
    ]);
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderBookingCard = ({ item }) => (
    <Card style={styles.bookingCard}>
      <View style={styles.bookingHeader}>
        <View style={styles.locationContainer}>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={16} color={colors.accent} />
            <Text style={styles.locationText}>{item.pickupLocation}</Text>
          </View>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={16} color={colors.textMuted} />
            <Text style={styles.locationText}>{item.dropLocation}</Text>
          </View>
        </View>
        <View
          style={[
            styles.statusBadge,
            item.bookingStatus === 'pending' && styles.statusPending,
            item.bookingStatus === 'confirmed' && styles.statusConfirmed,
            item.bookingStatus === 'cancelled' && styles.statusCancelled,
            item.bookingStatus === 'rejected' && styles.statusRejected,
            item.bookingStatus === 'completed' && styles.statusCompleted,
          ]}>
          <Text style={[
            styles.statusText,
            item.bookingStatus === 'pending' && { color: colors.warning || '#FFA500' },
            item.bookingStatus === 'rejected' && { color: colors.error },
          ]}>
            {item.bookingStatus.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.bookingDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.detailText}>{formatDateTime(item.rideDateTime)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.detailText}>{item.seatsBooked} seat(s)</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="cash-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.detailText}>
            ₹{item.seatsBooked * (item.rideId?.pricePerSeat || 0)} total
          </Text>
        </View>
      </View>

      <View style={styles.driverInfo}>
        <Text style={styles.driverName}>Driver: {item.driverId.name}</Text>
        <Text style={styles.vehicleInfo}>
          {item.driverId.vehicleModel} • {item.driverId.vehicleNumber}
        </Text>
      </View>

      {item.bookingStatus === 'pending' && (
        <View style={styles.pendingInfo}>
          <Ionicons name="time-outline" size={16} color={colors.warning || '#FFA500'} />
          <Text style={styles.pendingText}>Waiting for driver confirmation</Text>
        </View>
      )}
      {(item.bookingStatus === 'confirmed' || item.bookingStatus === 'pending') && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => handleCancel(item._id)}>
          <Text style={styles.cancelButtonText}>Cancel Booking</Text>
        </TouchableOpacity>
      )}
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.title}>My Bookings</Text>
      </View>
      <FlatList
        data={bookings}
        renderItem={renderBookingCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No bookings yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 90, // Space for bottom tab bar
  },
  bookingCard: {
    marginBottom: spacing.md,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  locationContainer: {
    flex: 1,
    gap: spacing.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  locationText: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusPending: {
    backgroundColor: (colors.warning || '#FFA500') + '20',
  },
  statusConfirmed: {
    backgroundColor: colors.success + '20',
  },
  statusCancelled: {
    backgroundColor: colors.error + '20',
  },
  statusRejected: {
    backgroundColor: colors.error + '20',
  },
  statusCompleted: {
    backgroundColor: colors.info + '20',
  },
  statusText: {
    ...typography.small,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  bookingDetails: {
    gap: spacing.xs,
    marginBottom: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  detailText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  driverInfo: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  driverName: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  vehicleInfo: {
    ...typography.caption,
    color: colors.textMuted,
  },
  cancelButton: {
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.error + '20',
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...typography.bodyBold,
    color: colors.error,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
  },
  pendingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: (colors.warning || '#FFA500') + '10',
    borderRadius: borderRadius.md,
  },
  pendingText: {
    ...typography.body,
    color: colors.warning || '#FFA500',
    fontStyle: 'italic',
  },
});

