import { LoginForm } from './index';
import { AuthHeader, AuthLoading } from '@/components/layouts/AuthLayout';

interface LoginContentProps {
  login: (credentials?: { email: string; password: string }) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

// Componente que maneja el contenido principal del login
export function LoginContent({ login, isLoading, error }: LoginContentProps) {
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
              <LoginForm onLogin={login} isLoading={isLoading} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
