import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './store/authStore'
import Layout from './components/Layout'

import LoginPage         from './pages/Login'
import DashboardPage     from './pages/Dashboard'
import UsersListPage     from './pages/users/UsersList'
import UserCreatePage    from './pages/users/UserCreate'
import UserDetailPage    from './pages/users/UserDetail'
import StoresListPage    from './pages/stores/StoresList'
import StoreDetailPage   from './pages/stores/StoreDetail'
import StoreCreatePage   from './pages/stores/StoreCreate'
import RolesPage         from './pages/roles/RolesPage'
import AuditTemplates    from './pages/auditing/AuditTemplates'
import AuditBuilder      from './pages/auditing/AuditBuilder'
import AuditDetail       from './pages/auditing/AuditDetail'
import EnvChecklists     from './pages/environment/EnvChecklists'
import EnvBuilder        from './pages/environment/EnvBuilder'
import SurveysList       from './pages/cx/SurveysList'
import SurveyBuilder     from './pages/cx/SurveyBuilder'
import CoursesList       from './pages/training/CoursesList'
import CourseBuilder     from './pages/training/CourseBuilder'
import BrandHubPage      from './pages/brand-hub/BrandHubPage'
import CampaignsList     from './pages/campaigns/CampaignsList'
import CampaignBuilder   from './pages/campaigns/CampaignBuilder'
import VMPage            from './pages/vm/VMPage'
import RosterPage        from './pages/field/RosterPage'
import FieldAttendancePage from './pages/field/FieldAttendancePage'
import SignagePage       from './pages/signage/SignagePage'
import SettingsPage      from './pages/system/Settings'

function RequireAuth({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/admin/login" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/admin/login" element={<LoginPage />} />
          <Route path="/admin/*" element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }>
            <Route index element={<DashboardPage />} />
            <Route path="users" element={<UsersListPage />} />
            <Route path="users/new" element={<UserCreatePage />} />
            <Route path="users/:id" element={<UserDetailPage />} />
            <Route path="stores" element={<StoresListPage />} />
            <Route path="stores/new" element={<StoreCreatePage />} />
            <Route path="stores/:id" element={<StoreDetailPage />} />
            <Route path="roles" element={<RolesPage />} />
            <Route path="audit-templates" element={<AuditTemplates />} />
            <Route path="audit-templates/:id" element={<AuditBuilder />} />
            <Route path="audit-templates/new" element={<AuditBuilder />} />
            <Route path="audits/:id" element={<AuditDetail />} />
            <Route path="env-checklists" element={<EnvChecklists />} />
            <Route path="env-checklists/:id" element={<EnvBuilder />} />
            <Route path="env-checklists/new" element={<EnvBuilder />} />
            <Route path="surveys" element={<SurveysList />} />
            <Route path="surveys/:id" element={<SurveyBuilder />} />
            <Route path="surveys/new" element={<SurveyBuilder />} />
            <Route path="courses" element={<CoursesList />} />
            <Route path="courses/:id" element={<CourseBuilder />} />
            <Route path="courses/new" element={<CourseBuilder />} />
            <Route path="brand-hub" element={<BrandHubPage />} />
            <Route path="campaigns" element={<CampaignsList />} />
            <Route path="campaigns/new" element={<CampaignBuilder />} />
            <Route path="campaigns/:id" element={<CampaignBuilder />} />
            <Route path="vm" element={<VMPage />} />
            <Route path="roster" element={<RosterPage />} />
            <Route path="field-attendance" element={<FieldAttendancePage />} />
            <Route path="signage" element={<SignagePage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
