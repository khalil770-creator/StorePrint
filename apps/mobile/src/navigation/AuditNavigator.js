import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuditDashboard       from '../screens/auditing/AuditDashboard';
import AuditFormScreen      from '../screens/auditing/AuditFormScreen';
import AuditReportScreen    from '../screens/auditing/AuditReportScreen';
import CorrectiveActions    from '../screens/auditing/CorrectiveActionsScreen';

const Stack = createNativeStackNavigator();

export default function AuditNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AuditDashboard"    component={AuditDashboard} />
      <Stack.Screen name="AuditForm"         component={AuditFormScreen} />
      <Stack.Screen name="AuditReport"       component={AuditReportScreen} />
      <Stack.Screen name="CorrectiveActions" component={CorrectiveActions} />
    </Stack.Navigator>
  );
}
