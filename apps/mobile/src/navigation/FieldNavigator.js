import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AttendanceScreen  from '../screens/field/AttendanceScreen';
import RosterScreen      from '../screens/field/RosterScreen';
import RosterDetailScreen from '../screens/field/RosterDetailScreen';
import LivePresenceScreen from '../screens/field/LivePresenceScreen';

const Stack = createNativeStackNavigator();

export default function FieldNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Attendance"   component={AttendanceScreen} />
      <Stack.Screen name="Roster"       component={RosterScreen} />
      <Stack.Screen name="RosterDetail" component={RosterDetailScreen} />
      <Stack.Screen name="LivePresence" component={LivePresenceScreen} />
    </Stack.Navigator>
  );
}
