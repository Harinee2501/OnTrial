import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';

// Screens
import UserTypeScreen from '../screens/UserTypeScreen';
import HikerSignUpScreen from '../screens/HikerSignUpScreen';
import HikerLoginScreen from '../screens/HikerLoginScreen';
import AdminSignUpScreen from '../screens/AdminSignUpScreen';
import AdminLoginScreen from '../screens/AdminLoginScreen';
import HikeStartScreen from '../screens/HikeStartScreen';
import Trial from '../screens/Trial';  // Correct import for Trial component

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="UserType">
        <Stack.Screen name="UserType" component={UserTypeScreen} options={{ title: 'Select User Type' }} />
        <Stack.Screen name="HikerSignUp" component={HikerSignUpScreen} options={{ title: 'Hiker Sign Up' }} />
        <Stack.Screen name="HikerLogin" component={HikerLoginScreen} options={{ title: 'Hiker Login' }} />
        <Stack.Screen name="AdminSignUp" component={AdminSignUpScreen} options={{ title: 'Admin Sign Up' }} />
        <Stack.Screen name="AdminLogin" component={AdminLoginScreen} options={{ title: 'Admin Login' }} />
        <Stack.Screen name="HikeStart" component={HikeStartScreen} options={{ title: 'Start Hike' }} />
        <Stack.Screen name="Trial" component={Trial} options={{ title: 'Trail View' }}/> 
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
