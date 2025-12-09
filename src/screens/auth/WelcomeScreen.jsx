import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '../../theme/colors';
import { Button } from '../../components/Button';

export default function WelcomeScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Schuttle</Text>
        <Text style={styles.subtitle}>Ride Sharing for MUJ</Text>
        <Text style={styles.description}>
          Book seats or create rides for your journey
        </Text>

        <View style={styles.buttonContainer}>
          <Button
            title="I'm a Student"
            onPress={() => navigation.navigate('StudentLogin')}
            variant="primary"
            style={styles.button}
          />
          <Button
            title="I'm a Driver"
            onPress={() => navigation.navigate('DriverLogin')}
            variant="secondary"
            style={styles.button}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  content: {
    alignItems: 'center',
  },
  title: {
    ...typography.h1,
    color: colors.accent,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  buttonContainer: {
    width: '100%',
    gap: spacing.md,
  },
  button: {
    width: '100%',
  },
});

