import { useEffect, useState } from 'react';
import { Flame, Loader2 } from 'lucide-react';
import { tutoriasApi } from '@/lib/api/tutorias';
import type { Racha } from '@/lib/types/tutorias';
import { Panel } from '@/components/common/Panel';
import { MARCA } from '@/lib/design/paleta';

export function RachaBadges() {
  const [racha, setRacha] = useState<Racha | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tutoriasApi.racha().then((r) => setRacha(r.data ?? null)).catch(() => { /* noop */ }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="rounded-2xl border bg-card p-4 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  if (!racha || (racha.asistidas === 0 && racha.agendadas === 0)) return null;

  return (
    <Panel title="Tu progreso" icon={<Flame />} accentColor={MARCA.naranja}
      count={racha.rachaActual > 0 ? `racha x${racha.rachaActual}` : undefined}>
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
    </Panel>
  );
}
