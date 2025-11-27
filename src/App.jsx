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

function RequireAuth() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading || isAuthenticated === null) return <OverlayLoader />;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" state={{ from: location }} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <SessionExpiredDialog /> {/* global dialog */}

      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route element={<RequireAuth />}>
          <Route path="/" element={<Navigate to="/dashboard/users" replace />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route path="users" element={<UserManagementPage />} />
            <Route path="events" element={<EventManagementPage />} />
            <Route path="admins" element={<AdminManagementPage />} />
            <Route path="knowledges" element={<KnowledgeSharingPage />} />
            <Route path="ceo" element={<CEOPage />} />
            <Route path="organization" element={<OrganizationChartPage />} />


          </Route>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}
