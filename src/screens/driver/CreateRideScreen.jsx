import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography, borderRadius } from '../../theme/colors';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { createRide } from '../../api/rides';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';

const validationSchema = Yup.object().shape({
  pickupLocation: Yup.string().required('Pickup location is required'),
  dropLocation: Yup.string().required('Drop location is required'),
  date: Yup.string().required('Date is required'),
  time: Yup.string().required('Time is required'),
  pricePerSeat: Yup.number()
    .min(0, 'Price must be positive')
    .required('Price per seat is required'),
  totalSeats: Yup.number()
    .min(1, 'Total seats must be at least 1')
    .required('Total seats is required'),
});

export default function CreateRideScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user, refreshUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(true);

  // Check verification status when screen loads
  useEffect(() => {
    const checkVerification = async () => {
      // Refresh user data to get latest verification status
      await refreshUser();
      setCheckingVerification(false);
    };
    checkVerification();
  }, [refreshUser]);

  const handleCreateRide = async (values) => {
    // Double-check verification before submitting
    if (!user?.verified) {
      Alert.alert(
        'Verification Required',
        'Your driver account is not verified yet. Please wait for admin verification before creating rides.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setLoading(true);
      const response = await createRide({
        ...values,
        pricePerSeat: parseFloat(values.pricePerSeat),
        totalSeats: parseInt(values.totalSeats, 10),
      });

      if (response.success) {
        Alert.alert('Success', 'Ride created successfully! Please confirm it from "My Rides" to make it visible to students.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create ride';
      
      // Check if it's a verification error
      if (error.response?.data?.requiresVerification) {
        Alert.alert(
          'Verification Required',
          errorMessage,
          [
            { text: 'OK' },
            { 
              text: 'Refresh Status', 
              onPress: async () => {
                await refreshUser();
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Show verification message if driver is not verified
  if (!checkingVerification && !user?.verified) {
    return (
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.xl }]}>
        <Card style={styles.verificationCard}>
          <View style={styles.verificationHeader}>
            <Ionicons name="lock-closed" size={48} color={colors.warning || '#FFA500'} />
            <Text style={styles.verificationTitle}>Verification Required</Text>
          </View>
          <Text style={styles.verificationText}>
            Your driver account is pending verification. You need to be verified by an admin before you can create rides.
          </Text>
          <Text style={styles.verificationSubtext}>
            Please wait for admin approval. You'll receive a notification once your account is verified.
          </Text>
          <Button
            title="Check Verification Status"
            onPress={async () => {
              setCheckingVerification(true);
              await refreshUser();
              setCheckingVerification(false);
            }}
            style={styles.refreshButton}
            loading={checkingVerification}
          />
          <Button
            title="Go to Profile"
            onPress={() => navigation.navigate('Profile')}
            variant="secondary"
            style={styles.profileButton}
          />
        </Card>
      </ScrollView>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.xl }]}>
      <Text style={styles.title}>Create New Ride</Text>
      <Text style={styles.subtitle}>Fill in the details to create a ride</Text>

      <Formik
        initialValues={{
          pickupLocation: '',
          dropLocation: '',
          date: getTodayDate(),
          time: '',
          pricePerSeat: '',
          totalSeats: '',
        }}
        validationSchema={validationSchema}
        onSubmit={handleCreateRide}>
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
          <View style={styles.form}>
            <Input
              label="Pickup Location"
              placeholder="e.g., MUJ Main Gate"
              value={values.pickupLocation}
              onChangeText={handleChange('pickupLocation')}
              onBlur={handleBlur('pickupLocation')}
              error={touched.pickupLocation && errors.pickupLocation ? errors.pickupLocation : undefined}
            />
            <Input
              label="Drop Location"
              placeholder="e.g., Jaipur Airport"
              value={values.dropLocation}
              onChangeText={handleChange('dropLocation')}
              onBlur={handleBlur('dropLocation')}
              error={touched.dropLocation && errors.dropLocation ? errors.dropLocation : undefined}
            />
            <Input
              label="Date"
              placeholder="YYYY-MM-DD"
              value={values.date}
              onChangeText={handleChange('date')}
              onBlur={handleBlur('date')}
              error={touched.date && errors.date ? errors.date : undefined}
            />
            <Input
              label="Time"
              placeholder="e.g., 10:00 AM"
              value={values.time}
              onChangeText={handleChange('time')}
              onBlur={handleBlur('time')}
              error={touched.time && errors.time ? errors.time : undefined}
            />
            <Input
              label="Price Per Seat (₹)"
              placeholder="e.g., 500"
              value={values.pricePerSeat}
              onChangeText={handleChange('pricePerSeat')}
              onBlur={handleBlur('pricePerSeat')}
              error={touched.pricePerSeat && errors.pricePerSeat ? errors.pricePerSeat : undefined}
              keyboardType="decimal-pad"
            />
            <Input
              label="Total Seats"
              placeholder="e.g., 4"
              value={values.totalSeats}
              onChangeText={handleChange('totalSeats')}
              onBlur={handleBlur('totalSeats')}
              error={touched.totalSeats && errors.totalSeats ? errors.totalSeats : undefined}
              keyboardType="number-pad"
            />
            <Button
              title="Create Ride"
              onPress={() => handleSubmit()}
              loading={loading}
              style={styles.button}
            />
          </View>
        )}
      </Formik>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.xl,
    paddingTop: spacing.xxl,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  form: {
    marginBottom: spacing.lg,
  },
  button: {
    marginTop: spacing.md,
  },
  verificationCard: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  verificationHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  verificationTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  verificationText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  verificationSubtext: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 18,
  },
  refreshButton: {
    marginBottom: spacing.md,
    width: '100%',
  },
  profileButton: {
    width: '100%',
  },
});

