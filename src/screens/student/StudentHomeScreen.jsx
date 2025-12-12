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
import { retryRequest } from '../../utils/retry';

export default function StudentHomeScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const loadRides = useCallback(async (showCached = true) => {
    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    setError(null); // Clear previous errors

    try {
      // Show cached data immediately if available
      if (showCached) {
        const cachedRides = await getCache('rides');
        if (cachedRides && cachedRides.length > 0) {
          setRides(cachedRides);
          setLoading(false);
          setError(null);
        }
      }

      // Fetch fresh data with retry logic for 502 errors (Render cold starts)
      // Increased retries and delays for Render's slow cold starts (can take 30-60 seconds)
      const response = await retryRequest(
        () => getRides(),
        5, // max retries (5 attempts total)
        5000 // initial delay (5 seconds) - Render cold starts need more time
      );
      
      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      if (response.success) {
        const freshRides = response.rides || [];
        setRides(freshRides);
        setError(null); // Clear error on success
        // Cache the fresh data
        await setCache('rides', freshRides);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        return; // Request was cancelled, ignore
      }
      
      // Get user-friendly error message
      const errorMessage = error.userFriendlyMessage || 
        error.response?.data?.message || 
        error.message || 
        'Failed to load rides';
      
      console.error('Error loading rides:', errorMessage);
      
      // Check for cached data
      const cachedRides = await getCache('rides');
      if (cachedRides && cachedRides.length > 0) {
        // Show cached data and set error (user can retry)
        setRides(cachedRides);
        setError(errorMessage);
      } else {
        // No cached data, show error
        setError(errorMessage);
        setRides([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

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
          ) : error && rides.length === 0 ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => {
                  setError(null);
                  setLoading(true);
                  loadRides(false);
                }}>
                <Ionicons name="refresh" size={20} color={colors.accent} />
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
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
          ) : error && rides.length > 0 ? (
            <View style={styles.errorBanner}>
              <Ionicons name="warning-outline" size={16} color={colors.warning || '#FFA500'} />
              <Text style={styles.errorBannerText} numberOfLines={2}>{error}</Text>
              <TouchableOpacity
                onPress={() => {
                  setError(null);
                  loadRides(false);
                }}
                style={styles.retryButtonSmall}>
                <Text style={styles.retryButtonSmallText}>Retry</Text>
              </TouchableOpacity>
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
  errorContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  errorText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    ...typography.bodyBold,
    color: colors.buttonPrimaryText || '#000',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: (colors.warning || '#FFA500') + '20',
    padding: spacing.md,
    margin: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  errorBannerText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  retryButtonSmall: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  retryButtonSmallText: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: '600',
  },
});

