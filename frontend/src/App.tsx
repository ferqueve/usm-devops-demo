import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthProvider';
import { useAuth } from '@/hooks/useAuth';
import RoleProtectedRoute from '@/components/auth/RoleProtectedRoute';
import RoleGuard from '@/components/auth/RoleGuard';
import { ROLES } from '@/lib/config/constants';
import { Toaster } from '@/components/ui/sonner';
import AuthPage from './app/auth/page';
import VerifyEmailPage from './app/auth/verify/page';
import ForgotPasswordPage from './app/auth/forgot-password/page';
import ResetPasswordPage from './app/auth/reset-password/page';
import { AuthCallbackSuccess } from './app/auth/callback-success';
import { AuthLayout } from './components/layouts/AuthLayout/AuthLayout';
import DashboardPage from './app/dashboard/page';
import CalendarPage from './app/calendar/page';
import ReservationsPage from './app/reservations/page';
import CreateReservationPage from './app/reservations/create/page';
import RoomsPage from './app/rooms/page';
import RoomDetailsPage from './app/rooms/[id]/page';
import StatisticsPage from './app/statistics/page';
import AsistentePage from './app/asistente/page';
import UsersPage from './app/users/page';
import SystemPage from './app/system/page';
import InventoryPage from './app/inventory/page';
import InventoryRequestsPage from './app/inventory/requests/page';
import AuditPage from './app/audit/page';
import MateriasPage from './app/materias/page';
import TutoriasPage from './app/tutorias/page';
import EventosPage from './app/eventos/page';
import SostenibilidadPage from './app/sostenibilidad/page';


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
        path="/auth/forgot-password" 
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : (
          <AuthLayout>
            <ForgotPasswordPage />
          </AuthLayout>
        )} 
      />
      
      <Route 
        path="/auth/reset-password" 
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : (
          <AuthLayout>
            <ResetPasswordPage />
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
        path="/reservations/create" 
        element={
          <RoleProtectedRoute>
            <CreateReservationPage />
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
        path="/rooms/:id" 
        element={
          <RoleProtectedRoute>
            <RoomDetailsPage />
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
        path="/asistente"
        element={
          <RoleProtectedRoute>
            <AsistentePage />
          </RoleProtectedRoute>
        }
      />
      
      <Route 
        path="/users" 
        element={
          <RoleProtectedRoute>
            <UsersPage />
          </RoleProtectedRoute>
        } 
      />
      
      <Route 
        path="/system" 
        element={
          <RoleGuard requiredRole={ROLES.ADMIN}>
            <SystemPage />
          </RoleGuard>
        } 
      />
      
      <Route 
        path="/inventory" 
        element={
          <RoleProtectedRoute>
            <InventoryPage />
          </RoleProtectedRoute>
        } 
      />

      <Route
        path="/inventory/requests"
        element={
          <RoleProtectedRoute>
            <InventoryRequestsPage />
          </RoleProtectedRoute>
        }
      />
      
      <Route
        path="/audit"
        element={
          <RoleGuard requiredRole={ROLES.ADMIN}>
            <AuditPage />
          </RoleGuard>
        }
      />

      {/* Capa académica */}
      <Route
        path="/materias"
        element={
          <RoleProtectedRoute>
            <MateriasPage />
          </RoleProtectedRoute>
        }
      />

      <Route
        path="/tutorias"
        element={
          <RoleProtectedRoute>
            <TutoriasPage />
          </RoleProtectedRoute>
        }
      />

      <Route
        path="/eventos"
        element={
          <RoleProtectedRoute>
            <EventosPage />
          </RoleProtectedRoute>
        }
      />

      <Route
        path="/sostenibilidad"
        element={
          <RoleProtectedRoute>
            <SostenibilidadPage />
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
        <Toaster />
      </Router>
    </AuthProvider>
  );
}

export default App;

