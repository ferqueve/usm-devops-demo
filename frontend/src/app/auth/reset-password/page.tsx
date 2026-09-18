import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authApi } from '@/lib/api/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    
    if (!tokenParam) {
      setMessage({
        type: 'error',
        text: 'Token de recuperación no encontrado. Por favor, solicita un nuevo enlace.'
      });
      setIsValidToken(false);
      return;
    }

    setToken(tokenParam);
    setIsValidToken(true);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    // Validar que las contraseñas coincidan
    if (newPassword !== confirmPassword) {
      setMessage({
        type: 'error',
        text: 'Las contraseñas no coinciden'
      });
      setIsLoading(false);
      return;
    }

    // Validar longitud mínima
    if (newPassword.length < 8) {
      setMessage({
        type: 'error',
        text: 'La contraseña debe tener al menos 8 caracteres'
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await authApi.resetPassword(token, newPassword);
      
      if (response.success) {
        setMessage({
          type: 'success',
          text: 'Contraseña restablecida exitosamente. Redirigiendo al inicio de sesión...'
        });
        
        // Redirigir al login después de 3 segundos
        setTimeout(() => {
          navigate('/auth');
        }, 3000);
      } else {
        setMessage({
          type: 'error',
          text: response.error || 'Error al restablecer la contraseña'
        });
      }
    } catch (error: unknown) {
      // Manejar errores específicos del backend
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: string } } };
        if (axiosError.response?.data?.error) {
          setMessage({
            type: 'error',
            text: axiosError.response.data.error
          });
        } else {
          setMessage({
            type: 'error',
            text: 'Error al procesar la solicitud. Por favor, intenta nuevamente.'
          });
        }
      } else {
        setMessage({
          type: 'error',
          text: 'Error al procesar la solicitud. Por favor, intenta nuevamente.'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidToken === false) {
    return (
      <>
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold">Token Inválido</h1>
          <p className="text-muted-foreground text-sm text-balance">
            El token de recuperación no es válido o ha expirado
          </p>
        </div>

        {message && (
          <div className="rounded-md p-4 bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">{message.text}</p>
          </div>
        )}

        <div className="flex flex-col gap-6">
          <Link to="/auth/forgot-password">
            <Button variant="outline" className="w-full">
              Solicitar nuevo enlace
            </Button>
          </Link>
          <div className="text-center text-sm">
            <Link to="/auth" className="underline underline-offset-4 hover:text-primary">
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Restablecer Contraseña</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Ingresa tu nueva contraseña
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="grid gap-3">
          <Label htmlFor="newPassword">Nueva Contraseña</Label>
          <Input 
            id="newPassword" 
            type="password" 
            placeholder="Mínimo 8 caracteres" 
            value={newPassword}
            onChange={(e) => {
              const value = e.target.value;
              setNewPassword(value);
              // Limpiar mensaje de error personalizado mientras se escribe
              e.target.setCustomValidity('');
            }}
            onInvalid={(e) => {
              const target = e.target as HTMLInputElement;
              if (target.validity.tooShort) {
                target.setCustomValidity('La contraseña debe tener al menos 8 caracteres');
              } else if (target.validity.valueMissing) {
                target.setCustomValidity('Este campo es obligatorio');
              }
            }}
            required 
            disabled={isLoading}
            minLength={8}
          />
        </div>

        <div className="grid gap-3">
          <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
          <Input 
            id="confirmPassword" 
            type="password" 
            placeholder="Confirma tu contraseña" 
            value={confirmPassword}
            onChange={(e) => {
              const value = e.target.value;
              setConfirmPassword(value);
              // Limpiar mensaje de error personalizado mientras se escribe
              e.target.setCustomValidity('');
            }}
            onInvalid={(e) => {
              const target = e.target as HTMLInputElement;
              if (target.validity.tooShort) {
                target.setCustomValidity('La contraseña debe tener al menos 8 caracteres');
              } else if (target.validity.valueMissing) {
                target.setCustomValidity('Este campo es obligatorio');
              }
            }}
            required 
            disabled={isLoading}
            minLength={8}
          />
        </div>

        {message && (
          <div className={`rounded-md p-4 ${
            message.type === 'success'
              ? 'bg-success-suave dark:bg-success/20 border border-success-borde dark:border-success'
              : 'bg-destructive/10 border border-destructive/20'
          }`}>
            <p className={`text-sm ${
              message.type === 'success'
                ? 'text-success-texto dark:text-success-suave'
                : 'text-destructive'
            }`}>
              {message.text}
            </p>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isLoading || !token}>
          {isLoading ? 'Restableciendo...' : 'Restablecer contraseña'}
        </Button>
      </form>

      <div className="text-center text-sm mt-6">
        <Link to="/auth" className="underline underline-offset-4 hover:text-primary">
          Volver al inicio de sesión
        </Link>
      </div>
    </>
  );
}

