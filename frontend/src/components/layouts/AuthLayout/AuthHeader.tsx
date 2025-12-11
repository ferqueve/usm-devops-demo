import { Link } from "react-router-dom";

// Componente para el header con logo
export function AuthHeader() {
  return (
    <div className="flex justify-center gap-2 md:justify-start">
      <Link to="/auth" className="flex items-center gap-2 font-medium hover:opacity-80 transition-opacity">
        <img 
          src="/logo-utec.png" 
          alt="UTEC Logo" 
          className="h-6 w-auto"
        />
        <span className="font-utec-brand">USM</span>
      </Link>
    </div>
  );
}

