import { useState, type ReactNode } from 'react';

import { MARCA } from '@/lib/design/paleta';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Panel } from '@/components/dashboard/views/_components/Panel';
import { EmptyState } from '@/components/dashboard/views/_components/EmptyState';
import { StatStrip } from '@/components/dashboard/views/_components/StatStrip';
import { TemaGraficosContexto } from '@/components/statistics/graficos/tema';
import { GraficosDashboard, GraficosEstadisticas } from './_graficos';
import { FilasDominio, PiezasSistema } from './_dominio';
import { KPIS } from './_datos';
import { Inventario } from './_inventario';
import { Paleta } from './_paleta';
import { Dialogos } from './_dialogos';
import { TarjetasDominio } from './_tarjetas';
import { PantallaSistema } from './_sistema';
import { PiezasAnalisis } from './_analisis';
import { Dashboards } from './_dashboards';
import { ListasYFiltros } from './_listas';
import { Ultimos } from './_ultimos';

/**
 * Catálogo de la base visual.
 *
 * Existe para poder decidir cómo se ve una primitiva mirando una sola
 * pantalla, en vez de abrir las diecisiete que la usan. Todo lo que se ve acá
 * son los componentes reales de la app, no maquetas: si algo se ve mal en esta
 * página, se ve mal en producción.
 *
 * Los dos temas van lado a lado a propósito. El modo oscuro se rompe callado
 * —un gris fijo que nadie miró, un texto que pierde contraste— y revisarlo
 * cambiando de tema y volviendo hace que esas cosas pasen desapercibidas.
 *
 * Sólo se monta en desarrollo (ver App.tsx): es una herramienta de trabajo, no
 * una pantalla del sistema.
 */

/* ------------------------------------------------------------------ *
 * Andamiaje de la página
 * ------------------------------------------------------------------ */

function Seccion({ id, titulo, nota, children }: Readonly<{
  id: string; titulo: string; nota?: string; children: ReactNode;
}>) {
  return (
    <section id={id} className="scroll-mt-20">
      <div className="mb-3 flex items-baseline gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">{titulo}</h2>
        {nota && <p className="text-xs text-muted-foreground">{nota}</p>}
      </div>
      {children}
    </section>
  );
}

/**
 * Renderiza lo mismo dos veces, una por tema.
 *
 * El panel oscuro lleva la clase `.dark` en su contenedor: los tokens se
 * redefinen ahí y bajan por herencia, así que los componentes de adentro no se
 * enteran de nada y se pintan solos.
 */
function Doble({ children }: Readonly<{ children: ReactNode }>) {
  // `text-foreground` va explícito: el color de texto lo pone <body> y se
  // hereda, así que sin esto los títulos y las celdas de tabla del panel
  // oscuro seguían con la tinta del tema claro.
  /*
   * `@container`: lo de adentro se acomoda según el ancho del panel, no el de
   * la ventana. Hace falta porque los dos temas van lado a lado: en una
   * pantalla de 3440 px cada panel mide ~1700, pero un breakpoint de viewport
   * como `2xl:` se dispararía a 1536 px de ventana, cuando cada panel todavía
   * mide 750. Con consultas de contenedor la grilla crece cuando de verdad
   * hay lugar.
   */
  const pared =
    '@container min-w-0 flex-1 rounded-lg border border-border bg-background p-4 text-foreground';
  return (
    <div className="flex flex-col gap-3 md:flex-row">
      <TemaGraficosContexto.Provider value="claro">
        <div className={pared}>
          <p className="mb-3 text-2xs font-medium uppercase tracking-wider text-muted-foreground">
            Claro
          </p>
          {children}
        </div>
      </TemaGraficosContexto.Provider>
      <TemaGraficosContexto.Provider value="oscuro">
        <div className={`dark ${pared}`}>
          <p className="mb-3 text-2xs font-medium uppercase tracking-wider text-muted-foreground">
            Oscuro
          </p>
          {children}
        </div>
      </TemaGraficosContexto.Provider>
    </div>
  );
}

/** Fila de ejemplos con su etiqueta al costado. */
function Muestra({ label, children }: Readonly<{ label: string; children: ReactNode }>) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border py-2.5 last:border-b-0">
      <span className="w-32 shrink-0 text-xs text-muted-foreground">{label}</span>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Página
 * ------------------------------------------------------------------ */

const INDICE = [
  ['inventario', 'Inventario'],
  ['paleta', 'Paleta'],
  ['tipografia', 'Tipografía'],
  ['controles', 'Controles'],
  ['datos', 'Datos'],
  ['bloques', 'Bloques'],
  ['dashboards', 'Dashboards'],
  ['dialogos', 'Diálogos'],
  ['tarjetas', 'Tarjetas'],
  ['listas', 'Listas'],
  ['dominio', 'Filas'],
  ['sistema', 'Sistema'],
  ['sistema-full', 'Sistema · pantalla'],
  ['graficos', 'Gráficos'],
  ['graficos-stats', 'Análisis'],
  ['ultimos', 'Resto'],
  ['piezas-analisis', 'Piezas'],
] as const;

export default function UiPage() {
  const [pestana, setPestana] = useState('resumen');

  return (
    <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-10 border-b border-border bg-card/90 backdrop-blur">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-6 py-3">
            <div className="mr-auto">
              <h1 className="text-base font-semibold tracking-tight text-foreground">
                Base visual
              </h1>
              <p className="text-xs text-muted-foreground">
                Componentes reales, los dos temas a la vez
              </p>
            </div>
            <nav className="flex flex-wrap gap-1">
              {INDICE.map(([id, label]) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className="rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  {label}
                </a>
              ))}
            </nav>
          </div>
        </header>

        <main className="flex flex-col gap-10 px-6 py-8">
          <Seccion
            id="inventario"
            titulo="Inventario"
            nota="Qué hay en el sistema y cuánto está acá. Se genera solo; no se anota a mano."
          >
            <Inventario />
          </Seccion>

          <Seccion
            id="paleta"
            titulo="Paleta"
            nota="Todo lo que define el tema, resuelto en vivo del CSS aplicado. Si cambia un token, esta tabla lo muestra sola."
          >
            <Doble>
              <Paleta />
            </Doble>
          </Seccion>

          <Seccion id="tipografia" titulo="Tipografía" nota="Poppins. Gilroy cuando esté licenciada.">
            <Doble>
              <div className="space-y-1">
                <h1>Título de pantalla</h1>
                <h2>Título de sección</h2>
                <h3>Subtítulo</h3>
                <p className="text-foreground">
                  Texto corrido a 14 px. Es el tamaño de la interfaz: compacto para una
                  consola de trabajo, sobre espaciado de 16 px.
                </p>
                <p className="text-muted-foreground">Texto apagado, para aclaraciones.</p>
                <p className="font-mono tabular-nums text-foreground">
                  #A16D · 20:30 · 4.678 · 67 %
                </p>
                <p className="font-utec text-lg text-foreground">Fuente UTEC · sólo marca</p>
              </div>
            </Doble>
          </Seccion>

          <Seccion id="controles" titulo="Controles">
            <Doble>
              <div className="space-y-0">
                <Muestra label="Botones">
                  <Button>Guardar cambios</Button>
                  <Button variant="secondary">Secundario</Button>
                  <Button variant="outline">Contorno</Button>
                  <Button variant="ghost">Fantasma</Button>
                  <Button variant="destructive">Eliminar</Button>
                  <Button variant="link">Enlace</Button>
                </Muestra>
                <Muestra label="Tamaños">
                  <Button size="sm">Chico</Button>
                  <Button>Normal</Button>
                  <Button size="lg">Grande</Button>
                  <Button disabled>Deshabilitado</Button>
                </Muestra>
                <Muestra label="Etiquetas">
                  <Badge>Por defecto</Badge>
                  <Badge variant="secondary">Secundaria</Badge>
                  <Badge variant="outline">Contorno</Badge>
                  <Badge variant="destructive">Destructiva</Badge>
                </Muestra>
                <Muestra label="Estados">
                  <StatusBadge status="success" label="Aprobada" />
                  <StatusBadge status="warning" label="Pendiente" />
                  <StatusBadge status="error" label="Cancelada" />
                  <StatusBadge status="info" label="En curso" />
                  <StatusBadge status="neutral" label="Vencida" />
                </Muestra>
                <Muestra label="Entrada">
                  <div className="w-52">
                    <Label htmlFor="ui-buscar" className="mb-1 block text-xs">Buscar</Label>
                    <Input id="ui-buscar" placeholder="Aula, docente o código…" />
                  </div>
                  <div className="flex items-center gap-2 pt-5">
                    <Checkbox id="ui-check" defaultChecked />
                    <Label htmlFor="ui-check" className="text-xs">Solo pendientes</Label>
                  </div>
                  <div className="flex items-center gap-2 pt-5">
                    <Switch id="ui-switch" defaultChecked />
                    <Label htmlFor="ui-switch" className="text-xs">Activo</Label>
                  </div>
                </Muestra>
                <Muestra label="Pestañas">
                  <Tabs value={pestana} onValueChange={setPestana}>
                    <TabsList>
                      <TabsTrigger value="resumen">Resumen</TabsTrigger>
                      <TabsTrigger value="uso">Uso</TabsTrigger>
                      <TabsTrigger value="espacios">Espacios</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </Muestra>
                <Muestra label="Foco">
                  <Button className="ring-2 ring-ring ring-offset-2 ring-offset-background">
                    Así se ve el foco
                  </Button>
                </Muestra>
                <Muestra label="Cargando">
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-8 w-20" />
                </Muestra>
              </div>
            </Doble>
          </Seccion>

          <Seccion id="datos" titulo="Datos">
            <Doble>
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Espacio</TableHead>
                      <TableHead>Horario</TableHead>
                      <TableHead className="text-right">Cap.</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      ['Laboratorio Mecatrónica', '20:30 – 22:00', 25, 'success', 'Aprobada'],
                      ['Aula teórica 4', '18:30 – 19:30', 30, 'warning', 'Pendiente'],
                      ['Sala de Lactancia', '09:00 – 09:30', 5, 'error', 'Cancelada'],
                    ].map(([espacio, hora, cap, estado, etiqueta]) => (
                      <TableRow key={String(espacio)}>
                        <TableCell className="font-medium">{espacio}</TableCell>
                        <TableCell className="font-mono tabular-nums text-muted-foreground">{hora}</TableCell>
                        <TableCell className="text-right tabular-nums">{cap}</TableCell>
                        <TableCell>
                          <StatusBadge
                            status={estado as 'success' | 'warning' | 'error'}
                            label={String(etiqueta)}
                            icon={false}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Separator />
                <EmptyState title="Sin pendientes." />
              </div>
            </Doble>
          </Seccion>

          <Seccion id="bloques" titulo="Bloques" nota="Los contenedores que arman una pantalla.">
            <Doble>
              <div className="space-y-3">
                <StatStrip items={KPIS} />
                <Panel title="Cola" count="3 pendientes" accentColor={MARCA.amarillo}>
                  <div className="space-y-1.5 text-xs">
                    <p className="text-foreground">Charla invitada · Aula 8 · 1.5 h</p>
                    <p className="text-foreground">Tutoría · Aula 9 · 1 h</p>
                    <p className="text-muted-foreground">Defensa de tesis · Aula teórica 3</p>
                  </div>
                </Panel>
              </div>
            </Doble>
          </Seccion>

          <Seccion
            id="dashboards"
            titulo="Dashboards"
            nota="Los seis por rol con el mismo dato, y los catorce bloques con que se arman."
          >
            <Doble>
              <Dashboards />
            </Doble>
          </Seccion>

          <Seccion
            id="dialogos"
            titulo="Diálogos"
            nota="Se abren de verdad. Van en portal sobre el body, así que toman el tema global y no el del panel."
          >
            <Dialogos />
          </Seccion>

          <Seccion
            id="tarjetas"
            titulo="Tarjetas"
            nota="Con las que se listan espacios, eventos, tutorías y recomendaciones."
          >
            <Doble>
              <TarjetasDominio />
            </Doble>
          </Seccion>

          <Seccion
            id="listas"
            titulo="Listas, tablas y filtros"
            nota="Cada módulo tiene su tabla, su vista de fichas y su barra de filtros, escritas por separado."
          >
            <Doble>
              <ListasYFiltros />
            </Doble>
          </Seccion>

          <Seccion
            id="dominio"
            titulo="Dominio"
            nota="Las filas con las que se listan reservas, materias, tutorías y eventos."
          >
            <Doble>
              <FilasDominio />
            </Doble>
          </Seccion>

          <Seccion
            id="sistema"
            titulo="Sistema"
            nota="Tarjetas y series de la pantalla de Sistema. Faltan LogViewer y HttpTraceTable: traen sus propios datos y el catálogo tiene que abrir sin backend."
          >
            <Doble>
              <PiezasSistema />
            </Doble>
          </Seccion>

          <Seccion
            id="sistema-full"
            titulo="Sistema · la pantalla entera"
            nota="Con un servicio caído y el pool con espera: el estado sano no muestra cómo se ve una alerta."
          >
            <Doble>
              <PantallaSistema />
            </Doble>
          </Seccion>

          <Seccion
            id="graficos"
            titulo="Gráficos del dashboard"
            nota="Compactos, acompañan una lista."
          >
            <Doble>
              <GraficosDashboard />
            </Doble>
          </Seccion>

          <Seccion
            id="piezas-analisis"
            titulo="Piezas de Estadísticas y Predicciones"
            nota="Acá aparecen un segundo Panel y un segundo EmptyState, cada uno hecho por su cuenta."
          >
            <Doble>
              <PiezasAnalisis />
            </Doble>
          </Seccion>

          <Seccion
            id="graficos-stats"
            titulo="Gráficos de análisis"
            nota="Los catorce de la pantalla de Estadísticas."
          >
            <Doble>
              <GraficosEstadisticas />
            </Doble>
          </Seccion>
          <Seccion
            id="ultimos"
            titulo="El resto"
            nota="Lo que no entraba en ninguna familia: secciones de Sistema, contenedores genéricos y la grilla pública de eventos."
          >
            <Doble>
              <Ultimos />
            </Doble>
          </Seccion>
        </main>
      </div>
  );
}
