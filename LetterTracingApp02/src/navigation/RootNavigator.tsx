// src/navigation/RootNavigator.tsx

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import LetterMenuScreen from '../screens/LetterMenuScreen';
import TracingScreen from '../screens/TracingScreen';
import ComingSoonScreen from '../screens/ComingSoonScreen';
import GuidedTracingScreen from '../screens/GuidedTracingScreen';
import LetterGuidingMenuScreen from '../screens/LetterGuidingMenuScreen';

export type RootStackParamList = {
  Home: undefined;
  LetterMenu: undefined;
  LetterGuidingMenu: undefined;
  Tracing: { letter: string };
  ComingSoon: { title: string };
  GuidedTracing: { letter: string; letterCase: 'uppercase' | 'lowercase' };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="LetterMenu" component={LetterMenuScreen} />
      <Stack.Screen name="LetterGuidingMenu" component={LetterGuidingMenuScreen} />
      <Stack.Screen name="Tracing" component={TracingScreen} />
      <Stack.Screen name="ComingSoon" component={ComingSoonScreen} />
      <Stack.Screen name="GuidedTracing" component={GuidedTracingScreen} />
    </Stack.Navigator>
  );
}
