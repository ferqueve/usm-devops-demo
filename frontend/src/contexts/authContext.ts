import { createContext } from 'react';

// Tipos para el contexto de autenticación
export interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: {
    email: string;
    nombre: string;
    rol: string;
  } | null;
  login: (credentials?: { email: string; password: string }) => Promise<void>;
  register: (userData: { 
    nombre: string; 
    apellido: string; 
    email: string; 
    password: string; 
    confirmPassword: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  registrationSuccess: boolean;
  setRegistrationSuccess: (success: boolean) => void;
  lastRegisteredEmail: string;
}

// Crear contexto con valor por defecto
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

