import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { colors, spacing, typography } from '../../theme/colors';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { registerDriver } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';

const validationSchema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  phone: Yup.string().required('Phone number is required'),
  password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  vehicleModel: Yup.string().required('Vehicle model is required'),
  vehicleNumber: Yup.string().required('Vehicle number is required'),
  totalSeats: Yup.number()
    .min(1, 'Total seats must be at least 1')
    .required('Total seats is required'),
});

export default function DriverRegisterScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { login } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handleRegister = async (values) => {
    try {
      setLoading(true);
      const response = await registerDriver({
        ...values,
        totalSeats: parseInt(values.totalSeats, 10),
      });
      
      if (response.success && response.driver) {
        await login(response.token, {
          id: response.driver.id,
          name: response.driver.name,
          email: response.driver.email,
          phone: response.driver.phone,
          role: 'driver',
          vehicleModel: response.driver.vehicleModel,
          vehicleNumber: response.driver.vehicleNumber,
          totalSeats: response.driver.totalSeats,
          verified: response.driver.verified,
        });
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.xxl }]}>
      <Text style={styles.title}>Driver Register</Text>
      <Text style={styles.subtitle}>Create your driver account</Text>

      <Formik
        initialValues={{
          name: '',
          email: '',
          phone: '',
          password: '',
          vehicleModel: '',
          vehicleNumber: '',
          totalSeats: '',
        }}
        validationSchema={validationSchema}
        onSubmit={handleRegister}>
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
          <View style={styles.form}>
            <Input
              label="Full Name"
              placeholder="Enter your name"
              value={values.name}
              onChangeText={handleChange('name')}
              onBlur={handleBlur('name')}
              error={touched.name && errors.name ? errors.name : undefined}
            />
            <Input
              label="Email"
              placeholder="your.email@example.com"
              value={values.email}
              onChangeText={handleChange('email')}
              onBlur={handleBlur('email')}
              error={touched.email && errors.email ? errors.email : undefined}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Input
              label="Phone Number"
              placeholder="Enter your phone number"
              value={values.phone}
              onChangeText={handleChange('phone')}
              onBlur={handleBlur('phone')}
              error={touched.phone && errors.phone ? errors.phone : undefined}
              keyboardType="phone-pad"
            />
            <Input
              label="Password"
              placeholder="At least 6 characters"
              value={values.password}
              onChangeText={handleChange('password')}
              onBlur={handleBlur('password')}
              error={touched.password && errors.password ? errors.password : undefined}
              secureTextEntry
            />
            <Input
              label="Vehicle Model"
              placeholder="e.g., Honda City"
              value={values.vehicleModel}
              onChangeText={handleChange('vehicleModel')}
              onBlur={handleBlur('vehicleModel')}
              error={touched.vehicleModel && errors.vehicleModel ? errors.vehicleModel : undefined}
            />
            <Input
              label="Vehicle Number"
              placeholder="e.g., RJ14AB1234"
              value={values.vehicleNumber}
              onChangeText={handleChange('vehicleNumber')}
              onBlur={handleBlur('vehicleNumber')}
              error={touched.vehicleNumber && errors.vehicleNumber ? errors.vehicleNumber : undefined}
              autoCapitalize="characters"
            />
            <Input
              label="Total Seats"
              placeholder="Number of seats available"
              value={values.totalSeats}
              onChangeText={handleChange('totalSeats')}
              onBlur={handleBlur('totalSeats')}
              error={touched.totalSeats && errors.totalSeats ? errors.totalSeats : undefined}
              keyboardType="number-pad"
            />
            <Button
              title="Register"
              onPress={() => handleSubmit()}
              loading={loading}
              style={styles.button}
            />
          </View>
        )}
      </Formik>

      <TouchableOpacity onPress={() => navigation.navigate('DriverLogin')}>
        <Text style={styles.linkText}>
          Already have an account? <Text style={styles.link}>Login</Text>
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xxl,
    textAlign: 'center',
  },
  form: {
    marginBottom: spacing.xl,
  },
  button: {
    marginTop: spacing.lg,
  },
  linkText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  link: {
    color: colors.accent,
    fontWeight: '600',
  },
});

