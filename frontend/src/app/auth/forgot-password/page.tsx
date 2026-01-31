import { useState } from 'react';
import { authApi } from '@/lib/api/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';

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
    } catch (error: any) {
      // Manejar errores específicos del backend
      if (error?.response?.data?.error) {
        setMessage({
          type: 'error',
          text: error.response.data.error
        });
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
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : 'bg-destructive/10 border border-destructive/20'
          }`}>
            <p className={`text-sm ${
              message.type === 'success'
                ? 'text-green-900 dark:text-green-100'
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

