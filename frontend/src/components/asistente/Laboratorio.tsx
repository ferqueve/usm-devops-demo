import { useState, type ReactNode } from 'react';
import { CheckCircle2, DatabaseZap, FileText, FlaskConical, Lightbulb, Loader2, Play, TrendingUp, XCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/dashboard/views/_components/Panel';
import { MARCA } from '@/lib/design/paleta';
import {
  postAnalyzeForecast, postExplainRecomendacion, postReindexEmbeddings, postStatsSummary,
} from '@/lib/api/ai';

interface Prueba {
  titulo: string;
  endpoint: string;
  descripcion: string;
  icon: LucideIcon;
  color: string;
  correr: () => Promise<string>;
}

/**
 * Llamadas con datos de ejemplo fijos, para probar cada endpoint de la capa de
 * IA sin depender de una pantalla. Las integraciones reales mandan datos vivos.
 */
const PRUEBAS: Prueba[] = [
  {
    titulo: 'Resumen de estadísticas',
    endpoint: 'POST /ai/insights/stats-summary',
    descripcion: 'Resumen ejecutivo de un período.',
    icon: FileText,
    color: MARCA.azul,
    correr: async () => {
      const r = await postStatsSummary({
        periodo: 'últimos 30 días',
        stats: {
          total_reservas: 412,
          ocupacion_promedio: 0.63,
          top_espacios: [{ nombre: 'Aula 101', reservas: 58 }, { nombre: 'Lab 2', reservas: 44 }],
        },
      });
      return r.data?.resumen ?? '';
    },
  },
  {
    titulo: 'Explicar recomendación',
    endpoint: 'POST /ai/insights/explain-recomendacion',
    descripcion: 'Humaniza la razón del recomendador.',
    icon: Lightbulb,
    color: MARCA.amarillo,
    correr: async () => {
      const r = await postExplainRecomendacion({
        recomendacion: {
          espacioNombre: 'Sala 203',
          capacidad: 30,
          tipoEspacioNombre: 'Salón con proyector',
          puntaje: 0.85,
          razon: 'Disponibilidad alta los jueves y uso frecuente en tu carrera',
        },
        contexto_usuario: { rol: 'DOCENTE', carrera: 'Ingeniería Logística' },
      });
      return r.data?.explicacion ?? '';
    },
  },
  {
    titulo: 'Analizar forecast',
    endpoint: 'POST /ai/insights/analyze-forecast',
    descripcion: 'Lectura operativa de una predicción.',
    icon: TrendingUp,
    color: '#9333ea',
    correr: async () => {
      const r = await postAnalyzeForecast({
        historico: [
          { fecha: '2026-05-12', real: 38 },
          { fecha: '2026-05-13', real: 42 },
          { fecha: '2026-05-14', real: 47 },
          { fecha: '2026-05-15', real: 50 },
        ],
        predicciones: [
          { fecha: '2026-05-20', prediccion: 52, bandaInferior: 45, bandaSuperior: 60 },
          { fecha: '2026-05-21', prediccion: 55, bandaInferior: 47, bandaSuperior: 63 },
        ],
        mape: 12.3,
      });
      return r.data?.analisis ?? '';
    },
  },
];

type Estado = { tipo: 'idle' } | { tipo: 'loading' } | { tipo: 'ok'; texto: string; ms: number } | { tipo: 'error'; texto: string };

function TarjetaPrueba({ prueba }: Readonly<{ prueba: Prueba }>) {
  const [estado, setEstado] = useState<Estado>({ tipo: 'idle' });

  async function correr() {
    setEstado({ tipo: 'loading' });
    const t0 = performance.now();
    try {
      const texto = await prueba.correr();
      setEstado({ tipo: 'ok', texto: texto || '(respuesta vacía)', ms: Math.round(performance.now() - t0) });
    } catch (e) {
      setEstado({ tipo: 'error', texto: e instanceof Error ? e.message : String(e) });
    }
  }

  return (
    <Tarjeta
      icon={prueba.icon}
      color={prueba.color}
      titulo={prueba.titulo}
      endpoint={prueba.endpoint}
      descripcion={prueba.descripcion}
      accion={<BotonCorrer onClick={correr} loading={estado.tipo === 'loading'} />}
    >
      {estado.tipo === 'ok' && (
        <div className="space-y-1.5">
          <span className="flex items-center gap-1 text-2xs font-medium text-utec-green">
            <CheckCircle2 className="h-3.5 w-3.5" /> OK · {estado.ms} ms
          </span>
          <p className="whitespace-pre-wrap rounded-lg bg-muted/50 p-3 text-sm leading-relaxed">{estado.texto}</p>
        </div>
      )}
      {estado.tipo === 'error' && (
        <p className="flex items-start gap-1.5 rounded-lg bg-utec-red/5 p-3 font-mono text-xs text-utec-red">
          <XCircle className="mt-px h-3.5 w-3.5 shrink-0" /> {estado.texto}
        </p>
      )}
    </Tarjeta>
  );
}

function BotonCorrer({ onClick, loading, label = 'Probar' }: Readonly<{ onClick: () => void; loading: boolean; label?: string }>) {
  return (
    <Button size="sm" onClick={onClick} disabled={loading}>
      {loading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Play className="mr-1.5 h-3.5 w-3.5" />}
      {label}
    </Button>
  );
}

function Tarjeta({ icon: Icon, color, titulo, endpoint, descripcion, accion, children }: Readonly<{
  icon: LucideIcon; color: string; titulo: string; endpoint: string; descripcion: string; accion: ReactNode; children?: ReactNode;
}>) {
  return (
    <Panel title={titulo} count={endpoint} accentColor={color}>
      <div className="space-y-3 p-1">
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Icon className="h-4 w-4 shrink-0" style={{ color }} />
            {descripcion}
          </p>
          {accion}
        </div>
        {children}
      </div>
    </Panel>
  );
}

function Reindexar() {
  const [loading, setLoading] = useState(false);
  async function reindexar() {
    setLoading(true);
    try {
      const r = await postReindexEmbeddings();
      toast.success(`Reindexados ${r.data?.indexed ?? 0} espacios`, { description: r.data?.model });
    } catch (e) {
      toast.error('No se pudo reindexar', { description: e instanceof Error ? e.message : String(e) });
    } finally {
      setLoading(false);
    }
  }
  return (
    <Tarjeta
      icon={DatabaseZap}
      color={MARCA.cian}
      titulo="Reindexar embeddings"
      endpoint="POST /ai/admin/reindex-embeddings"
      descripcion="Recalcula los vectores de todos los espacios para la búsqueda."
      accion={<BotonCorrer onClick={reindexar} loading={loading} label="Reindexar" />}
    />
  );
}

export function Laboratorio() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3">
        <FlaskConical className="h-5 w-5 shrink-0 text-utec-purple" />
        <p className="text-xs text-muted-foreground">
          Llamadas con <b>datos de ejemplo</b> a cada endpoint de la capa de IA. Solo para probar: las pantallas reales mandan datos vivos.
        </p>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {PRUEBAS.map((p) => <TarjetaPrueba key={p.endpoint} prueba={p} />)}
        <Reindexar />
      </div>
    </div>
  );
}
