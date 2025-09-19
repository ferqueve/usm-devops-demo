import { LoginForm } from '@/components/public/login';
import { RegisterForm } from '@/components/public/register/RegisterForm';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function AuthPage() {
  const { login, register, isAuthenticated, isLoading, error } = useAuth();
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
  
  // Manejar cambio de vista con animación
  useEffect(() => {
    const targetView = isRegisterRoute ? 'register' : 'login';
    
    if (targetView !== currentView) {
      // Iniciar animación de salida
      setIsAnimating(true);
      
      // Después de 300ms (duración de la animación), cambiar la vista
      setTimeout(() => {
        setCurrentView(targetView);
        setIsAnimating(false);
      }, 300);
    }
  }, [isRegisterRoute, currentView]);

  return (
    <>
      {/* Mostrar error si existe */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 mb-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
      
      {/* Componente con animación controlada */}
      <div
        className={`transition-opacity duration-300 ease-in-out ${
          isAnimating ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {currentView === 'register' ? (
          <RegisterForm 
            onRegister={register} 
            isLoading={isLoading}
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
