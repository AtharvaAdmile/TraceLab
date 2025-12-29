import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Landing
import LandingPage from './pages/Landing/LandingPage';

// Auth
import { LoginPage, SignupPage, VerifyEmailPage, ForgotPasswordPage } from './pages/Auth';

// Dashboard & Features
import DashboardPage from './pages/DashboardPage';
import RequirementsPage from './pages/RequirementsPage';
import TestCasesPage from './pages/TestCasesPage';
import TraceabilityPage from './pages/TraceabilityPage';
import CompliancePage from './pages/CompliancePage';

// Profile
import ProfilePage from './pages/Profile/ProfilePage';
import SettingsPage from './pages/Profile/SettingsPage';
import HistoryPage from './pages/Profile/HistoryPage';

import './App.css';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Auth Routes */}
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/signup" element={<SignupPage />} />
        <Route path="/auth/verify-email" element={<VerifyEmailPage />} />
        <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/requirements"
          element={
            <ProtectedRoute>
              <RequirementsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/test-cases"
          element={
            <ProtectedRoute>
              <TestCasesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/traceability"
          element={
            <ProtectedRoute>
              <TraceabilityPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/compliance"
          element={
            <ProtectedRoute>
              <CompliancePage />
            </ProtectedRoute>
          }
        />

        {/* Profile Routes */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <HistoryPage />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
