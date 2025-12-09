import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { colors, spacing, typography } from '../../theme/colors';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { registerStudent } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';

const validationSchema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
  email: Yup.string()
    .email('Invalid email')
    .required('Email is required')
    .test('muj-email', 'Must be a MUJ email (@muj.manipal.edu or @jaipur.manipal.edu)', (value) =>
      value?.endsWith('@muj.manipal.edu') || value?.endsWith('@jaipur.manipal.edu') || false
    ),
  phone: Yup.string().required('Phone number is required'),
  password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  registrationNumber: Yup.string(),
  department: Yup.string(),
});

export default function StudentRegisterScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { login } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handleRegister = async (values) => {
    try {
      setLoading(true);
      const response = await registerStudent(values);
      
      if (response.success && response.user) {
        await login(response.token, {
          id: response.user.id,
          name: response.user.name,
          email: response.user.email,
          phone: response.user.phone,
          role: 'student',
          registrationNumber: response.user.registrationNumber,
          department: response.user.department,
        });
      }
    } catch (error) {
      let errorMessage = 'Registration failed. Please check your details and try again.';
      
      // Timeout error
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        errorMessage = 'Request timed out. Please check:\n1. Backend server is running\n2. Your internet connection\n3. API URL is correct (check axios.js)\n4. For physical device, ensure you\'re on the same network';
      }
      // Network error (backend not reachable)
      else if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
        errorMessage = 'Cannot connect to server. Please check:\n1. Backend server is running\n2. Correct API URL in axios.js\n3. For physical device, use your computer IP address instead of localhost';
      }
      // HTTP error response
      else if (error.response) {
        const status = error.response.status;
        if (status === 403) {
          errorMessage = 'Access forbidden. Please check:\n1. Backend server is running\n2. CORS is configured correctly\n3. API URL is correct';
        } else if (status === 400) {
          // Check for validation errors array (from express-validator)
          if (error.response.data.errors && error.response.data.errors.length > 0) {
            errorMessage = error.response.data.errors.map(err => err.msg || err.message).join('\n');
          } 
          // Check for single error message
          else if (error.response.data.message) {
            errorMessage = error.response.data.message;
          }
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } 
      // Other errors
      else if (error.message) {
        errorMessage = error.message;
      }
      
      console.error('Registration error:', error);
      Alert.alert('Registration Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.xxl }]}>
      <Text style={styles.title}>Student Register</Text>
      <Text style={styles.subtitle}>Create your account with MUJ email</Text>

      <Formik
        initialValues={{
          name: '',
          email: '',
          phone: '',
          password: '',
          registrationNumber: '',
          department: '',
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
              placeholder="your.name@muj.manipal.edu or @jaipur.manipal.edu"
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
              label="Registration Number (Optional)"
              placeholder="e.g., 2430030314"
              value={values.registrationNumber}
              onChangeText={handleChange('registrationNumber')}
              onBlur={handleBlur('registrationNumber')}
              error={
                touched.registrationNumber && errors.registrationNumber
                  ? errors.registrationNumber
                  : undefined
              }
            />
            <Input
              label="Department (Optional)"
              placeholder="e.g., CSE, ECE"
              value={values.department}
              onChangeText={handleChange('department')}
              onBlur={handleBlur('department')}
              error={touched.department && errors.department ? errors.department : undefined}
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

      <TouchableOpacity onPress={() => navigation.navigate('StudentLogin')}>
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

