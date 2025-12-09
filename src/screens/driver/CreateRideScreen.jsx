import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { colors, spacing, typography } from '../../theme/colors';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { createRide } from '../../api/rides';
import { useNavigation } from '@react-navigation/native';

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
  const [loading, setLoading] = useState(false);

  const handleCreateRide = async (values) => {
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
      Alert.alert('Error', error.response?.data?.message || 'Failed to create ride');
    } finally {
      setLoading(false);
    }
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
});

