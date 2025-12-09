import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { colors, spacing, typography } from '../../theme/colors';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { loginStudent } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';

const validationSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email')
    .required('Email is required')
    .test('muj-email', 'Must be a MUJ email (@muj.manipal.edu or @jaipur.manipal.edu)', (value) =>
      value?.endsWith('@muj.manipal.edu') || value?.endsWith('@jaipur.manipal.edu') || false
    ),
  password: Yup.string().required('Password is required'),
});

export default function StudentLoginScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { login } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (values) => {
    try {
      setLoading(true);
      const response = await loginStudent(values);
      
      if (response.success && response.user) {
        // Clear loading immediately - don't wait for storage
        setLoading(false);
        
        // Don't await - let AsyncStorage save in background, state updates immediately
        login(response.token, {
          id: response.user.id,
          name: response.user.name,
          email: response.user.email,
          phone: response.user.phone,
          role: 'student',
          registrationNumber: response.user.registrationNumber,
          department: response.user.department,
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
      let errorMessage = 'Login failed. Please check your credentials.';
      
      if (error.response?.data) {
        // Check for validation errors array (from express-validator)
        if (error.response.data.errors && error.response.data.errors.length > 0) {
          errorMessage = error.response.data.errors.map(err => err.msg || err.message).join('\n');
        } 
        // Check for single error message
        else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Login Failed', errorMessage);
    }
  };

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.xxl }]}>
      <Text style={styles.title}>Student Login</Text>
      <Text style={styles.subtitle}>Sign in with your MUJ email</Text>

      <Formik
        initialValues={{ email: '', password: '' }}
        validationSchema={validationSchema}
        onSubmit={handleLogin}>
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
          <View style={styles.form}>
            <Input
              label="Email"
              placeholder="your.name@muj.manipal.edu or @jaipur.manipal.edu"
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

      <TouchableOpacity onPress={() => navigation.navigate('StudentRegister')}>
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

