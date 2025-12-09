import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import StudentLoginScreen from '../screens/auth/StudentLoginScreen';
import StudentRegisterScreen from '../screens/auth/StudentRegisterScreen';
import DriverLoginScreen from '../screens/auth/DriverLoginScreen';
import DriverRegisterScreen from '../screens/auth/DriverRegisterScreen';

const Stack = createNativeStackNavigator();

export const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#121212' },
      }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="StudentLogin" component={StudentLoginScreen} />
      <Stack.Screen name="StudentRegister" component={StudentRegisterScreen} />
      <Stack.Screen name="DriverLogin" component={DriverLoginScreen} />
      <Stack.Screen name="DriverRegister" component={DriverRegisterScreen} />
    </Stack.Navigator>
  );
};
