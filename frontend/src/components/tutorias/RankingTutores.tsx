import { useEffect, useState } from 'react';
import { Loader2, Star, Trophy, Users } from 'lucide-react';
import { tutoriasApi } from '@/lib/api/tutorias';
import type { TutorRanking } from '@/lib/types/tutorias';
import { Panel } from '@/components/common/Panel';
import { MARCA } from '@/lib/design/paleta';

const MEDALLAS = ['🥇', '🥈', '🥉'];

export function RankingTutores() {
  const [ranking, setRanking] = useState<TutorRanking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tutoriasApi.ranking()
      .then((r) => setRanking((r.data ?? []).filter((t) => t.totalValoraciones > 0 || t.totalTutorias > 0)))
      .catch(() => { /* noop */ })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="rounded-2xl border bg-card p-6 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  if (ranking.length === 0) return null;

  return (
    <Panel title="Ranking de tutores" icon={<Trophy />} accentColor={MARCA.amarillo} flush>
      <ul className="divide-y">
        {ranking.slice(0, 8).map((t, i) => (
          <li key={t.docenteId} className="flex items-center gap-3 px-4 py-2.5">
            <span className="w-6 text-center text-lg">{MEDALLAS[i] ?? <span className="text-sm text-muted-foreground tabular-nums">{i + 1}</span>}</span>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-utec-blue/15 text-marca-azul-texto text-xs font-semibold">{t.docenteNombre?.slice(0, 2).toUpperCase()}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{t.docenteNombre}</p>
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-0.5"><Star className="h-3 w-3 fill-utec-yellow text-marca-amarillo-texto" />{t.promedio.toFixed(1)}</span>
                <span>· {t.totalValoraciones} val.</span>
                <span className="flex items-center gap-0.5"><Users className="h-3 w-3" />{t.totalEstudiantes}</span>
              </p>
            </div>
            {t.badge && <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-2xs font-medium">{t.badge}</span>}
          </li>
        ))}
      </ul>
    </Panel>
  );
}
