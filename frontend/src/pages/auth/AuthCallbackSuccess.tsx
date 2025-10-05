import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function AuthCallbackSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Obtener parámetros de la URL
        const token = searchParams.get('token');
        const refreshToken = searchParams.get('refresh_token');
        const email = searchParams.get('email');
        const nombre = searchParams.get('nombre');
        const rol = searchParams.get('rol');

        if (!token || !refreshToken || !email) {
          throw new Error('Parámetros de autenticación faltantes');
        }

        // Guardar tokens y datos del usuario
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
        
        const userData = {
          email,
          nombre: nombre || '',
          rol: rol || 'EXTERNO'
        };
        localStorage.setItem('user', JSON.stringify(userData));

        // Limpiar la URL de parámetros sensibles
        window.history.replaceState({}, document.title, window.location.pathname);

        // Redirigir al dashboard
        navigate('/dashboard');
        
      } catch (err) {
        console.error('Error procesando callback OAuth:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
        setTimeout(() => {
          navigate('/auth/login');
        }, 3000);
      } finally {
        setIsProcessing(false);
      }
    };

    processCallback();
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error de Autenticación</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">
            Serás redirigido al login en unos segundos...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          {isProcessing ? 'Procesando autenticación...' : 'Autenticación exitosa'}
        </h1>
        <p className="text-gray-600">
          {isProcessing 
            ? 'Por favor espera mientras configuramos tu sesión' 
            : 'Redirigiendo al dashboard...'
          }
        </p>
      </div>
    </div>
  );
}
