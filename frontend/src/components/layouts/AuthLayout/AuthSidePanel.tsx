import { UtecShapesBackground } from '@/components/ui/backgrounds/UtecShapesBackground';

/**
 * Panel lateral del login: fondo animado institucional UTEC (formas geométricas
 * con parallax + red de nodos, ver {@link UtecShapesBackground}) con la marca
 * del producto encima.
 */
export function AuthSidePanel() {
  return (
    <div className="relative hidden lg:block overflow-hidden">
      {/* Fondo animado reutilizable (mismo patrón en el hero de eventos) */}
      <UtecShapesBackground />

      {/* ===== Marca ===== */}
      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
        <div className="text-center text-white px-8">
          <h2 className="text-4xl font-utec mb-4 drop-shadow-lg">UTEC SPACE MANAGER</h2>
          <p className="text-lg font-utec tracking-wide opacity-90 drop-shadow-md">Gestor de espacios de UTEC</p>
        </div>
      </div>
    </div>
  );
}
