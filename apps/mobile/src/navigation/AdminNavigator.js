import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Existing admin screens
import AdminDashboard    from '../screens/admin/AdminDashboard';
import UsersListScreen   from '../screens/admin/users/UsersListScreen';
import UserDetailScreen  from '../screens/admin/users/UserDetailScreen';
import RolesScreen       from '../screens/admin/roles/RolesScreen';
import StoresListScreen  from '../screens/admin/stores/StoresListScreen';
import StoreDetailScreen  from '../screens/admin/stores/StoreDetailScreen';
import StoreCreateScreen  from '../screens/admin/stores/StoreCreateScreen';

// Audit Template Builder
import AuditTemplatesScreen       from '../screens/admin/auditing/AuditTemplatesScreen';
import AuditTemplateBuilderScreen from '../screens/admin/auditing/AuditTemplateBuilderScreen';

// Environment Checklist Builder
import EnvChecklistsAdminScreen  from '../screens/admin/environment/EnvChecklistsAdminScreen';
import EnvChecklistBuilderScreen from '../screens/admin/environment/EnvChecklistBuilderScreen';

// CX Survey Builder
import SurveysAdminScreen from '../screens/admin/cx/SurveysAdminScreen';
import SurveyBuilderScreen from '../screens/admin/cx/SurveyBuilderScreen';

// Training Course Builder
import CoursesAdminScreen        from '../screens/admin/training/CoursesAdminScreen';
import CourseBuilderScreen       from '../screens/admin/training/CourseBuilderScreen';
import CourseModuleBuilderScreen from '../screens/admin/training/CourseModuleBuilderScreen';

const Stack = createNativeStackNavigator();

export default function AdminNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Dashboard */}
      <Stack.Screen name="AdminDashboard"  component={AdminDashboard} />

      {/* Users */}
      <Stack.Screen name="UsersList"       component={UsersListScreen} />
      <Stack.Screen name="UserDetail"      component={UserDetailScreen} />

      {/* Roles */}
      <Stack.Screen name="Roles"           component={RolesScreen} />

      {/* Stores */}
      <Stack.Screen name="StoresList"      component={StoresListScreen} />
      <Stack.Screen name="StoreDetail"     component={StoreDetailScreen} />
      <Stack.Screen name="StoreCreate"     component={StoreCreateScreen} />

      {/* Audit Template Builder */}
      <Stack.Screen name="AuditTemplates"       component={AuditTemplatesScreen} />
      <Stack.Screen name="AuditTemplateBuilder" component={AuditTemplateBuilderScreen} />

      {/* Environment Checklist Builder */}
      <Stack.Screen name="EnvChecklists"       component={EnvChecklistsAdminScreen} />
      <Stack.Screen name="EnvChecklistBuilder" component={EnvChecklistBuilderScreen} />

      {/* CX Survey Builder */}
      <Stack.Screen name="SurveysAdmin"   component={SurveysAdminScreen} />
      <Stack.Screen name="SurveyBuilder"  component={SurveyBuilderScreen} />

      {/* Training Course Builder */}
      <Stack.Screen name="CoursesAdmin"          component={CoursesAdminScreen} />
      <Stack.Screen name="CourseBuilder"         component={CourseBuilderScreen} />
      <Stack.Screen name="CourseModuleBuilder"   component={CourseModuleBuilderScreen} />
    </Stack.Navigator>
  );
}
