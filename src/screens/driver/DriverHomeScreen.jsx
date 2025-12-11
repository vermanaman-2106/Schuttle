import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
import { getDriverRides, deleteRide, confirmRide } from '../../api/rides';
import { Ionicons } from '@expo/vector-icons';

export default function DriverHomeScreen() {
  const insets = useSafeAreaInsets();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);

  const loadRides = useCallback(async () => {
    try {
      const response = await getDriverRides();
      if (response.success) {
        setRides(response.rides || []);
      }
    } catch (error) {
      console.error('Error loading rides:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRides();
  }, [loadRides]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadRides();
  }, [loadRides]);

  const formatDate = useCallback((dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }, []);

  const getStatusColor = useCallback((status) => {
    switch (status) {
      case 'pending':
        return colors.warning;
      case 'open':
        return colors.success;
      case 'full':
        return colors.info;
      case 'cancelled':
        return colors.error;
      case 'completed':
        return colors.textMuted;
      default:
        return colors.textMuted;
    }
  }, []);

  const handleConfirmRide = useCallback(async (rideId) => {
    try {
      setConfirmingId(rideId);
      const response = await confirmRide(rideId);
      
      if (response.success) {
        // Update the ride in the list
        setRides((prevRides) =>
          prevRides.map((ride) =>
            ride._id === rideId
              ? { ...ride, confirmed: true, status: 'open' }
              : ride
          )
        );
        Alert.alert('Success', 'Ride confirmed successfully! It is now visible to students.');
      } else {
        Alert.alert('Error', response.message || 'Failed to confirm ride');
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to confirm ride. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setConfirmingId(null);
    }
  }, []);

  const handleDeleteRide = useCallback((rideId, pickupLocation, dropLocation) => {
    Alert.alert(
      'Delete Ride',
      `Are you sure you want to delete this ride from ${pickupLocation} to ${dropLocation}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingId(rideId);
              console.log('Deleting ride:', rideId);
              const response = await deleteRide(rideId);
              console.log('Delete response:', response);
              
              if (response.success) {
                // Remove ride from list
                setRides((prevRides) => prevRides.filter((ride) => ride._id !== rideId));
                Alert.alert('Success', 'Ride deleted successfully');
              } else {
                Alert.alert('Error', response.message || 'Failed to delete ride');
              }
            } catch (error) {
              console.error('Delete error:', error);
              const errorMessage = 
                error.response?.data?.message || 
                error.message || 
                'Failed to delete ride. Please try again.';
              Alert.alert('Error', errorMessage);
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  }, []);

  const renderRideCard = useCallback(({ item }) => (
    <Card style={styles.rideCard}>
      <View style={styles.rideHeader}>
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
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status === 'pending' ? 'PENDING CONFIRMATION' : item.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.rideDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.detailText}>
            {formatDate(item.date)} at {item.time}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.detailText}>
            {item.availableSeats} / {item.totalSeats} seats available
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="cash-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.detailText}>₹{item.pricePerSeat} per seat</Text>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        {item.status === 'pending' && !item.confirmed ? (
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={() => handleConfirmRide(item._id)}
            disabled={confirmingId === item._id}>
            {confirmingId === item._id ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={18} color={colors.accent} />
                <Text style={styles.confirmButtonText}>Confirm Ride</Text>
              </>
            )}
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteRide(item._id, item.pickupLocation, item.dropLocation)}
          disabled={deletingId === item._id || confirmingId === item._id}>
          {deletingId === item._id ? (
            <ActivityIndicator size="small" color={colors.error} />
          ) : (
            <>
              <Ionicons name="trash-outline" size={18} color={colors.error} />
              <Text style={styles.deleteButtonText}>Delete</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </Card>
  ), [formatDate, getStatusColor, handleConfirmRide, handleDeleteRide, confirmingId, deletingId]);

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
        <Text style={styles.title}>My Rides</Text>
      </View>
      <FlatList
        data={rides}
        renderItem={renderRideCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No rides created yet</Text>
            <Text style={styles.emptySubtext}>Create your first ride to get started</Text>
          </View>
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
  rideCard: {
    marginBottom: spacing.md,
  },
  rideHeader: {
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
  statusText: {
    ...typography.small,
    fontWeight: '600',
  },
  rideDetails: {
    gap: spacing.xs,
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
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    ...typography.caption,
    color: colors.textMuted,
  },
  actionsContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.accent + '20',
  },
  confirmButtonText: {
    ...typography.body,
    color: colors.accent,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.error + '20',
  },
  deleteButtonText: {
    ...typography.body,
    color: colors.error,
    fontWeight: '600',
  },
});

