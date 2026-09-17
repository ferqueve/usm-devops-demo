import type { ReactNode } from 'react';
import { GraduationCap, Sparkles } from 'lucide-react';

import { MARCA } from '@/lib/design/paleta';
import { IaEnPantallas } from '@/components/asistente/IaEnPantallas';
import { CatalogoCrudShell } from '@/components/common/CatalogoCrudShell';
import { EventosDescubrir } from '@/components/eventos/EventosDescubrir';
import { RecomendacionList } from '@/components/recomendaciones/RecomendacionList';
import { RecomendacionPanel } from '@/components/recomendaciones/RecomendacionPanel';
import { DatabaseSection } from '@/components/system/sections/DatabaseSection';
import { HttpTraceSection } from '@/components/system/sections/HttpTraceSection';
import { LogsSection } from '@/components/system/sections/LogsSection';
import { SystemHeader } from '@/components/system/SystemHeader';
import { ErrorsTab } from '@/components/system/tabs/ErrorsTab';

/**
 * Lo que faltaba para cerrar el inventario.
 *
 * Son los componentes que no entraban en ninguna de las familias anteriores:
 * las secciones grandes de Sistema, los dos contenedores genéricos de
 * recomendaciones, el shell de catálogo que usan cuatro pantallas de ABM y la
 * grilla pública de eventos.
 */

const noop = () => {};

function Caja({ titulo, nota, ancho, children }: Readonly<{
  titulo: string; nota?: string; ancho?: boolean; children: ReactNode;
}>) {
  return (
    <div className={`min-w-0 rounded-lg border border-border bg-card p-3 ${ancho ? 'sm:col-span-2' : ''}`}>
      <p className="text-xs font-medium text-foreground">{titulo}</p>
      {nota && <p className="text-[11px] leading-snug text-muted-foreground">{nota}</p>}
      <div className="mt-2 overflow-auto">{children}</div>
    </div>
  );
}

const salud = {
  status: 'DOWN',
  components: {
    db: { status: 'UP', details: { database: 'PostgreSQL', validationQuery: 'isValid()' } },
    aiSvc: { status: 'DOWN', details: { error: 'Connection refused' } },
  },
} as never;

const liquibase = {
  contexts: {
    'utec-space-manager-backend': {
      liquibaseBeans: {
        liquibase: {
          changeSets: [
            { id: '001-crear-usuarios', author: 'utec', execType: 'EXECUTED', dateExecuted: '2026-02-25T10:00:00', description: 'createTable usuarios', checksum: '8:a1b2', changeLog: 'db/changelog/001.xml' },
            { id: '021-materias', author: 'utec', execType: 'EXECUTED', dateExecuted: '2026-09-02T18:40:00', description: 'createTable materias', checksum: '8:e5f6', changeLog: 'db/changelog/021.xml' },
          ],
        },
      },
    },
  },
} as never;

const traza = {
  traces: [
    { timestamp: '2026-09-17T23:04:12Z', request: { method: 'GET', uri: 'http://localhost:8080/api/v1/reservas' }, response: { status: 200 }, timeTaken: 'PT0.042S' },
    { timestamp: '2026-09-17T23:03:41Z', request: { method: 'POST', uri: 'http://localhost:8080/api/v1/inventario/importar' }, response: { status: 500 }, timeTaken: 'PT1.840S' },
    { timestamp: '2026-09-17T23:03:30Z', request: { method: 'GET', uri: 'http://localhost:8080/actuator/health' }, response: { status: 503 }, timeTaken: 'PT0.021S' },
    { timestamp: '2026-09-17T23:02:58Z', request: { method: 'GET', uri: 'http://localhost:8080/api/v1/stats/reservas/resumen' }, response: { status: 401 }, timeTaken: 'PT0.009S' },
  ],
} as never;

const loggers = {
  levels: ['OFF', 'ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE'],
  loggers: {
    ROOT: { configuredLevel: 'INFO', effectiveLevel: 'INFO' },
    'com.utec.backend': { configuredLevel: 'DEBUG', effectiveLevel: 'DEBUG' },
    'org.hibernate.SQL': { configuredLevel: null, effectiveLevel: 'INFO' },
  },
} as never;

const LOG = [
  '2026-09-17 23:03:30.201  WARN 3472436 --- [http-nio-8080-exec-4] c.u.b.health.AiServiceIndicator : aiSvc no responde (timeout 2000 ms)',
  '2026-09-17 23:03:41.884 ERROR 3472436 --- [http-nio-8080-exec-9] c.u.b.controller.InventarioController : Error importando CSV: fila 14 sin tipoElementoId',
  '2026-09-17 23:04:12.044  INFO 3472436 --- [http-nio-8080-exec-2] c.u.b.controller.ReservaController : 240 reservas devueltas en 42 ms',
].join('\n');

const RECOMENDACIONES = [
  { tipoRecomendacion: 'ESPACIO', puntaje: 0.87, razon: 'Coincide con la capacidad pedida y estuvo libre las últimas tres semanas en esa franja.', metadata: { espacioNombre: 'Aula teórica 4' } },
  { tipoRecomendacion: 'HORARIO', puntaje: 0.74, razon: 'A las 16:00 hay menos competencia por el mismo espacio.', metadata: { hora: 16 } },
  { tipoRecomendacion: 'ANALISTA', puntaje: 0.66, razon: 'Resolvió 218 solicitudes con una mediana de 4 horas.', metadata: { nombre: 'Usuario Analista' } },
] as never;

const CATALOGO = [
  { id: 1, nombre: 'Aula teórica', descripcion: 'Sillas fijas y pizarrón', color: MARCA.azul },
  { id: 2, nombre: 'Laboratorio', descripcion: 'Con equipamiento específico', color: MARCA.verde },
  { id: 3, nombre: 'Anfiteatro', descripcion: 'Butacas en pendiente', color: MARCA.naranja },
] as never;

const EVENTOS = [
  { id: 1, titulo: 'Hackathon de Datos', tipo: 'EVENTO', estado: 'PUBLICADO', inicio: '2026-09-20T19:00:00', fin: '2026-09-20T23:00:00', espacioNombre: 'Anfiteatro', cupo: 100, plazasDisponibles: 26, tags: 'datos,ia', patron: 'circuito' },
  { id: 2, titulo: 'Charla: Energías Renovables', tipo: 'CHARLA', estado: 'PUBLICADO', inicio: '2026-09-22T18:30:00', fin: '2026-09-22T20:00:00', espacioNombre: 'Aula 8', cupo: 30, plazasDisponibles: 0, tags: 'energia', patron: 'aurora' },
  { id: 3, titulo: 'Taller de Impresión 3D', tipo: 'CURSO', estado: 'PUBLICADO', inicio: '2026-09-19T14:00:00', fin: '2026-09-19T17:00:00', espacioNombre: 'Laboratorio Mecatrónica', cupo: 25, plazasDisponibles: 13, tags: 'fabricacion', patron: 'grilla' },
] as never;

export function Ultimos() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Caja titulo="SystemHeader" nota="La cabecera de Sistema, con auto-refresco y error de conexión." ancho>
        <SystemHeader
          hasConnectionError
          autoRefresh
          setAutoRefresh={noop}
          isRefreshing={false}
          handleRefresh={noop}
        />
      </Caja>

      <Caja titulo="DatabaseSection" nota="Estado de la base y migraciones aplicadas." ancho>
        <DatabaseSection health={salud} liquibase={liquibase} />
      </Caja>

      <Caja titulo="HttpTraceSection" nota="Las últimas peticiones." ancho>
        <HttpTraceSection httpTrace={traza} />
      </Caja>

      <Caja titulo="ErrorsTab" nota="Sólo lo que falló: un 500, un 503 y un 401." ancho>
        <ErrorsTab httpTrace={traza} />
      </Caja>

      <Caja titulo="LogsSection" nota="Niveles por logger y el archivo de log." ancho>
        <LogsSection
          loggers={loggers}
          logFile={LOG}
          onLoggerUpdate={async () => {}}
          onRefreshLog={noop}
        />
      </Caja>

      <Caja titulo="RecomendacionList" nota="Lista genérica de recomendaciones.">
        <RecomendacionList recomendaciones={RECOMENDACIONES} onSelect={noop} />
      </Caja>

      <Caja titulo="RecomendacionPanel" nota="La misma lista, con título e icono.">
        <RecomendacionPanel
          title="Espacios sugeridos"
          icon={<Sparkles className="size-4" />}
          recomendaciones={RECOMENDACIONES}
          onSelect={noop}
        />
      </Caja>

      <Caja titulo="CatalogoCrudShell" nota="El shell de ABM que usan cuatro pantallas." ancho>
        <CatalogoCrudShell
          title="Tipos de espacio"
          description="Cómo se clasifica cada espacio del campus."
          Icon={GraduationCap}
          accentColor={MARCA.azul}
          loading={false}
          items={CATALOGO}
          emptyLabel="Todavía no hay tipos."
          createLabel="Nuevo tipo"
          onCreate={noop}
          onEdit={noop}
          onDelete={noop}
          renderRowMeta={(t: { descripcion?: string }) => (
            <span className="text-xs text-muted-foreground">{t.descripcion}</span>
          )}
        />
      </Caja>

      <Caja titulo="EventosDescubrir" nota="La grilla pública de eventos." ancho>
        <EventosDescubrir
          eventos={EVENTOS}
          misInscripciones={[] as never}
          hayFiltro={false}
          idsInscripto={new Set([1])}
          onNavigate={noop}
          onInscribirse={noop}
          onCancelar={noop}
          onEditar={noop}
          onEliminar={noop}
          onTag={noop}
          inscribiendo={null}
          cancelando={null}
        />
      </Caja>

      <Caja titulo="IaEnPantallas" nota="Dónde aparece el asistente dentro del sistema." ancho>
        <IaEnPantallas />
      </Caja>
    </div>
  );
}
