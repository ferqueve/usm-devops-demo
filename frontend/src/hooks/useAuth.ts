import { useContext } from 'react';
import { AuthContext } from '@/contexts/authContext';
import type { AuthContextType } from '@/contexts/authContext';

// Hook personalizado para usar el contexto de autenticación
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  
  return context;
}

