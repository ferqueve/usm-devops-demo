import { LoginForm } from '@/components/public/auth/LoginForm';
import { RegisterForm } from '@/components/public/auth/RegisterForm';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

export default function AuthPage() {
  const { login, register, isAuthenticated, isLoading, error, registrationSuccess, setRegistrationSuccess, lastRegisteredEmail } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Estado para controlar la animación
  const [currentView, setCurrentView] = useState<'login' | 'register'>('login');
  const [isAnimating, setIsAnimating] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Detectar si el error es relacionado con OAuth
  const isOAuthError = error && (
    error.includes('vinculada con Google') || 
    error.includes('Google') ||
    error.includes('OAuth')
  );

  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';
    window.location.href = `${apiUrl.replace('/api/v1', '')}/api/v1/oauth2/google/authorize`;
  };

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Determinar qué componente mostrar basado en la ruta
  const isRegisterRoute = location.pathname === '/auth/register';
  
  // Función para volver al login
  const handleBackToLogin = () => {
    // Iniciar animación de salida del mensaje
    setIsAnimating(true);
    
    // Después de la animación, cambiar a login
    setTimeout(() => {
      setRegistrationSuccess(false);
      setCurrentView('login');
      setIsAnimating(false);
      navigate('/auth');
    }, 200);
  };
  
  // Manejar cambio de vista con animación
  useEffect(() => {
    // Si hay registro exitoso, no cambiar la vista
    if (registrationSuccess) {
      setCurrentView('register');
      return;
    }
    
    const targetView = isRegisterRoute ? 'register' : 'login';
    
    if (targetView !== currentView) {
      // Iniciar animación de salida
      setIsAnimating(true);
      
      // Después de 200ms (duración de la animación), cambiar la vista
      setTimeout(() => {
        setCurrentView(targetView);
        setIsAnimating(false);
      }, 200);
    }
  }, [isRegisterRoute, currentView, registrationSuccess]);

  return (
    <>
      {/* Mostrar error si existe (solo si no hay registro exitoso) */}
      {error && !registrationSuccess && (
        <div className={`rounded-md p-4 mb-4 ${
          isOAuthError 
            ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' 
            : 'bg-destructive/10 border border-destructive/20'
        }`}>
          <p className={`text-sm mb-3 ${
            isOAuthError 
              ? 'text-blue-900 dark:text-blue-100' 
              : 'text-destructive'
          }`}>
            {error}
          </p>
          {isOAuthError && currentView === 'login' && (
            <Button
              variant="outline"
              onClick={handleGoogleLogin}
              disabled={googleLoading || isLoading}
              className="w-full"
            >
              <img src="/google-icon.svg" alt="Google" className="h-4 w-4 mr-2" />
              {googleLoading ? "Autenticando..." : "Iniciar sesión con Google"}
            </Button>
          )}
        </div>
      )}
      
      {/* Componente con animación controlada */}
      <div
        className={`transition-opacity duration-200 ease-in-out ${
          isAnimating ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {currentView === 'register' ? (
          <RegisterForm 
            onRegister={register} 
            isLoading={isLoading}
            showSuccessMessage={registrationSuccess}
            userEmail={lastRegisteredEmail}
            onBackToLogin={handleBackToLogin}
            onResendEmail={async () => {
              // Esta función se manejará desde el RegisterForm
            }}
          />
        ) : (
          <LoginForm 
            onLogin={login} 
            isLoading={isLoading}
          />
        )}
      </div>
    </>
  );
}

