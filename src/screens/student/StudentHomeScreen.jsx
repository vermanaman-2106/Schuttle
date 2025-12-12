import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography, borderRadius } from '../../theme/colors';
import { Card } from '../../components/Card';
import { getRides } from '../../api/rides';
import { Ionicons } from '@expo/vector-icons';
import { RideCardSkeleton } from '../../components/SkeletonLoader';
import { getCache, setCache } from '../../utils/cache';

export default function StudentHomeScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const abortControllerRef = useRef(null);

  const loadRides = useCallback(async (showCached = true) => {
    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      // Show cached data immediately if available
      if (showCached) {
        const cachedRides = await getCache('rides');
        if (cachedRides) {
          setRides(cachedRides);
          setLoading(false);
        }
      }

      // Fetch fresh data
      const response = await getRides();
      
      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      if (response.success) {
        const freshRides = response.rides || [];
        setRides(freshRides);
        // Cache the fresh data
        await setCache('rides', freshRides);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        return; // Request was cancelled, ignore
      }
      console.error('Error loading rides:', error);
      // If we have cached data, keep showing it
      if (rides.length === 0) {
        const cachedRides = await getCache('rides');
        if (cachedRides) {
          setRides(cachedRides);
        }
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [rides.length]);

  useFocusEffect(
    useCallback(() => {
      loadRides(true);
      return () => {
        // Cleanup: abort request when screen loses focus
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      };
    }, [loadRides])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadRides(false); // Don't show cached data on refresh
  }, [loadRides]);

  const formatDate = useCallback((dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }, []);

  const renderRideCard = useCallback(({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('RideDetails', { rideId: item._id })}>
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

        <View style={styles.driverInfo}>
          <Text style={styles.driverName}>{item.driverId.name}</Text>
          <Text style={styles.vehicleInfo}>
            {item.driverId.vehicleModel} • {item.driverId.vehicleNumber}
          </Text>
        </View>

        {item.availableSeats > 0 && (
          <View style={styles.availableBadge}>
            <Text style={styles.availableText}>Available</Text>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  ), [navigation, formatDate]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.title}>Available Rides</Text>
      </View>
      <FlatList
        data={rides}
        renderItem={renderRideCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        ListEmptyComponent={
          loading ? (
            <View style={styles.skeletonContainer}>
              {[1, 2, 3].map((i) => (
                <RideCardSkeleton key={i} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No rides available</Text>
            </View>
          )
        }
        ListHeaderComponent={
          loading && rides.length === 0 ? (
            <View style={styles.skeletonContainer}>
              {[1, 2, 3].map((i) => (
                <RideCardSkeleton key={i} />
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
        getItemLayout={(data, index) => ({
          length: 200, // Approximate item height
          offset: 200 * index,
          index,
        })}
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
  listContent: {
    padding: spacing.md,
    paddingBottom: 90, // Space for bottom tab bar
  },
  rideCard: {
    marginBottom: spacing.md,
  },
  rideHeader: {
    marginBottom: spacing.md,
  },
  locationContainer: {
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
  rideDetails: {
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
  availableBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.success + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginTop: spacing.sm,
  },
  availableText: {
    ...typography.small,
    color: colors.success,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
  },
  skeletonContainer: {
    padding: spacing.md,
  },
});

