import { useCallback, useEffect, useState } from 'react';
import { Flame } from 'lucide-react';
import { tutoriasApi } from '@/lib/api/tutorias';
import type { Racha } from '@/lib/types/tutorias';
import { Panel } from '@/components/common/Panel';
import { MARCA } from '@/lib/design/paleta';
import { EstadoCarga } from '@/components/common/EstadoCarga';

export function RachaBadges() {
  const [racha, setRacha] = useState<Racha | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(() => {
    setLoading(true);
    setError(null);
    tutoriasApi.racha().then((r) => setRacha(r.data ?? null)).catch((e: unknown) => setError(e instanceof Error ? e.message : 'Error de red.')).finally(() => setLoading(false));
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  // Sin datos y sin error el panel no va: no hay progreso que mostrar
  // todavía. Con error sí, para que no desaparezca en silencio.
  if (!loading && !error && (!racha || (racha.asistidas === 0 && racha.agendadas === 0))) return null;

  return (
    <Panel title="Tu progreso" icon={<Flame />} accentColor={MARCA.naranja}
      count={racha && racha.rachaActual > 0 ? `racha x${racha.rachaActual}` : undefined}>
      <EstadoCarga cargando={loading} error={error} alReintentar={cargar} vacio={!racha}>
      {racha && (
      <div className="space-y-3">
        <div className="flex gap-3">
          <div className="flex-1 rounded-xl bg-utec-green/10 p-3 text-center">
            <div className="text-2xl font-bold tabular-nums text-marca-verde-texto">{racha.asistidas}</div>
            <div className="text-2xs text-muted-foreground">asistidas</div>
          </div>
          <div className="flex-1 rounded-xl bg-utec-blue/10 p-3 text-center">
            <div className="text-2xl font-bold tabular-nums text-marca-azul-texto">{racha.agendadas}</div>
            <div className="text-2xs text-muted-foreground">agendadas</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {racha.badges.map((b) => (
            <span
              key={b.id}
              title={b.nombre}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${b.desbloqueado ? 'bg-utec-yellow/20 text-marca-tinta' : 'bg-muted text-muted-foreground/50 grayscale'}`}
            >
              <span className={b.desbloqueado ? '' : 'opacity-50'}>{b.emoji}</span>{b.nombre}
            </span>
          ))}
        </div>
      </div>
      )}
      </EstadoCarga>
    </Panel>
  );
}
