import { RegisterForm } from '../login/index';
import { AuthHeader, AuthLoading } from '@/components/layouts/AuthLayout';

interface RegisterContentProps {
  register: (userData: { 
    nombre: string; 
    apellido: string; 
    email: string; 
    password: string; 
    confirmPassword: string;
  }) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

// Componente que maneja el contenido principal del registro
export function RegisterContent({ register, isLoading, error }: RegisterContentProps) {
  return (
    <div className="flex flex-col gap-4 p-8 md:p-12">
      <AuthHeader />
      
      {isLoading ? (
        <AuthLoading />
      ) : (
        <>
          {/* Mostrar error si existe */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
          
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-xs">
              <RegisterForm 
                onRegister={register} 
                isLoading={isLoading}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
