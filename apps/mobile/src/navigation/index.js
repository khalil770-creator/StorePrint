import React from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../store/authStore';
import { usePermissions, TAB_MODULES } from '../utils/permissions';
import { colors } from '../constants/theme';

import LoginScreen        from '../screens/auth/LoginScreen';
import AdminNavigator     from './AdminNavigator';
import AuditNavigator     from './AuditNavigator';
import FieldNavigator     from './FieldNavigator';
import BrandHubScreen     from '../screens/brand-hub/BrandHubScreen';
import StoreOpsNavigator  from './StoreOpsNavigator';
import AnalyticsNavigator from './AnalyticsNavigator';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

const TAB_ICONS = {
  BrandHub: '🎨', Auditing: '✅', Field: '📍',
  StoreOps: '🏬', Admin: '⚙️', Analytics: '📊',
};

const TABS = [
  { name: 'BrandHub',  component: BrandHubScreen,     title: 'Brand Hub'  },
  { name: 'Auditing',  component: AuditNavigator,     title: 'Audits'     },
  { name: 'Field',     component: FieldNavigator,     title: 'Attendance' },
  { name: 'StoreOps',  component: StoreOpsNavigator,  title: 'Store Ops'  },
  { name: 'Admin',     component: AdminNavigator,     title: 'Admin'      },
  { name: 'Analytics', component: AnalyticsNavigator, title: 'Analytics'  },
];

function MainTabs() {
  const { canAccessTab } = usePermissions();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const allowed = canAccessTab(route.name);
        const icon    = TAB_ICONS[route.name];

        return {
          headerShown: false,
          tabBarActiveTintColor:   allowed ? colors.primary : colors.lightGrey,
          tabBarInactiveTintColor: allowed ? colors.lightGrey : '#D1D5DB',
          tabBarStyle: {
            borderTopColor: colors.border,
            backgroundColor: colors.white,
            height: 60,
            paddingBottom: 8,
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
          tabBarIcon: ({ focused }) => (
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 20, opacity: allowed ? (focused ? 1 : 0.4) : 0.2 }}>
                {icon}
              </Text>
              {!allowed && (
                <Text style={{ fontSize: 7, color: '#EF4444', fontWeight: '700', marginTop: -2 }}>
                  LOCKED
                </Text>
              )}
            </View>
          ),
          // Intercept press on locked tabs
          tabBarButton: allowed ? undefined : (props) => (
            <TouchableOpacity
              {...props}
              onPress={() => {
                if (typeof alert !== 'undefined') {
                  alert(`Access Restricted\n\nYou don't have permission to access this section. Contact your administrator.`);
                }
              }}
              style={[props.style, { opacity: 0.45 }]}
            />
          ),
        };
      }}
    >
      {TABS.map(tab => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component}
          options={{ title: tab.title }}
        />
      ))}
    </Tab.Navigator>
  );
}

export default function Navigation() {
  const { user, isLoading } = useAuthStore();
  if (isLoading) return null;
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user
          ? <Stack.Screen name="Login" component={LoginScreen} />
          : <Stack.Screen name="Main"  component={MainTabs}   />
        }
      </Stack.Navigator>
    </NavigationContainer>
  );
}
