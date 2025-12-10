import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { AuthStack } from './AuthStack';
import { AppStack } from './AppStack';
import { colors } from '../theme/colors';
import { registerForPushNotifications, setupNotificationListeners } from '../services/notifications';

export const RootNavigator = () => {
  const { isAuthenticated, isLoading, restoreSession } = useAuthStore();

  useEffect(() => {
    restoreSession();
  }, []);

  // Register for push notifications when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Register for push notifications
      registerForPushNotifications().catch((error) => {
        console.error('Error registering for push notifications:', error);
      });

      // Set up notification listeners
      const cleanup = setupNotificationListeners(
        (notification) => {
          console.log('Notification received:', notification);
        },
        (response) => {
          console.log('Notification tapped:', response);
          // You can navigate to specific screens based on notification data
          const data = response.notification.request.content.data;
          if (data.type === 'new_booking' || data.type === 'booking_confirmed' || data.type === 'booking_rejected' || data.type === 'booking_cancelled') {
            // Navigate to bookings screen or specific booking
            // navigation.navigate('Bookings');
          }
        }
      );

      return cleanup;
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
    <NavigationContainer>
      {isAuthenticated ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
