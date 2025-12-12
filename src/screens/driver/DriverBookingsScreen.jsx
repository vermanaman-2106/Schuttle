import React, { useEffect, useState, useCallback, useRef } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, typography, borderRadius } from '../../theme/colors';
import { Card } from '../../components/Card';
import { getDriverBookings, confirmBooking, rejectBooking } from '../../api/bookings';
import { Ionicons } from '@expo/vector-icons';
import { BookingCardSkeleton } from '../../components/SkeletonLoader';
import { getCache, setCache } from '../../utils/cache';

export default function DriverBookingsScreen() {
  const insets = useSafeAreaInsets();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const abortControllerRef = useRef(null);

  const loadBookings = useCallback(async (showCached = true) => {
    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      // Show cached data immediately if available
      if (showCached) {
        const cachedBookings = await getCache('driverBookings');
        if (cachedBookings) {
          setBookings(cachedBookings);
          setLoading(false);
        }
      }

      // Fetch fresh data
      const response = await getDriverBookings();
      
      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      if (response.success) {
        const freshBookings = response.bookings || [];
        setBookings(freshBookings);
        // Cache the fresh data
        await setCache('driverBookings', freshBookings);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        return; // Request was cancelled, ignore
      }
      console.error('Error loading bookings:', error);
      // If we have cached data, keep showing it
      if (bookings.length === 0) {
        const cachedBookings = await getCache('driverBookings');
        if (cachedBookings) {
          setBookings(cachedBookings);
        }
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [bookings.length]);

  useFocusEffect(
    useCallback(() => {
      loadBookings(true);
      return () => {
        // Cleanup: abort request when screen loses focus
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      };
    }, [loadBookings])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadBookings(false); // Don't show cached data on refresh
  }, [loadBookings]);

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

  const handleConfirmBooking = async (bookingId) => {
    try {
      setProcessingId(bookingId);
      const response = await confirmBooking(bookingId);
      
      if (response.success) {
        // Update the booking in the list
        setBookings(bookings.map(booking => 
          booking._id === bookingId 
            ? { ...booking, bookingStatus: 'confirmed' }
            : booking
        ));
        Alert.alert('Success', 'Booking confirmed successfully');
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to confirm booking');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectBooking = async (bookingId) => {
    Alert.alert(
      'Reject Booking',
      'Are you sure you want to reject this booking? The seats will be returned to the ride.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessingId(bookingId);
              const response = await rejectBooking(bookingId);
              
              if (response.success) {
                // Update the booking in the list
                setBookings(bookings.map(booking => 
                  booking._id === bookingId 
                    ? { ...booking, bookingStatus: 'rejected' }
                    : booking
                ));
                Alert.alert('Success', 'Booking rejected successfully');
              }
            } catch (error) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to reject booking');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
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
            item.bookingStatus === 'confirmed' && styles.statusConfirmed,
            item.bookingStatus === 'pending' && styles.statusPending,
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

      {item.studentId ? (
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>Student: {item.studentId.name || 'N/A'}</Text>
          <View style={styles.studentContactRow}>
            <Ionicons name="call-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.studentPhone}>{item.studentId.phone || 'N/A'}</Text>
          </View>
          <View style={styles.studentContactRow}>
            <Ionicons name="mail-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.studentEmail}>{item.studentId.email || 'N/A'}</Text>
          </View>
          {item.studentId.registrationNumber && (
            <View style={styles.studentContactRow}>
              <Ionicons name="school-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.registrationNumber}>
                Reg: {item.studentId.registrationNumber}
              </Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.studentInfo}>
          <Text style={[styles.studentName, { color: colors.textMuted }]}>
            Student information not available
          </Text>
        </View>
      )}

      {/* Action buttons for pending bookings */}
      {item.bookingStatus === 'pending' && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.confirmButton]}
            onPress={() => handleConfirmBooking(item._id)}
            disabled={processingId === item._id}>
            {processingId === item._id ? (
              <ActivityIndicator size="small" color={colors.textPrimary} />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={18} color={colors.textPrimary} />
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleRejectBooking(item._id)}
            disabled={processingId === item._id}>
            {processingId === item._id ? (
              <ActivityIndicator size="small" color={colors.error} />
            ) : (
              <>
                <Ionicons name="close-circle-outline" size={18} color={colors.error} />
                <Text style={styles.rejectButtonText}>Reject</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.title}>Bookings</Text>
      </View>
      <FlatList
        data={bookings}
        renderItem={renderBookingCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        ListEmptyComponent={
          loading ? (
            <View style={styles.skeletonContainer}>
              {[1, 2, 3].map((i) => (
                <BookingCardSkeleton key={i} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No bookings yet</Text>
            </View>
          )
        }
        ListHeaderComponent={
          loading && bookings.length === 0 ? (
            <View style={styles.skeletonContainer}>
              {[1, 2, 3].map((i) => (
                <BookingCardSkeleton key={i} />
              ))}
            </View>
          ) : null
        }
        // Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        windowSize={10}
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
  skeletonContainer: {
    padding: spacing.md,
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
  studentInfo: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  studentName: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  studentContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  studentPhone: {
    ...typography.body,
    color: colors.textSecondary,
  },
  studentEmail: {
    ...typography.body,
    color: colors.textSecondary,
  },
  registrationNumber: {
    ...typography.caption,
    color: colors.textMuted,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  confirmButton: {
    backgroundColor: colors.success + '20',
  },
  rejectButton: {
    backgroundColor: colors.error + '20',
  },
  confirmButtonText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  rejectButtonText: {
    ...typography.body,
    color: colors.error,
    fontWeight: '600',
  },
});

