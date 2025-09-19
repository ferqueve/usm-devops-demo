// Componente para el panel lateral con gradiente rotatorio
export function AuthSidePanel() {
  return (
    <div className="bg-muted relative hidden lg:block overflow-hidden">
      <div className="absolute inset-0 h-full w-full animate-utec-rotating-gradient">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center text-white">
            <h2 className="text-3xl font-utec-title mb-4 drop-shadow-lg">UTEC SPACE MANAGER</h2>
            <p className="text-lg opacity-90 drop-shadow-md">Gestor de espacios de UTEC</p>
          </div>
        </div>
      </div>
    </div>
  );
}
