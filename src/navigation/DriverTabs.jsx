import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DriverHomeScreen from '../screens/driver/DriverHomeScreen';
import CreateRideScreen from '../screens/driver/CreateRideScreen';
import DriverBookingsScreen from '../screens/driver/DriverBookingsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();

export const DriverTabs = () => {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.cardBackground,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: Math.max(insets.bottom, 12),
          paddingTop: 8,
          height: 70 + insets.bottom,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        tabBarHideOnKeyboard: true,
        tabBarShowLabel: true,
      })}>
      <Tab.Screen
        name="Home"
        component={DriverHomeScreen}
        options={{
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons 
              name={focused ? "car" : "car-outline"} 
              size={focused ? 26 : 24} 
              color={color} 
            />
          ),
        }}
      />
      <Tab.Screen
        name="CreateRide"
        component={CreateRideScreen}
        options={{
          tabBarLabel: 'Create',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons 
              name={focused ? "add-circle" : "add-circle-outline"} 
              size={focused ? 28 : 26} 
              color={color} 
            />
          ),
        }}
      />
      <Tab.Screen
        name="Bookings"
        component={DriverBookingsScreen}
        options={{
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons 
              name={focused ? "list" : "list-outline"} 
              size={focused ? 26 : 24} 
              color={color} 
            />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons 
              name={focused ? "person" : "person-outline"} 
              size={focused ? 26 : 24} 
              color={color} 
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
