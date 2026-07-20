import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import StoreOpsDashboard    from '../screens/store-ops/StoreOpsDashboard';
import CampaignFeedScreen   from '../screens/campaigns/CampaignFeedScreen';
import CampaignDetailScreen from '../screens/campaigns/CampaignDetailScreen';
import CampaignConfirmScreen from '../screens/campaigns/CampaignConfirmScreen';
import VMDashboardScreen    from '../screens/vm/VMDashboardScreen';
import VMTaskScreen         from '../screens/vm/VMTaskScreen';
import SignageLibraryScreen from '../screens/signage/SignageLibraryScreen';
import SignageDetailScreen  from '../screens/signage/SignageDetailScreen';
import PrintRequestScreen   from '../screens/signage/PrintRequestScreen';
import InstallationScreen   from '../screens/signage/InstallationScreen';

// Phase 3 — Training
import TrainingDashboardScreen from '../screens/training/TrainingDashboardScreen';
import TrainingCourseScreen    from '../screens/training/TrainingCourseScreen';
import TrainingModuleScreen    from '../screens/training/TrainingModuleScreen';
import CertificationsScreen    from '../screens/training/CertificationsScreen';

// Phase 3 — Store Environment
import EnvironmentDashboardScreen  from '../screens/environment/EnvironmentDashboardScreen';
import EnvironmentChecklistScreen  from '../screens/environment/EnvironmentChecklistScreen';
import EnvironmentIssuesScreen     from '../screens/environment/EnvironmentIssuesScreen';

// Phase 3 — Customer Experience
import CXDashboardScreen       from '../screens/cx/CXDashboardScreen';
import CXSurveysScreen         from '../screens/cx/CXSurveysScreen';
import CXSurveyDetailScreen    from '../screens/cx/CXSurveyDetailScreen';
import CXConductSurveyScreen   from '../screens/cx/CXConductSurveyScreen';
import CXReviewsScreen         from '../screens/cx/CXReviewsScreen';

const Stack = createNativeStackNavigator();

export default function StoreOpsNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="StoreOpsDashboard"  component={StoreOpsDashboard} />

      {/* Phase 1 & 2 */}
      <Stack.Screen name="CampaignFeed"        component={CampaignFeedScreen} />
      <Stack.Screen name="CampaignDetail"      component={CampaignDetailScreen} />
      <Stack.Screen name="CampaignConfirm"     component={CampaignConfirmScreen} />
      <Stack.Screen name="VMDashboard"         component={VMDashboardScreen} />
      <Stack.Screen name="VMTask"              component={VMTaskScreen} />
      <Stack.Screen name="SignageLibrary"      component={SignageLibraryScreen} />
      <Stack.Screen name="SignageDetail"       component={SignageDetailScreen} />
      <Stack.Screen name="PrintRequest"        component={PrintRequestScreen} />
      <Stack.Screen name="Installation"        component={InstallationScreen} />

      {/* Phase 3 — Training */}
      <Stack.Screen name="TrainingDashboard"   component={TrainingDashboardScreen} />
      <Stack.Screen name="TrainingCourse"      component={TrainingCourseScreen} />
      <Stack.Screen name="TrainingModule"      component={TrainingModuleScreen} />
      <Stack.Screen name="Certifications"      component={CertificationsScreen} />

      {/* Phase 3 — Environment */}
      <Stack.Screen name="EnvironmentDashboard"  component={EnvironmentDashboardScreen} />
      <Stack.Screen name="EnvironmentChecklist"  component={EnvironmentChecklistScreen} />
      <Stack.Screen name="EnvironmentIssues"     component={EnvironmentIssuesScreen} />

      {/* Phase 3 — Customer Experience */}
      <Stack.Screen name="CXDashboard"         component={CXDashboardScreen} />
      <Stack.Screen name="CXSurveys"           component={CXSurveysScreen} />
      <Stack.Screen name="CXSurveyDetail"      component={CXSurveyDetailScreen} />
      <Stack.Screen name="CXConductSurvey"     component={CXConductSurveyScreen} />
      <Stack.Screen name="CXReviews"           component={CXReviewsScreen} />
    </Stack.Navigator>
  );
}
