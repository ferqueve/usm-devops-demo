import { Link } from 'react-router-dom';
import { BarChart3, CalendarPlus, ChevronRight, DoorOpen, GraduationCap, Leaf, TrendingUp } from 'lucide-react';
import { Panel } from '@/components/dashboard/views/_components/Panel';
import { MARCA } from '@/lib/design/paleta';

const LUGARES = [
  { href: '/statistics?tab=reservas', label: 'Estadísticas', detalle: 'resumen del período', icon: BarChart3, color: MARCA.azul },
  { href: '/predicciones?tab=reservas', label: 'Predicciones', detalle: 'lectura de cada modelo', icon: TrendingUp, color: MARCA.naranja },
  { href: '/rooms', label: 'Espacios', detalle: 'búsqueda por descripción', icon: DoorOpen, color: MARCA.cian },
  { href: '/materias', label: 'Materias', detalle: 'resumen de temarios', icon: GraduationCap, color: '#9333ea' },
  { href: '/eventos', label: 'Eventos', detalle: 'redacta el evento', icon: CalendarPlus, color: MARCA.amarillo },
  { href: '/sostenibilidad', label: 'Sostenibilidad', detalle: 'impacto explicado', icon: Leaf, color: MARCA.verde },
];

export function IaEnPantallas() {
  return (
    <Panel title="También en" count="otras pantallas" accentColor={MARCA.amarillo} flush className="shrink-0">
      <div className="divide-y divide-border/60">
        {LUGARES.map((l) => (
          <Link
            key={l.href}
            to={l.href}
            className="group flex items-center gap-3 px-4 py-2 transition-colors hover:bg-muted/50"
          >
            <l.icon className="h-4 w-4 shrink-0" style={{ color: l.color }} />
            <span className="text-sm font-medium">{l.label}</span>
            <span className="truncate text-xs text-muted-foreground">{l.detalle}</span>
            <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>
    </Panel>
  );
}
