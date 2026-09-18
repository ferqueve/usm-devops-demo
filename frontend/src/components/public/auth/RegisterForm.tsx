import { cn } from "@/lib/utils/helpers"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { EmailVerificationMessage } from "./EmailVerificationMessage"
import { TermsAndPrivacyDialog } from "./TermsAndPrivacyDialog"
import { authApi } from "@/lib/api/auth"

export function RegisterForm({
  className,
  onRegister,
  isLoading = false,
  showSuccessMessage = false,
  userEmail = "",
  onBackToLogin,
  ...props
}: React.ComponentProps<"form"> & { 
  onRegister?: (userData: { 
    nombre: string; 
    apellido: string; 
    email: string; 
    password: string; 
    confirmPassword: string;
    aceptaTerminos: boolean;
    aceptaPolitica: boolean;
  }) => Promise<void>;
  isLoading?: boolean;
  showSuccessMessage?: boolean;
  userEmail?: string;
  onBackToLogin?: () => void;
}) {
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [aceptaPolitica, setAceptaPolitica] = useState(false);
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // Timer para el cooldown del reenvío
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            setResendMessage("");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Iniciar cooldown cuando se muestra el mensaje de éxito
  useEffect(() => {
    if (showSuccessMessage && resendCooldown === 0) {
      setResendCooldown(40);
    }
  }, [showSuccessMessage, resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar que se acepten los términos y la política
    if (!aceptaTerminos || !aceptaPolitica) {
      return;
    }
    
    if (onRegister) {
      try {
        await onRegister({
          ...formData,
          aceptaTerminos,
          aceptaPolitica
        });
        // Limpiar formulario solo si el registro fue exitoso
        setFormData({
          nombre: "",
          apellido: "",
          email: "",
          password: "",
          confirmPassword: ""
        });
        setAceptaTerminos(false);
        setAceptaPolitica(false);
      } catch {
        // El error se maneja en el AuthContext
      }
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  const handleResendEmail = async () => {
    if (!userEmail) {
      setResendMessage("No hay email disponible para reenviar");
      return;
    }

    if (resendCooldown > 0) {
      return; // No hacer nada si está en cooldown
    }

    try {
      setResendMessage("Enviando...");
      const response = await authApi.resendVerificationEmail(userEmail);
      
      if (response.success) {
        setResendMessage("Se ha reenviado el email de verificación");
        setResendCooldown(40); // 40 segundos de cooldown
      } else {
        setResendMessage("Error al reenviar el email");
      }
    } catch {
      setResendMessage("Error al reenviar el email");
    }
  };


  // Si debe mostrar mensaje de éxito, renderizar el componente separado
  if (showSuccessMessage) {
    return (
      <div>
        <EmailVerificationMessage
          onBackToLogin={onBackToLogin}
          onResendEmail={handleResendEmail}
          className={className}
          resendCooldown={resendCooldown}
        />
        {resendMessage && resendCooldown === 0 && (
          <div className="mt-3 p-2 text-center text-sm">
            <p className="text-muted-foreground">
              {resendMessage}
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <form className={cn("flex flex-col gap-6", className)} onSubmit={handleSubmit} {...props}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Crear Cuenta</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Regístrate para acceder a los espacios de UTEC
        </p>
      </div>
      <div className="grid gap-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-3">
            <Label htmlFor="nombre">Nombre</Label>
            <Input 
              id="nombre" 
              type="text" 
              placeholder="Tu nombre" 
              value={formData.nombre}
              onChange={(e) => handleInputChange("nombre", e.target.value)}
              required 
            />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="apellido">Apellido</Label>
            <Input 
              id="apellido" 
              type="text" 
              placeholder="Tu apellido" 
              value={formData.apellido}
              onChange={(e) => handleInputChange("apellido", e.target.value)}
              required 
            />
          </div>
        </div>
        <div className="grid gap-3">
          <Label htmlFor="email">Correo Electrónico</Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="tu@email.com" 
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            required 
          />
        </div>
        <div className="grid gap-3">
          <Label htmlFor="password">Contraseña</Label>
          <Input 
            id="password" 
            type="password" 
            placeholder="Mínimo 8 caracteres"
            value={formData.password}
            onChange={(e) => {
              const value = e.target.value;
              handleInputChange("password", value);
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
            minLength={8}
          />
        </div>
        <div className="grid gap-3">
          <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
          <Input 
            id="confirmPassword" 
            type="password" 
            placeholder="Repite tu contraseña"
            value={formData.confirmPassword}
            onChange={(e) => {
              const value = e.target.value;
              handleInputChange("confirmPassword", value);
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
            minLength={8}
          />
        </div>
        
        {/* Checkboxes de aceptación */}
        <div className="space-y-3 pt-2">
          <div className="flex items-start space-x-2">
            <Checkbox
              id="aceptaTerminos"
              checked={aceptaTerminos}
              onCheckedChange={(checked) => setAceptaTerminos(checked as boolean)}
              required
            />
            <div className="flex-1 space-y-1">
              <Label
                htmlFor="aceptaTerminos"
                className="text-sm font-normal cursor-pointer leading-tight"
              >
                Acepto los{" "}
                <button
                  type="button"
                  onClick={() => setShowTermsDialog(true)}
                  className="text-primary underline underline-offset-4 hover:text-primary/80"
                >
                  Términos y Condiciones
                </button>
                <span className="text-danger">*</span>
              </Label>
            </div>
          </div>
          
          <div className="flex items-start space-x-2">
            <Checkbox
              id="aceptaPolitica"
              checked={aceptaPolitica}
              onCheckedChange={(checked) => setAceptaPolitica(checked as boolean)}
              required
            />
            <div className="flex-1 space-y-1">
              <Label
                htmlFor="aceptaPolitica"
                className="text-sm font-normal cursor-pointer leading-tight"
              >
                Acepto la{" "}
                <button
                  type="button"
                  onClick={() => setShowPrivacyDialog(true)}
                  className="text-primary underline underline-offset-4 hover:text-primary/80"
                >
                  Política de Privacidad
                </button>
                <span className="text-danger">*</span>
              </Label>
            </div>
          </div>
        </div>
        
        <Button 
          type="submit" 
          className="w-full" 
          disabled={isLoading || !aceptaTerminos || !aceptaPolitica}
        >
          {isLoading ? "Creando cuenta..." : "Crear Cuenta"}
        </Button>
      </div>
      <div className="text-center text-sm">
        ¿Ya tienes una cuenta?{" "}
        <Link to="/auth" className="underline underline-offset-4 hover:text-primary">
          Inicia sesión
        </Link>
      </div>
      
      {/* Diálogos de términos y política */}
      <TermsAndPrivacyDialog
        open={showTermsDialog}
        onOpenChange={setShowTermsDialog}
      />
      <TermsAndPrivacyDialog
        open={showPrivacyDialog}
        onOpenChange={setShowPrivacyDialog}
      />
    </form>
  )
}

