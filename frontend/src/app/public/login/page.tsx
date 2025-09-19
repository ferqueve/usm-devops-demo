import { LoginContent } from "@/components/public/login";
import { AuthSidePanel } from "@/components/layouts/AuthLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const { login, isAuthenticated, isLoading, error } = useAuth();
  const navigate = useNavigate();

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <LoginContent 
        login={login} 
        isLoading={isLoading} 
        error={error} 
      />
      <AuthSidePanel />
    </div>
  );
}
