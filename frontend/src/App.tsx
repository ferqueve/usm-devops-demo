import { Suspense } from 'react';
import { lazyConRecarga } from '@/lib/utils/lazyConRecarga';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AuthProvider } from '@/contexts/AuthProvider';
import { useAuth } from '@/hooks/useAuth';
import RoleProtectedRoute from '@/components/auth/RoleProtectedRoute';
import RoleGuard from '@/components/auth/RoleGuard';
import { ROLES } from '@/lib/config/constants';
import { Toaster } from '@/components/ui/sonner';
import AuthPage from './app/auth/page';
import { AuthLayout } from './components/layouts/AuthLayout/AuthLayout';

/**
 * Las pantallas se cargan por demanda. Importadas de golpe, el navegador se
 * bajaba el sistema entero en el primer render -- y, peor, corría los efectos
 * de módulo de cada pantalla: la precarga del dashboard disparaba diez
 * llamadas a la API en cualquier pantalla que abrieras, aunque no fueras al
 * dashboard.
 */
const VerifyEmailPage = lazyConRecarga(() => import('./app/auth/verify/page'));
const ForgotPasswordPage = lazyConRecarga(() => import('./app/auth/forgot-password/page'));
const ResetPasswordPage = lazyConRecarga(() => import('./app/auth/reset-password/page'));
const AuthCallbackSuccess = lazyConRecarga(() =>
  import('./app/auth/callback-success').then((m) => ({ default: m.AuthCallbackSuccess }))
);
const DashboardPage = lazyConRecarga(() => import('./app/dashboard/page'));
const CalendarPage = lazyConRecarga(() => import('./app/calendar/page'));
const ReservationsPage = lazyConRecarga(() => import('./app/reservations/page'));
const CreateReservationPage = lazyConRecarga(() => import('./app/reservations/create/page'));
const RoomsPage = lazyConRecarga(() => import('./app/rooms/page'));
const RoomDetailsPage = lazyConRecarga(() => import('./app/rooms/[id]/page'));
const StatisticsPage = lazyConRecarga(() => import('./app/statistics/page'));
const PrediccionesPage = lazyConRecarga(() => import('./app/predicciones/page'));
const AsistentePage = lazyConRecarga(() => import('./app/asistente/page'));
const UsersPage = lazyConRecarga(() => import('./app/users/page'));
const SystemPage = lazyConRecarga(() => import('./app/system/page'));
const InventoryPage = lazyConRecarga(() => import('./app/inventory/page'));
const InventoryRequestsPage = lazyConRecarga(() => import('./app/inventory/requests/page'));
const ConfiguracionPage = lazyConRecarga(() => import('./app/configuracion/page'));
const AuditPage = lazyConRecarga(() => import('./app/audit/page'));
const MateriasPage = lazyConRecarga(() => import('./app/materias/page'));
const MateriasMapaPage = lazyConRecarga(() => import('./app/materias/mapa/page'));
const MateriaDetailPage = lazyConRecarga(() => import('./app/materias/[id]/page'));
const TutoriaDetailPage = lazyConRecarga(() => import('./app/tutorias/[id]/page'));
const EventosPage = lazyConRecarga(() => import('./app/eventos/page'));
const EventoDetailPage = lazyConRecarga(() => import('./app/eventos/[id]/page'));
const SostenibilidadPage = lazyConRecarga(() => import('./app/sostenibilidad/page'));

/** Lo que se ve mientras baja el chunk de la pantalla. */
function PantallaCargando() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted dark:bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}


// Componente principal de rutas
function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Suspense fallback={<PantallaCargando />}>
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
        path="/predicciones"
        element={
          <RoleProtectedRoute>
            <PrediccionesPage />
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
        path="/configuracion"
        element={
          <RoleProtectedRoute>
            <ConfiguracionPage />
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
        path="/materias/mapa"
        element={
          <RoleProtectedRoute>
            <MateriasMapaPage />
          </RoleProtectedRoute>
        }
      />

      <Route
        path="/materias/:id"
        element={
          <RoleProtectedRoute>
            <MateriaDetailPage />
          </RoleProtectedRoute>
        }
      />

      {/*
        Tutorías dejó de ser sección propia: ahora es una pestaña dentro de Materias,
        porque una tutoría siempre cuelga de una materia. La ruta vieja se mantiene
        redirigiendo para no romper links guardados ni el historial de nadie.
      */}
      <Route path="/tutorias" element={<Navigate to="/materias?tab=tutorias" replace />} />

      <Route
        path="/tutorias/:id"
        element={
          <RoleProtectedRoute>
            <TutoriaDetailPage />
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
        path="/eventos/:id"
        element={
          <RoleProtectedRoute>
            <EventoDetailPage />
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
    </Suspense>
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

