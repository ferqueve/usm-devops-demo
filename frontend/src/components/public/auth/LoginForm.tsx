import { cn } from "@/lib/utils/helpers"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { Link } from "react-router-dom"

export function LoginForm({
  className,
  onLogin,
  isLoading = false,
  ...props
}: React.ComponentProps<"form"> & { 
  onLogin?: (credentials: { email: string; password: string }) => Promise<void>;
  isLoading?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (onLogin) {
      await onLogin({ email, password });
    }
  }

  const handleGoogleLogin = () => {
    // Redirigir al endpoint del backend que manejará todo el flujo OAuth
    setGoogleLoading(true);
    window.location.href = `${import.meta.env.VITE_API_URL.replace('/api/v1', '')}/api/v1/oauth2/google/authorize`;
  };

  return (
    <form className={cn("flex flex-col gap-6", className)} onSubmit={handleSubmit} {...props}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Iniciar Sesión</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Ingresa tu email para acceder a tu cuenta
        </p>
      </div>
      <div className="grid gap-6">
        <div className="grid gap-3">
          <Label htmlFor="email">Correo Electrónico</Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="usuario@utec.edu.uy" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
          />
        </div>
        <div className="grid gap-3">
          <div className="flex items-center">
            <Label htmlFor="password">Contraseña</Label>
            <Link
              to="/auth/forgot-password"
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
               ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <Input 
            id="password" 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
          />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
        </Button>
        <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
          <span className="bg-background text-muted-foreground relative z-10 px-2">
            O continúa con
          </span>
        </div>
        <Button 
          variant="outline" 
          className="w-full" 
          type="button"
          onClick={() => handleGoogleLogin()}
          disabled={isLoading || googleLoading}
        >
          <img src="/google-icon.svg" alt="Google" className="h-5 w-5" />
          {googleLoading ? "Autenticando..." : "Iniciar con Google"}
        </Button>
      </div>
      <div className="text-center text-sm">
        ¿No tienes una cuenta?{" "}
        <Link to="/auth/register" className="underline underline-offset-4 hover:text-primary">
          Regístrate
        </Link>
      </div>
    </form>
  )
}

