import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import {
  Activity,
  Building2,
  CalendarRange,
  GraduationCap,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  statsApi,
  type HeatmapCelda,
  type OcupacionEspacio,
  type ResumenCarrera,
  type ResumenEdificio,
  type TopUsuario,
} from '@/lib/api/stats';

type RangoPreset = 'mes-actual' | 'ultimos-30' | 'anio-actual';

interface Rango {
  desde: string;
  hasta: string;
  label: string;
}

const PRESETS: Record<RangoPreset, { label: string; build: () => Rango }> = {
  'ultimos-30': {
    label: 'Últimos 30 días',
    build: () => {
      const hoy = new Date();
      const hace30 = new Date();
      hace30.setDate(hoy.getDate() - 30);
      return {
        desde: hace30.toISOString().slice(0, 10),
        hasta: hoy.toISOString().slice(0, 10),
        label: 'Últimos 30 días',
      };
    },
  },
  'mes-actual': {
    label: 'Mes actual',
    build: () => {
      const hoy = new Date();
      const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      return {
        desde: inicio.toISOString().slice(0, 10),
        hasta: hoy.toISOString().slice(0, 10),
        label: 'Mes actual',
      };
    },
  },
  'anio-actual': {
    label: 'Año actual',
    build: () => {
      const hoy = new Date();
      const inicio = new Date(hoy.getFullYear(), 0, 1);
      return {
        desde: inicio.toISOString().slice(0, 10),
        hasta: hoy.toISOString().slice(0, 10),
        label: 'Año actual',
      };
    },
  },
};

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const HORAS = Array.from({ length: 24 }, (_, i) => i);

function formatHoras(horas: number): string {
  if (horas < 1) return `${Math.round(horas * 60)} min`;
  if (Number.isInteger(horas)) return `${horas}h`;
  const h = Math.floor(horas);
  const m = Math.round((horas - h) * 60);
  return `${h}h ${m}min`;
}

export default function EstadisticasAvanzadas() {
  const [preset, setPreset] = useState<RangoPreset>('ultimos-30');
  const rango = useMemo<Rango>(() => PRESETS[preset].build(), [preset]);

  const [ocupacion, setOcupacion] = useState<OcupacionEspacio[]>([]);
  const [heatmap, setHeatmap] = useState<HeatmapCelda[]>([]);
  const [porCarrera, setPorCarrera] = useState<ResumenCarrera[]>([]);
  const [porEdificio, setPorEdificio] = useState<ResumenEdificio[]>([]);
  const [topUsuarios, setTopUsuarios] = useState<TopUsuario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelado = false;
    const cargar = async () => {
      setLoading(true);
      try {
        const [ocu, hm, car, ed, top] = await Promise.all([
          statsApi.ocupacionPorEspacio(rango),
          statsApi.heatmapDiaHora(rango),
          statsApi.resumenPorCarrera(rango),
          statsApi.resumenPorEdificio(rango),
          statsApi.topUsuarios({ ...rango, limite: 10 }),
        ]);
        if (cancelado) return;
        setOcupacion(ocu.data ?? []);
        setHeatmap(hm.data ?? []);
        setPorCarrera(car.data ?? []);
        setPorEdificio(ed.data ?? []);
        setTopUsuarios(top.data ?? []);
      } catch (error) {
        console.error('Error cargando estadísticas avanzadas', error);
        toast.error('No se pudieron cargar las métricas avanzadas');
      } finally {
        if (!cancelado) setLoading(false);
      }
    };
    cargar();
    return () => {
      cancelado = true;
    };
  }, [rango]);

  const maxHeatmap = useMemo(
    () => heatmap.reduce((m, c) => (c.cant > m ? c.cant : m), 0),
    [heatmap],
  );
  const matrizHeatmap = useMemo(() => {
    const matrix: Record<number, Record<number, number>> = {};
    for (const dia of [0, 1, 2, 3, 4, 5, 6]) matrix[dia] = {};
    for (const celda of heatmap) {
      matrix[celda.diaSemana][celda.hora] = celda.cant;
    }
    return matrix;
  }, [heatmap]);

  const maxCantEdificio = useMemo(
    () => porEdificio.reduce((m, e) => (e.cantReservas > m ? e.cantReservas : m), 0),
    [porEdificio],
  );

  return (
    <div className="space-y-6">
      {/* Selector de rango */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarRange className="h-4 w-4 text-muted-foreground" />
            Métricas avanzadas
          </CardTitle>
          <div className="flex gap-2">
            {(Object.keys(PRESETS) as RangoPreset[]).map((key) => (
              <Button
                key={key}
                size="sm"
                variant={preset === key ? 'default' : 'outline'}
                onClick={() => setPreset(key)}
              >
                {PRESETS[key].label}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Rango actual: <span className="font-medium">{rango.desde}</span> a <span className="font-medium">{rango.hasta}</span>
          </p>
        </CardContent>
      </Card>

      {/* Heatmap día × hora */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-600" />
            Mapa de calor: día × hora (reservas aprobadas)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-48 animate-pulse rounded bg-gray-100" />
          ) : maxHeatmap === 0 ? (
            <p className="text-sm text-muted-foreground">Sin reservas aprobadas en el rango.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="text-xs border-separate border-spacing-0.5">
                <thead>
                  <tr>
                    <th className="w-10"></th>
                    {HORAS.map((h) => (
                      <th key={h} className="w-7 text-center font-normal text-muted-foreground">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5, 6, 0].map((dia) => (
                    <tr key={dia}>
                      <td className="pr-2 text-right text-muted-foreground">{DIAS_SEMANA[dia]}</td>
                      {HORAS.map((h) => {
                        const cant = matrizHeatmap[dia][h] ?? 0;
                        const intensidad = maxHeatmap === 0 ? 0 : cant / maxHeatmap;
                        const bg = cant === 0
                          ? '#f3f4f6'
                          : `rgba(59, 130, 246, ${0.15 + intensidad * 0.85})`;
                        return (
                          <td
                            key={h}
                            title={`${DIAS_SEMANA[dia]} ${h}:00 → ${cant} reservas`}
                            className="w-7 h-7 text-center align-middle rounded"
                            style={{ background: bg, color: intensidad > 0.5 ? 'white' : '#374151' }}
                          >
                            {cant || ''}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Ocupación por espacio */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              % de ocupación por espacio
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-48 animate-pulse rounded bg-gray-100" />
            ) : ocupacion.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin datos en el rango.</p>
            ) : (
              <div className="space-y-2">
                {ocupacion.slice(0, 10).map((o) => (
                  <div key={o.espacioId} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium truncate">{o.espacioNombre}</span>
                      <span className="text-muted-foreground">
                        {formatHoras(o.horasReservadas)} ({o.porcentaje}%)
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded">
                      <div
                        className="h-2 rounded bg-emerald-500"
                        style={{ width: `${Math.min(100, o.porcentaje)}%` }}
                      />
                    </div>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground pt-2">
                  Denominador: 14h disponibles/día × días del rango.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reservas por edificio */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-purple-600" />
              Reservas por edificio
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-48 animate-pulse rounded bg-gray-100" />
            ) : porEdificio.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin datos en el rango.</p>
            ) : (
              <div className="space-y-3">
                {porEdificio.map((e) => (
                  <div key={`${e.edificioId ?? 'sin'}`} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{e.edificioNombre}</span>
                      <span className="text-muted-foreground">{e.cantReservas}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded">
                      <div
                        className="h-2 rounded bg-purple-500"
                        style={{
                          width: `${maxCantEdificio === 0 ? 0 : (e.cantReservas / maxCantEdificio) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tasa de cancelación por carrera */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-orange-600" />
              Tasa de cancelación por carrera
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-48 animate-pulse rounded bg-gray-100" />
            ) : porCarrera.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin datos en el rango.</p>
            ) : (
              <div className="space-y-2">
                {porCarrera.slice(0, 10).map((c) => (
                  <div
                    key={`${c.carreraId ?? 'sin'}-${c.carreraNombre}`}
                    className="flex items-center justify-between text-sm p-2 rounded hover:bg-gray-50"
                  >
                    <span className="truncate flex-1 mr-3">{c.carreraNombre}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {c.aprobadas} aprob.
                      </span>
                      <Badge
                        variant={c.tasaCancelacion > 15 ? 'destructive' : 'outline'}
                        className="w-16 justify-center"
                      >
                        {c.tasaCancelacion}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top usuarios reservadores */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              Top 10 usuarios reservadores
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-48 animate-pulse rounded bg-gray-100" />
            ) : topUsuarios.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin datos en el rango.</p>
            ) : (
              <div className="space-y-1">
                {topUsuarios.map((u, idx) => (
                  <div
                    key={u.usuarioId}
                    className="flex items-center justify-between text-sm p-2 rounded hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Badge variant="outline" className="w-8 justify-center shrink-0">
                        {idx + 1}
                      </Badge>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{u.nombre}</div>
                        <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                      </div>
                    </div>
                    <span className="font-semibold shrink-0 ml-2">{u.cantReservas}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
