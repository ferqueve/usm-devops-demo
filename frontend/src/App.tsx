import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { RoleProtectedRoute } from '@/components/auth';
import AuthPage from './app/public/auth/page';
import VerifyEmailPage from './app/auth/verify/page';
import { AuthCallbackSuccess } from './pages/auth/AuthCallbackSuccess';
import { AuthLayout } from './components/layouts';
import DashboardPage from './app/dashboard/page';
import CalendarPage from './app/calendar/page';
import ReservationsPage from './app/reservations/page';
import RoomsPage from './app/rooms/page';
import StatisticsPage from './app/statistics/page';
import SettingsPage from './app/settings/page';


// Componente principal de rutas
function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Rutas de autenticación */}
      <Route 
        path="/auth" 
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : (
          <AuthLayout>
            <AuthPage />
          </AuthLayout>
        )} 
      />
      <Route 
        path="/auth/register" 
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : (
          <AuthLayout>
            <AuthPage />
          </AuthLayout>
        )} 
      />
      
      <Route 
        path="/auth/verify" 
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : (
          <AuthLayout>
            <VerifyEmailPage />
          </AuthLayout>
        )} 
      />
      
      <Route 
        path="/auth/callback/success" 
        element={<AuthCallbackSuccess />} 
      />
      
      {/* Rutas protegidas del dashboard */}
      <Route 
        path="/dashboard" 
        element={
          <RoleProtectedRoute>
            <DashboardPage />
          </RoleProtectedRoute>
        } 
      />
      
      <Route 
        path="/calendar" 
        element={
          <RoleProtectedRoute>
            <CalendarPage />
          </RoleProtectedRoute>
        } 
      />
      
      <Route 
        path="/reservations" 
        element={
          <RoleProtectedRoute>
            <ReservationsPage />
          </RoleProtectedRoute>
        } 
      />
      
      <Route 
        path="/rooms" 
        element={
          <RoleProtectedRoute>
            <RoomsPage />
          </RoleProtectedRoute>
        } 
      />
      
      <Route 
        path="/statistics" 
        element={
          <RoleProtectedRoute>
            <StatisticsPage />
          </RoleProtectedRoute>
        } 
      />
      
      <Route 
        path="/settings" 
        element={
          <RoleProtectedRoute>
            <SettingsPage />
          </RoleProtectedRoute>
        } 
      />
      
      {/* Ruta raíz - redirección inteligente */}
      <Route 
        path="/" 
        element={<Navigate to={isAuthenticated ? "/dashboard" : "/auth"} replace />} 
      />
      
      {/* Ruta 404 - redirigir a dashboard si autenticado, sino a auth */}
      <Route 
        path="*" 
        element={<Navigate to={isAuthenticated ? "/dashboard" : "/auth"} replace />} 
      />
    </Routes>
  );
}

// Componente principal de la aplicación
function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
