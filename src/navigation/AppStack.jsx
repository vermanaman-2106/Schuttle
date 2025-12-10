import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { StudentTabs } from './StudentTabs';
import { DriverTabs } from './DriverTabs';
import RideDetailsScreen from '../screens/student/RideDetailsScreen';

const Stack = createNativeStackNavigator();

export const AppStack = () => {
  const { user } = useAuthStore();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#121212' },
      }}>
      {user?.role === 'student' ? (
        <>
          <Stack.Screen name="StudentTabs" component={StudentTabs} />
          <Stack.Screen
            name="RideDetails"
            component={RideDetailsScreen}
            options={{
              headerShown: true,
              headerTitle: 'Ride Details',
              headerStyle: { backgroundColor: '#1A1D21' },
              headerTintColor: '#FFFFFF',
              headerBackTitle: '', // Remove back button text
              headerBackTitleVisible: false, // Hide back button text on iOS
            }}
          />
        </>
      ) : (
        <Stack.Screen name="DriverTabs" component={DriverTabs} />
      )}
    </Stack.Navigator>
  );
};
