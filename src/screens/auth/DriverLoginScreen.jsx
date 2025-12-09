import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { colors, spacing, typography } from '../../theme/colors';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { loginDriver } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';

const validationSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string().required('Password is required'),
});

export default function DriverLoginScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { login } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (values) => {
    try {
      setLoading(true);
      const response = await loginDriver(values);
      
      if (response.success && response.driver) {
        // Clear loading immediately - don't wait for storage
        setLoading(false);
        
        // Don't await - let AsyncStorage save in background, state updates immediately
        login(response.token, {
          id: response.driver.id,
          name: response.driver.name,
          email: response.driver.email,
          phone: response.driver.phone,
          role: 'driver',
          vehicleModel: response.driver.vehicleModel,
          vehicleNumber: response.driver.vehicleNumber,
          totalSeats: response.driver.totalSeats,
          verified: response.driver.verified,
        }).catch((err) => {
          console.error('Error saving auth data:', err);
          // State is already updated, so navigation will work even if storage fails
        });
        // Navigation will happen automatically via RootNavigator when isAuthenticated changes
      } else {
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', error.response?.data?.message || 'Login failed');
    }
  };

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.xxl }]}>
      <Text style={styles.title}>Driver Login</Text>
      <Text style={styles.subtitle}>Sign in to manage your rides</Text>

      <Formik
        initialValues={{ email: '', password: '' }}
        validationSchema={validationSchema}
        onSubmit={handleLogin}>
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
          <View style={styles.form}>
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
              label="Password"
              placeholder="Enter your password"
              value={values.password}
              onChangeText={handleChange('password')}
              onBlur={handleBlur('password')}
              error={touched.password && errors.password ? errors.password : undefined}
              secureTextEntry
            />
            <Button
              title="Login"
              onPress={() => handleSubmit()}
              loading={loading}
              style={styles.button}
            />
          </View>
        )}
      </Formik>

      <TouchableOpacity onPress={() => navigation.navigate('DriverRegister')}>
        <Text style={styles.linkText}>
          Don't have an account? <Text style={styles.link}>Register</Text>
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

