import type { ReactNode } from 'react';

import type { AppInfo, HealthInfo, MetricInfo } from '@/lib/types/actuator';
import type { ActiveUsersStats } from '@/lib/types/system';
import type { PoolMetrics, TrafficMetrics } from '@/hooks/useSystemMetrics';
import type { MetricsChartDataPoint } from '@/components/ui/metrics-chart';

import { MetricsCards } from '@/components/system/sections/MetricsCards';
import { RuntimeCards } from '@/components/system/sections/RuntimeCards';
import { PoolCard } from '@/components/system/sections/PoolCard';
import { TrafficCard } from '@/components/system/sections/TrafficCard';
import { ActiveUsersCard } from '@/components/system/sections/ActiveUsersCard';
import { AppInfoCard } from '@/components/system/sections/AppInfoCard';
import { ExternalServicesCard } from '@/components/system/sections/ExternalServicesCard';
import { JvmCharts } from '@/components/system/sections/JvmCharts';
import { JvmDetailsTable } from '@/components/system/sections/JvmDetailsTable';
import { HttpTraceTable } from '@/components/ui/http-trace-table';
import { LiquibaseTimeline } from '@/components/ui/liquibase-timeline';

/**
 * La pantalla de Sistema, pieza por pieza.
 *
 * Todo va con su tipo real y no con `as never`: son tarjetas que desarman el
 * dato campo por campo, así que un objeto de muestra con nombres inventados
 * rompe en el navegador en lugar de en el compilador. Ya pasó una vez con el
 * log de auditoría.
 *
 * Los datos imitan un sistema con algo mal a propósito —un servicio caído, el
 * pool con conexiones esperando, 2,3 % de error— porque el estado sano no
 * muestra cómo se ve una alerta.
 */

function Caja({ titulo, nota, ancho, children }: Readonly<{
  titulo: string; nota?: string; ancho?: boolean; children: ReactNode;
}>) {
  return (
    <div className={`min-w-0 rounded-lg border border-border bg-card p-3 ${ancho ? '@md:col-span-2' : ''}`}>
      <p className="text-xs font-medium text-foreground">{titulo}</p>
      {nota && <p className="text-[11px] leading-snug text-muted-foreground">{nota}</p>}
      <div className="mt-2">{children}</div>
    </div>
  );
}

const metrica = (valor: number, baseUnit?: string): MetricInfo => ({
  measurements: [{ statistic: 'VALUE', value: valor }],
  baseUnit,
});

const salud: HealthInfo = {
  status: 'DOWN',
  components: {
    db: { status: 'UP', details: { database: 'PostgreSQL', validationQuery: 'isValid()' } },
    diskSpace: { status: 'UP', details: { total: 5.1e11, free: 2.4e11, threshold: 1e7 } },
    mail: { status: 'UP' },
    minio: { status: 'UP' },
    aiSvc: { status: 'DOWN', details: { error: 'Connection refused: localhost/127.0.0.1:8001' } },
    mlSvc: { status: 'DOWN', details: { error: 'Connection refused: localhost/127.0.0.1:8000' } },
    ping: { status: 'UP' },
  },
};

const info: AppInfo = {
  app: {
    name: 'utec-space-manager-backend',
    version: '1.4.0',
    environment: 'dev',
    description: 'Gestión de espacios de UTEC',
    'java.version': '25.0.1',
  },
};

const pool: PoolMetrics = { activas: 7, libres: 3, maximo: 10, esperando: 2 };

const trafico: TrafficMetrics = {
  peticiones: 148_302,
  demoraMediaMs: 42,
  demoraMaximaMs: 1_840,
  errores: 3_411,
  porcentajeError: 2.3,
};

const usuarios: ActiveUsersStats = {
  totalActiveUsers: 6,
  activeUsers: [
    { email: 'admin@utec.edu.uy', nombre: 'Usuario Admin', rol: 'ADMIN', lastActivity: '2026-09-17T23:04:00', ipAddress: '192.168.1.24', userAgent: 'Chrome/122 · Linux' },
    { email: 'analista@utec.edu.uy', nombre: 'Usuario Analista', rol: 'ANALISTA', lastActivity: '2026-09-17T23:01:00', ipAddress: '192.168.1.31', userAgent: 'Firefox/130 · Windows' },
    { email: 'docente15@utec.edu.uy', nombre: 'Docente Quince', rol: 'DOCENTE', lastActivity: '2026-09-17T22:58:00', ipAddress: '10.0.0.8', userAgent: 'Safari/17 · macOS' },
    { email: 'estudiante@utec.edu.uy', nombre: 'Usuario Estudiante', rol: 'ESTUDIANTE', lastActivity: '2026-09-17T22:55:00', ipAddress: '10.0.0.44', userAgent: 'Chrome/122 · Android' },
    { email: 'externo07@gmail.com', nombre: 'Externo Siete', rol: 'EXTERNO', lastActivity: '2026-09-17T22:41:00', ipAddress: '201.45.8.12', userAgent: 'Chrome/121 · Windows' },
    { email: 'mantenimiento2@utec.edu.uy', nombre: 'Mantenimiento Dos', rol: 'MANTENIMIENTO', lastActivity: '2026-09-17T22:30:00', ipAddress: '192.168.1.55', userAgent: 'Edge/122 · Windows' },
  ],
};

/** Una hora de muestras, una por minuto. */
const historia: MetricsChartDataPoint[] = Array.from({ length: 60 }, (_, i) => ({
  time: `${String(Math.floor(i / 60) + 22).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}`,
  timestamp: Date.now() - (60 - i) * 60_000,
  memory: 55 + Math.round(18 * Math.sin(i / 8)) + (i % 5),
  cpu: 12 + Math.round(9 * Math.sin(i / 5)) + (i % 3),
  threads: 38 + Math.round(6 * Math.sin(i / 11)),
}));

const traza = {
  traces: [
    { timestamp: '2026-09-17T23:04:12Z', request: { method: 'GET', uri: 'http://localhost:8080/api/v1/reservas?estado=PENDIENTE' }, response: { status: 200 }, timeTaken: 'PT0.042S' },
    { timestamp: '2026-09-17T23:04:08Z', request: { method: 'PATCH', uri: 'http://localhost:8080/api/v1/reservas/42' }, response: { status: 200 }, timeTaken: 'PT0.118S' },
    { timestamp: '2026-09-17T23:03:57Z', request: { method: 'GET', uri: 'http://localhost:8080/api/v1/stats/reservas/resumen' }, response: { status: 401 }, timeTaken: 'PT0.009S' },
    { timestamp: '2026-09-17T23:03:41Z', request: { method: 'POST', uri: 'http://localhost:8080/api/v1/inventario/importar' }, response: { status: 500 }, timeTaken: 'PT1.840S' },
    { timestamp: '2026-09-17T23:03:30Z', request: { method: 'GET', uri: 'http://localhost:8080/actuator/health' }, response: { status: 503 }, timeTaken: 'PT0.021S' },
  ],
} as never;

const liquibase = {
  contexts: {
    'utec-space-manager-backend': {
      liquibaseBeans: {
        liquibase: {
          changeSets: [
            { id: '001-crear-usuarios', author: 'utec', execType: 'EXECUTED', dateExecuted: '2026-02-25T10:00:00', description: 'createTable usuarios', checksum: '8:a1b2', changeLog: 'db/changelog/001.xml' },
            { id: '014-espacios-imagen', author: 'utec', execType: 'EXECUTED', dateExecuted: '2026-07-11T09:12:00', description: 'addColumn imagen_url', checksum: '8:c3d4', changeLog: 'db/changelog/014.xml' },
            { id: '021-materias', author: 'utec', execType: 'EXECUTED', dateExecuted: '2026-09-02T18:40:00', description: 'createTable materias, inscripciones', checksum: '8:e5f6', changeLog: 'db/changelog/021.xml' },
          ],
        },
      },
    },
  },
} as never;

export function PantallaSistema() {
  return (
    <div className="grid gap-3 @md:grid-cols-2 @5xl:grid-cols-3">
      <Caja titulo="MetricsCards" nota="La fila de arriba. Acá con un servicio caído." ancho>
        <MetricsCards
          health={salud}
          memoryMetrics={metrica(1.45e9, 'bytes')}
          memoryMaxMetrics={metrica(2.1e9, 'bytes')}
          cpuMetrics={metrica(0.17)}
          uptimeMetrics={metrica(1_036_800, 'seconds')}
          metricsHistory={historia}
          statusSince={new Date('2026-09-17T21:40:00')}
        />
      </Caja>

      <Caja titulo="RuntimeCards" nota="Pool, recolección de basura y uptime." ancho>
        <RuntimeCards pool={pool} gcMetrics={metrica(3.42, 'seconds')} uptimeMetrics={metrica(1_036_800, 'seconds')} />
      </Caja>

      <Caja titulo="PoolCard" nota="Con dos conexiones esperando.">
        <PoolCard pool={pool} />
      </Caja>

      <Caja titulo="TrafficCard" nota="2,3 % de error.">
        <TrafficCard traffic={trafico} uptimeSeconds={1_036_800} />
      </Caja>

      <Caja titulo="ExternalServicesCard" nota="aiSvc y mlSvc abajo.">
        <ExternalServicesCard health={salud} />
      </Caja>

      <Caja titulo="AppInfoCard" nota="Versión y entorno.">
        <AppInfoCard info={info} />
      </Caja>

      <Caja titulo="ActiveUsersCard" nota="Un usuario por rol." ancho>
        <ActiveUsersCard data={usuarios} />
      </Caja>

      <Caja titulo="JvmCharts" nota="Memoria, CPU e hilos de la última hora." ancho>
        <JvmCharts metricsHistory={historia} />
      </Caja>

      <Caja titulo="JvmDetailsTable" nota="El detalle numérico de lo mismo." ancho>
        <JvmDetailsTable
          memoryMetrics={metrica(1.45e9, 'bytes')}
          memoryMaxMetrics={metrica(2.1e9, 'bytes')}
          cpuMetrics={metrica(0.17)}
          threadsMetrics={metrica(41)}
          gcMetrics={metrica(3.42, 'seconds')}
          uptimeMetrics={metrica(1_036_800, 'seconds')}
          httpMetrics={metrica(148_302)}
        />
      </Caja>

      <Caja titulo="HttpTraceTable" nota="Últimas peticiones, con un 500 y un 503." ancho>
        <HttpTraceTable data={traza} />
      </Caja>

      <Caja titulo="LiquibaseTimeline" nota="Migraciones aplicadas." ancho>
        <LiquibaseTimeline data={liquibase} health={salud} />
      </Caja>
    </div>
  );
}
