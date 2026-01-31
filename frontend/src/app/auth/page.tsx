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
  
  // Función para leer error de la URL - leer ANTES de que React Router lo procese
  const readErrorFromURL = () => {
    // Leer del href completo para capturar parámetros incluso si React Router los perdió
    const fullUrl = window.location.href;
    const urlObj = new URL(fullUrl);
    const errorParam = urlObj.searchParams.get('error');
    if (errorParam) {
      try {
        return decodeURIComponent(errorParam);
      } catch {
        return errorParam;
      }
    }
    // También intentar leer de window.location.search directamente
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam2 = urlParams.get('error');
    if (errorParam2) {
      try {
        return decodeURIComponent(errorParam2);
      } catch {
        return errorParam2;
      }
    }
    return null;
  };
  
  // Estado para controlar la animación
  const [currentView, setCurrentView] = useState<'login' | 'register'>('login');
  const [isAnimating, setIsAnimating] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  // Inicializar con el error de la URL si existe - leer INMEDIATAMENTE
  const [urlError, setUrlError] = useState<string | null>(() => {
    // Leer directamente del href completo al inicializar
    const fullUrl = typeof window !== 'undefined' ? window.location.href : '';
    if (fullUrl) {
      try {
        const urlObj = new URL(fullUrl);
        const errorParam = urlObj.searchParams.get('error');
        if (errorParam) {
          const decoded = decodeURIComponent(errorParam);
          return decoded;
        }
      } catch {
        // Ignorar errores de parseo
      }
    }
    // Fallback: leer de search
    return readErrorFromURL();
  });

  // Leer error de la URL cuando cambia (para errores de OAuth)
  useEffect(() => {
    // Leer del href completo primero
    const fullUrl = window.location.href;
    let errorParam: string | null = null;
    
    try {
      const urlObj = new URL(fullUrl);
      errorParam = urlObj.searchParams.get('error');
    } catch {
      // Fallback: leer de search
      const urlParams = new URLSearchParams(window.location.search);
      errorParam = urlParams.get('error');
    }
    
    if (errorParam) {
      try {
        const decodedError = decodeURIComponent(errorParam);
        setUrlError(decodedError);
        // Asegurar que la vista esté en 'login' cuando hay un error de OAuth
        setCurrentView('login');
        // Limpiar el parámetro de la URL después de leerlo (con un pequeño delay para asegurar que se muestre)
        setTimeout(() => {
          const urlParams = new URLSearchParams(window.location.search);
          urlParams.delete('error');
          const newSearch = urlParams.toString();
          const newUrl = newSearch 
            ? `${window.location.pathname}?${newSearch}`
            : window.location.pathname;
          window.history.replaceState({}, '', newUrl);
        }, 500);
      } catch {
        setUrlError(errorParam);
        setCurrentView('login');
      }
    }
  }, [location.search, location.pathname]); // Re-ejecutar cuando cambien los searchParams

  // Combinar errores de URL y del contexto
  const displayError = urlError || error;

  // Detectar si el error es relacionado con OAuth (pero NO incluir errores de cuenta desactivada)
  const isOAuthError = displayError && (
    (displayError.includes('vinculada con Google') || 
     displayError.includes('Google') ||
     displayError.includes('OAuth')) &&
    !displayError.includes('desactivada')
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
      {displayError && !registrationSuccess && (
        <div 
          className={`rounded-md p-4 mb-4 ${
            isOAuthError 
              ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' 
              : 'bg-destructive/10 border border-destructive/20'
          }`}
          style={{ display: 'block' }} // Forzar display para asegurar que se muestre
        >
          <p className={`text-sm mb-3 ${
            isOAuthError 
              ? 'text-blue-900 dark:text-blue-100' 
              : 'text-destructive'
          }`}>
            {displayError || 'Error desconocido'}
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

