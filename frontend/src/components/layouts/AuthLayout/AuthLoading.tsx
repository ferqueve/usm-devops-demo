// Componente para el estado de loading
export function AuthLoading() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Verificando autenticación...</p>
      </div>
    </div>
  );
}

