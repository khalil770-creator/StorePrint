import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AnalyticsDashboard    from '../screens/analytics/AnalyticsDashboard';
import StoreDrilldownScreen  from '../screens/analytics/StoreDrilldownScreen';
import TrendChartScreen      from '../screens/analytics/TrendChartScreen';
import AlertsScreen          from '../screens/analytics/AlertsScreen';
import KpiTargetsScreen      from '../screens/analytics/KpiTargetsScreen';

const Stack = createNativeStackNavigator();

export default function AnalyticsNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AnalyticsDashboard"  component={AnalyticsDashboard} />
      <Stack.Screen name="StoreDrilldown"      component={StoreDrilldownScreen} />
      <Stack.Screen name="TrendChart"          component={TrendChartScreen} />
      <Stack.Screen name="Alerts"              component={AlertsScreen} />
      <Stack.Screen name="KpiTargets"          component={KpiTargetsScreen} />
    </Stack.Navigator>
  );
}
