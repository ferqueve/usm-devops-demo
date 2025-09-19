import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { Link } from "react-router-dom"

export function RegisterForm({
  className,
  onRegister,
  isLoading = false,
  ...props
}: React.ComponentProps<"form"> & { 
  onRegister?: (userData: { 
    nombre: string; 
    apellido: string; 
    email: string; 
    password: string; 
    confirmPassword: string;
  }) => Promise<void>;
  isLoading?: boolean;
}) {
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar que las contraseñas coincidan
    if (formData.password !== formData.confirmPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }
    
    if (onRegister) {
      try {
        await onRegister(formData);
        setShowSuccess(true);
        // Limpiar formulario
        setFormData({
          nombre: "",
          apellido: "",
          email: "",
          password: "",
          confirmPassword: ""
        });
      } catch (error) {
        // El error se maneja en el AuthContext
      }
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  // Si se muestra éxito, mostrar mensaje
  if (showSuccess) {
    return (
      <div className={cn("flex flex-col gap-6", className)}>
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-green-600">¡Cuenta creada!</h1>
            <p className="text-muted-foreground text-sm mt-2">
              Tu cuenta ha sido registrada exitosamente. Ahora puedes iniciar sesión.
            </p>
          </div>
          <Link to="/auth">
            <Button className="w-full">
              Ir a Iniciar Sesión
            </Button>
          </Link>
        </div>
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
            onChange={(e) => handleInputChange("password", e.target.value)}
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
            onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
            required 
            minLength={8}
          />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Creando cuenta..." : "Crear Cuenta"}
        </Button>
      </div>
      <div className="text-center text-sm">
        ¿Ya tienes una cuenta?{" "}
        <Link to="/auth" className="underline underline-offset-4 hover:text-primary">
          Inicia sesión
        </Link>
      </div>
    </form>
  )
}
