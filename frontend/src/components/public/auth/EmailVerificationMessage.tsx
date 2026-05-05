import { Button } from "@/components/ui/Button"
import { cn } from "@/lib/utils/helpers"

interface EmailVerificationMessageProps {
  onBackToLogin?: () => void;
  onResendEmail?: () => void;
  className?: string;
  resendCooldown?: number;
}

export function EmailVerificationMessage({
  onBackToLogin,
  onResendEmail,
  className,
  resendCooldown = 0
}: Readonly<EmailVerificationMessageProps>) {
  return (
    <div className={cn("flex flex-col gap-6 text-center", className)}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-green-900">¡Registro Exitoso!</h1>
          <p className="text-muted-foreground text-sm">
            Hemos enviado un enlace de verificación a tu correo
          </p>
        </div>
      </div>
      <div className="space-y-3">
        <Button 
          onClick={onBackToLogin}
          className="w-full"
          variant="outline"
        >
          Volver al Login
        </Button>
        <p className="text-xs text-muted-foreground">
          ¿No recibiste el email? Revisa tu carpeta de spam o{" "}
          <button 
            onClick={onResendEmail}
            disabled={resendCooldown > 0}
            className={`underline hover:text-primary ${resendCooldown > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {resendCooldown > 0 ? `reenvía el enlace (${resendCooldown}s)` : 'reenvía el enlace'}
          </button>
        </p>
      </div>
    </div>
  );
}

