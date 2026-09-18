import { cn } from "@/lib/utils/helpers"
import { Button } from "@/components/ui/Button"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"

interface VerifyEmailFormProps {
  className?: string;
  status: 'loading' | 'success' | 'error';
  message: string;
  email?: string;
  onResendEmail?: (email: string) => void;
  onBackToLogin?: () => void;
  resendMessage?: string;
}

export function VerifyEmailForm({
  className,
  status,
  message,
  email = "",
  onResendEmail,
  onBackToLogin,
  resendMessage = "",
  ...props
}: VerifyEmailFormProps & React.ComponentProps<"div">) {

  const [resendCooldown, setResendCooldown] = useState(0);

  // Timer para el cooldown del reenvío
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendCooldown]);

  // Iniciar cooldown cuando se muestra el estado de error
  useEffect(() => {
    if (status === 'error' && resendCooldown === 0) {
      setResendCooldown(40);
    }
  }, [status, resendCooldown]);

  const handleResendEmail = async () => {
    if (!email.trim() || resendCooldown > 0) {
      return;
    }
    if (onResendEmail) {
      onResendEmail(email);
      setResendCooldown(40); // Reiniciar cooldown después del reenvío
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="w-16 h-16 bg-info-suave rounded-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
            <h1 className="text-2xl font-bold">Verificando email...</h1>
            <p className="text-muted-foreground text-sm text-balance">
              Por favor espera mientras verificamos tu email.
            </p>
          </div>
        );

      case 'success':
        return (
          <>
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="w-16 h-16 bg-success-suave rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-success-texto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-success-texto">¡Email verificado!</h1>
              <p className="text-muted-foreground text-sm text-balance">{message}</p>
              <p className="text-xs text-muted-foreground">
                Serás redirigido al login en unos segundos...
              </p>
            </div>
            <div className="grid gap-6">
              {/* Mostrar email verificado si está disponible */}
              {email && email.trim() !== '' && (
                <div className="grid gap-3">
                  <Label>Email verificado</Label>
                  <div className="p-3 bg-success-suave rounded-md border border-success-borde">
                    <p className="text-sm font-medium text-success-texto">{email}</p>
                  </div>
                </div>
              )}
              <Button onClick={onBackToLogin} className="w-full">
                Ir al Login
              </Button>
            </div>
          </>
        );

      case 'error':
        return (
          <>
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="w-16 h-16 bg-danger-suave rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-danger-texto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-danger-texto">Error de verificación</h1>
              <p className="text-muted-foreground text-sm text-balance">{message}</p>
            </div>
            <div className="grid gap-6">
              {/* Mostrar mensaje de reenvío si existe */}
              {resendMessage && (
                <div className="p-3 bg-info-suave rounded-md border border-info-borde">
                  <p className="text-sm text-info-texto">{resendMessage}</p>
                </div>
              )}
              {/* Solo mostrar opciones de reenvío si hay email disponible */}
              {email && email.trim() !== '' ? (
                <>
                  <div className="grid gap-3">
                    <Label>Correo Electrónico</Label>
                    <div className="p-3 bg-muted rounded-md border">
                      <p className="text-sm font-medium">{email}</p>
                    </div>
                  </div>
                  <Button 
                    onClick={handleResendEmail} 
                    className="w-full" 
                    variant="outline"
                    disabled={resendCooldown > 0}
                  >
                    {resendCooldown > 0 ? `Reenviar Email de Verificación (${resendCooldown}s)` : 'Reenviar Email de Verificación'}
                  </Button>
                </>
              ) : null}
              <Button onClick={onBackToLogin} className="w-full">
                Volver al Login
              </Button>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {renderContent()}
    </div>
  )
}

