import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, typography, borderRadius } from '../theme/colors';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useAuthStore } from '../store/authStore';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout, refreshUser } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  // Refresh user data when screen comes into focus (e.g., after MongoDB Compass changes)
  useFocusEffect(
    useCallback(() => {
      // Refresh user data silently when screen is focused
      refreshUser().catch((err) => {
        console.error('Error refreshing user on focus:', err);
      });
    }, [refreshUser])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshUser();
    } catch (error) {
      console.error('Error refreshing user:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshUser]);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  if (!user) {
    return null;
  }

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={[styles.content, { paddingBottom: 90 }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
      }>
      <View style={[styles.header, { paddingTop: insets.top + spacing.xl }]}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={48} color={colors.accent} />
        </View>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.role}>{user.role.toUpperCase()}</Text>
      </View>

      <Card>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        <View style={styles.infoRow}>
          <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
          <Text style={styles.infoText}>{user.email}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="call-outline" size={20} color={colors.textSecondary} />
          <Text style={styles.infoText}>{user.phone}</Text>
        </View>
        {user.registrationNumber && (
          <View style={styles.infoRow}>
            <Ionicons name="school-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.infoText}>Reg: {user.registrationNumber}</Text>
          </View>
        )}
        {user.department && (
          <View style={styles.infoRow}>
            <Ionicons name="business-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.infoText}>{user.department}</Text>
          </View>
        )}
        {user.vehicleModel && (
          <>
            <View style={styles.infoRow}>
              <Ionicons name="car-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.infoText}>{user.vehicleModel}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="card-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.infoText}>{user.vehicleNumber}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="people-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.infoText}>{user.totalSeats} seats</Text>
            </View>
            {user.verified !== undefined && (
              <View style={styles.infoRow}>
                <Ionicons
                  name={user.verified ? 'checkmark-circle' : 'close-circle'}
                  size={20}
                  color={user.verified ? colors.success : colors.warning}
                />
                <Text style={styles.infoText}>
                  {user.verified ? 'Verified Driver' : 'Pending Verification'}
                </Text>
              </View>
            )}
          </>
        )}
      </Card>

      <Button
        title="Logout"
        onPress={handleLogout}
        variant="secondary"
        style={styles.logoutButton}
      />
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
    paddingTop: 0,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  name: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  role: {
    ...typography.body,
    color: colors.accent,
    fontWeight: '600',
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
    paddingVertical: spacing.xs,
  },
  infoText: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
  },
  logoutButton: {
    marginTop: spacing.xxl,
    marginBottom: spacing.lg,
  },
});

