import React from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';
import Login from './pages/Login.jsx';
import UserManagementPage from './pages/UserManagementPage.jsx';
import EventManagementPage from './pages/EventManagementPage.jsx';
import OverlayLoader from './components/OverlayLoader.jsx';
import AdminManagementPage from './pages/AdminManagementPage.jsx';
import SessionExpiredDialog from './components/SessionExpiredDiaglo.jsx';
import KnowledgeSharingPage from './pages/KnowledgeSharingPage.jsx';
import OrganizationChartPage from './pages/OrganizationChartPage.jsx';
import CEOPage from './pages/CEOPage.jsx';
import MouPartnerPage from './pages/MouPartnerPage.jsx';
import MemberDirectoryPage from './pages/MemberDirectoryPage.jsx';
import SeasonalPromotionPage from './pages/SeasonalPromotionPage.jsx';
import NewsLetterPage from './pages/NewsLetterPage.jsx';
import NonMemberPage from './pages/NonMemberPage.jsx';
import PartnerAccountManagementPage from './pages/PartnerAccountManagementPage.jsx';
import MemberVisitLogsPage from './pages/MemberVisitLogsPage.jsx';
import UploadSizeGuard from './components/UploadSizeGuard.jsx';

function RequireAuth() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading || isAuthenticated === null) return <OverlayLoader />;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" state={{ from: location }} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <SessionExpiredDialog />
      <UploadSizeGuard />

      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route element={<RequireAuth />}>
          <Route path="/" element={<Navigate to="/dashboard/users" replace />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route path="users" element={<UserManagementPage />} />
            <Route path="non-members" element={<NonMemberPage />} />
            <Route path="events" element={<EventManagementPage />} />
            <Route path="admins" element={<AdminManagementPage />} />
            <Route path="partner-accounts" element={<PartnerAccountManagementPage />} />
            <Route path="member-visit-logs" element={<MemberVisitLogsPage />} />
            <Route path="knowledges" element={<KnowledgeSharingPage />} />
            <Route path="ceo" element={<CEOPage />} />
            <Route path="organization" element={<OrganizationChartPage />} />
            <Route path="moupartner" element={<MouPartnerPage />} />
            <Route path="member-directory" element={<MemberDirectoryPage />} />
            <Route path="seasonal-promotion" element={<SeasonalPromotionPage />} />

            <Route path="newLetter" element={<NewsLetterPage />}/>



          </Route>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}
