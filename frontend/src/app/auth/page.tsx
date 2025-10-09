import { LoginForm } from '@/components/public/auth/LoginForm';
import { RegisterForm } from '@/components/public/auth/RegisterForm';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function AuthPage() {
  const { login, register, isAuthenticated, isLoading, error, registrationSuccess, setRegistrationSuccess, lastRegisteredEmail } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Estado para controlar la animación
  const [currentView, setCurrentView] = useState<'login' | 'register'>('login');
  const [isAnimating, setIsAnimating] = useState(false);

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
        <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 mb-4">
          <p className="text-sm text-destructive">{error}</p>
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

