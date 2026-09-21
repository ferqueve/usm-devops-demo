import { useState } from 'react';
import { authApi } from '@/lib/api/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';

function extractBackendError(error: unknown): string | null {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: unknown }).response;
    if (typeof response === 'object' && response !== null && 'data' in response) {
      const data = (response as { data?: unknown }).data;
      if (typeof data === 'object' && data !== null && 'error' in data) {
        const errMsg = (data as { error?: unknown }).error;
        if (typeof errMsg === 'string') return errMsg;
      }
    }
  }
  return null;
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await authApi.forgotPassword(email);
      
      if (response.success) {
        setMessage({
          type: 'success',
          text: 'Si el email existe y está verificado, recibirás un enlace para recuperar tu contraseña. Revisa tu bandeja de entrada.'
        });
      } else {
        setMessage({
          type: 'error',
          text: response.error || 'Error al enviar el email de recuperación'
        });
      }
    } catch (error: unknown) {
      // Manejar errores específicos del backend
      const backendError = extractBackendError(error);
      if (backendError) {
        setMessage({ type: 'error', text: backendError });
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

  return (
    <>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Recuperar Contraseña</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="grid gap-3">
          <Label htmlFor="email">Correo Electrónico</Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="usuario@utec.edu.uy" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
            disabled={isLoading}
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

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Enviando...' : 'Enviar enlace de recuperación'}
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

