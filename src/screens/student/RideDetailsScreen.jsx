import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { colors, spacing, typography, borderRadius } from '../../theme/colors';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { getRideById } from '../../api/rides';
import { createBooking } from '../../api/bookings';
import { Ionicons } from '@expo/vector-icons';

const validationSchema = Yup.object().shape({
  seatsBooked: Yup.number()
    .min(1, 'Must book at least 1 seat')
    .required('Number of seats is required'),
});

export default function RideDetailsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { rideId } = route.params;
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    loadRide();
  }, [rideId]);

  const loadRide = async () => {
    try {
      const response = await getRideById(rideId);
      if (response.success) {
        setRide(response.ride);
      }
    } catch (error) {
      console.error('Error loading ride:', error);
      Alert.alert('Error', 'Failed to load ride details');
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async (values) => {
    if (!ride) return;

    if (values.seatsBooked > ride.availableSeats) {
      Alert.alert('Error', `Only ${ride.availableSeats} seat(s) available`);
      return;
    }

    try {
      setBooking(true);
      const response = await createBooking({
        rideId: ride._id,
        seatsBooked: values.seatsBooked,
      });

      if (response.success) {
        Alert.alert('Success', 'Booking confirmed!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Booking failed');
    } finally {
      setBooking(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!ride) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Ride not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card>
        <View style={styles.locationSection}>
          <View style={styles.locationRow}>
            <View style={styles.locationIcon}>
              <Ionicons name="location" size={24} color={colors.accent} />
            </View>
            <View style={styles.locationTextContainer}>
              <Text style={styles.locationLabel}>Pickup</Text>
              <Text style={styles.locationText}>{ride.pickupLocation}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.locationRow}>
            <View style={styles.locationIcon}>
              <Ionicons name="location-outline" size={24} color={colors.textMuted} />
            </View>
            <View style={styles.locationTextContainer}>
              <Text style={styles.locationLabel}>Drop</Text>
              <Text style={styles.locationText}>{ride.dropLocation}</Text>
            </View>
          </View>
        </View>

        <View style={styles.detailsSection}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.detailText}>{formatDate(ride.date)}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.detailText}>{ride.time}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="cash-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.detailText}>₹{ride.pricePerSeat} per seat</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="people-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.detailText}>
              {ride.availableSeats} / {ride.totalSeats} seats available
            </Text>
          </View>
        </View>

        <View style={styles.driverSection}>
          <Text style={styles.sectionTitle}>Driver Information</Text>
          <Text style={styles.driverName}>{ride.driverId.name}</Text>
          <Text style={styles.vehicleInfo}>
            {ride.driverId.vehicleModel} • {ride.driverId.vehicleNumber}
          </Text>
          <Text style={styles.phoneInfo}>
            <Ionicons name="call-outline" size={16} color={colors.textSecondary} />{' '}
            {ride.driverId.phone}
          </Text>
        </View>
      </Card>

      {ride.availableSeats > 0 && ride.status === 'open' && (
        <Card>
          <Text style={styles.sectionTitle}>Book Seats</Text>
          <Formik
            initialValues={{ seatsBooked: 1 }}
            validationSchema={validationSchema}
            onSubmit={handleBooking}>
            {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue }) => (
              <View>
                <Input
                  label="Number of Seats"
                  placeholder="Enter number of seats"
                  value={values.seatsBooked.toString()}
                  onChangeText={(text) => {
                    const num = parseInt(text, 10);
                    if (!isNaN(num) && num > 0) {
                      setFieldValue('seatsBooked', num);
                    } else if (text === '') {
                      setFieldValue('seatsBooked', '');
                    }
                  }}
                  onBlur={handleBlur('seatsBooked')}
                  error={touched.seatsBooked && errors.seatsBooked ? errors.seatsBooked : undefined}
                  keyboardType="number-pad"
                />
                <View style={styles.priceInfo}>
                  <Text style={styles.priceLabel}>Total Amount:</Text>
                  <Text style={styles.priceValue}>
                    ₹{values.seatsBooked ? values.seatsBooked * ride.pricePerSeat : 0}
                  </Text>
                </View>
                <Button
                  title="Book Now"
                  onPress={() => handleSubmit()}
                  loading={booking}
                  style={styles.bookButton}
                />
              </View>
            )}
          </Formik>
        </Card>
      )}

      {ride.availableSeats === 0 && (
        <Card>
          <Text style={styles.fullText}>This ride is full</Text>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  locationSection: {
    marginBottom: spacing.lg,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  locationIcon: {
    marginRight: spacing.md,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  locationText: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 40,
    marginVertical: spacing.md,
  },
  detailsSection: {
    gap: spacing.md,
    marginBottom: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detailText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  driverSection: {
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  driverName: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  vehicleInfo: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  phoneInfo: {
    ...typography.body,
    color: colors.textSecondary,
  },
  bookButton: {
    marginTop: spacing.md,
  },
  priceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.md,
  },
  priceLabel: {
    ...typography.bodyBold,
    color: colors.textSecondary,
  },
  priceValue: {
    ...typography.h2,
    color: colors.accent,
  },
  fullText: {
    ...typography.body,
    color: colors.error,
    textAlign: 'center',
  },
});

