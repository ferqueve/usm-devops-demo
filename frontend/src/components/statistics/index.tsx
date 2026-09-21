import { useSearchParams } from 'react-router-dom';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { PageHeader } from '@/components/layouts/PageHeader';
import EstadisticasAcademico from './academico/EstadisticasAcademico';
import EstadisticasInventario from './inventario/EstadisticasInventario';
import EstadisticasReservas from './reservas/EstadisticasReservas';
import { PERIODOS, fechaCorta, usePeriodo } from './periodo';
import { MARCA } from '@/lib/design/paleta';

/**
 * Estadísticas: tres vistas, reservas, inventario y académico, con un único período en
 * la barra superior que filtra todo lo que se ve. La vista se elige desde el
 * menú lateral, que ya tiene Reservas e Inventario.
 *
 * Antes cada bloque tenía su propio marco de tiempo -- los números de arriba
 * contaban todo el histórico, las métricas de abajo su propio selector --, y
 * arriba y abajo daban cifras que no coincidían sin que se entendiera por qué.
 *
 * Cada vista se muestra si el usuario tiene el permiso que piden sus
 * endpoints, y no el que sugiere su rol: un MANTENIMIENTO no ve la de reservas.
 */
export default function Statistics() {
  const { hasPermission } = useRolePermissions();
  const [searchParams] = useSearchParams();
  const { id: periodoId, rango, periodo, elegir } = usePeriodo();

  const puedeReservas = hasPermission('estadisticas:ver_reservas');
  const puedeInventario = hasPermission('estadisticas:ver_inventario');

  if (!puedeReservas && !puedeInventario) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <p>No tienes acceso a las estadísticas.</p>
      </div>
    );
  }

  // Académico usa los mismos endpoints (y el mismo permiso) que reservas.
  const puedeAcademico = puedeReservas;
  const pedida = searchParams.get('tab');
  // Con una sola vista disponible, esa se muestra sin importar lo que diga la URL.
  const vista: 'reservas' | 'inventario' | 'academico' =
    pedida === 'academico' && puedeAcademico
      ? 'academico'
      : puedeInventario && (pedida === 'inventario' || !puedeReservas)
        ? 'inventario'
        : 'reservas';
  const esInventario = vista === 'inventario';

  const rangoTexto = `${fechaCorta(rango.desde)} al ${fechaCorta(rango.hasta)}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Estadísticas"
        count={rangoTexto}
        description={
          vista === 'inventario'
            ? 'Inventario: cómo está hoy, qué se pide y cómo cambió en el período.'
            : vista === 'academico'
              ? 'Académico: tutorías y eventos del período, cuánto se llenan y cómo se califican.'
              : 'Reservas del período: cuántas, cuándo, dónde y de quién.'
        }
        accentColor={vista === 'inventario' ? MARCA.amarillo : vista === 'academico' ? MARCA.verde : MARCA.azul}
        actions={
          <div className="mr-1 flex items-center rounded-md bg-white/10 p-0.5" role="radiogroup" aria-label="Período">
            {PERIODOS.map((p) => {
              const activo = p.id === periodoId;
              return (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={activo}
                  onClick={() => elegir(p.id)}
                  title={p.label}
                  aria-label={p.label}
                  className={`h-7 whitespace-nowrap rounded px-2 text-xs font-medium transition-colors sm:px-2.5 ${
                    activo ? 'bg-white text-chrome' : 'text-white/75 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="sm:hidden">{p.minimo}</span>
                  <span className="hidden sm:inline">{p.corto}</span>
                </button>
              );
            })}
          </div>
        }
      />

      {esInventario ? (
        <EstadisticasInventario rango={rango} />
      ) : vista === 'academico' ? (
        <EstadisticasAcademico rango={rango} periodoLabel={periodo.label} />
      ) : (
        <EstadisticasReservas rango={rango} periodoLabel={periodo.label} />
      )}
    </div>
  );
}
