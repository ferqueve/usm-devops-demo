import { useEffect, useState } from 'react';
import { Flame, Loader2 } from 'lucide-react';
import { tutoriasApi } from '@/lib/api/tutorias';
import type { Racha } from '@/lib/types/tutorias';

export function RachaBadges() {
  const [racha, setRacha] = useState<Racha | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tutoriasApi.racha().then((r) => setRacha(r.data ?? null)).catch(() => { /* noop */ }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="rounded-2xl border bg-card p-4 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  if (!racha || (racha.asistidas === 0 && racha.agendadas === 0)) return null;

  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-utec-orange/15"><Flame className="h-4 w-4 text-marca-naranja-texto" /></span>
        <h3 className="text-sm font-semibold">Tu progreso</h3>
        {racha.rachaActual > 0 && <span className="ml-auto text-xs font-semibold text-marca-naranja-texto">🔥 Racha x{racha.rachaActual}</span>}
      </div>
      <div className="p-4 space-y-3">
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
    </div>
  );
}
