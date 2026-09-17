import { useState, type ReactNode } from 'react';
import { Calendar, Inbox, Users } from 'lucide-react';

import {
  DEPARTAMENTO,
  MARCA,
  SERIE_CLARO,
  SERIE_OSCURO,
  contraste,
  tintaSobre,
} from '@/lib/design/paleta';
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
import { Anillo, BarrasHorizontales, Tendencia } from '@/components/dashboard/views/_components/Graficos';

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

const SERIE_MESES: Record<string, number> = {
  '2026-04': 820, '2026-05': 1180, '2026-06': 960, '2026-07': 1540,
  '2026-08': 2100, '2026-09': 1870,
};

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
  const pared = 'min-w-0 flex-1 rounded-lg border border-border bg-background p-4 text-foreground';
  return (
    <div className="flex flex-col gap-3 lg:flex-row">
      <div className={pared}>
        <p className="mb-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Claro
        </p>
        {children}
      </div>
      <div className={`dark ${pared}`}>
        <p className="mb-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Oscuro
        </p>
        {children}
      </div>
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
 * Color
 * ------------------------------------------------------------------ */

/** Pastilla de color con su hex y el contraste del texto que lleva encima. */
function Chip({ hex, nombre, detalle }: Readonly<{ hex: string; nombre: string; detalle?: string }>) {
  const tinta = tintaSobre(hex);
  const ratio = contraste(hex, tinta);
  return (
    <div className="min-w-0 overflow-hidden rounded-lg border border-border">
      <div className="px-3 py-4" style={{ backgroundColor: hex, color: tinta }}>
        <div className="text-xs font-semibold">{nombre}</div>
        <div className="mt-0.5 font-mono text-[10px] opacity-80">{hex.toUpperCase()}</div>
      </div>
      <div className="bg-card px-3 py-1.5">
        <div className="font-mono text-[10px] text-muted-foreground">
          {ratio.toFixed(2)}:1
          <span className={ratio >= 4.5 ? ' text-utec-green' : ' text-utec-orange'}>
            {ratio >= 4.5 ? ' AA' : ' bajo'}
          </span>
        </div>
        {detalle && <div className="truncate text-[10px] text-muted-foreground">{detalle}</div>}
      </div>
    </div>
  );
}

/** Muestra un token del tema leyendo su valor ya resuelto del CSS. */
function Token({ nombre, variable }: Readonly<{ nombre: string; variable: string }>) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="size-9 shrink-0 rounded-md border border-border"
        style={{ backgroundColor: `var(${variable})` }}
        aria-hidden
      />
      <span className="min-w-0">
        <span className="block truncate text-xs font-medium text-foreground">{nombre}</span>
        <span className="block truncate font-mono text-[10px] text-muted-foreground">{variable}</span>
      </span>
    </div>
  );
}

const TOKENS: Array<[string, string]> = [
  ['Fondo', '--background'],
  ['Tarjeta', '--card'],
  ['Texto', '--foreground'],
  ['Texto apagado', '--muted-foreground'],
  ['Acción', '--primary'],
  ['Secundario', '--secondary'],
  ['Apagado', '--muted'],
  ['Acento', '--accent'],
  ['Destructivo', '--destructive'],
  ['Borde', '--border'],
  ['Foco', '--ring'],
  ['Barra lateral', '--sidebar'],
];

/* ------------------------------------------------------------------ *
 * Página
 * ------------------------------------------------------------------ */

const INDICE = [
  ['marca', 'Marca'],
  ['tokens', 'Tokens'],
  ['graficos-color', 'Series'],
  ['tipografia', 'Tipografía'],
  ['superficie', 'Superficie'],
  ['controles', 'Controles'],
  ['datos', 'Datos'],
  ['bloques', 'Bloques'],
  ['graficos', 'Gráficos'],
] as const;

export default function UiPage() {
  const [pestana, setPestana] = useState('resumen');

  return (
    <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-10 border-b border-border bg-card/90 backdrop-blur">
          <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-4 gap-y-2 px-6 py-3">
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

        <main className="mx-auto flex max-w-[1400px] flex-col gap-10 px-6 py-8">
          <Seccion
            id="marca"
            titulo="Marca"
            nota="Hex exactos del manual 2.1 (A.4). Cada color nombra un departamento."
          >
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              <Chip hex={MARCA.cian} nombre="Cian" detalle="principal del sistema" />
              {Object.entries(DEPARTAMENTO).map(([k, d]) => (
                <Chip key={k} hex={d.color} nombre={d.nombre.split(' ')[0]} detalle={d.nombre} />
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              El contraste es contra la tinta que cada uno lleva encima. Los que quedan
              por debajo de 4.5:1 no sirven para texto chico sobre ese fondo.
            </p>
          </Seccion>

          <Seccion id="tokens" titulo="Tokens de interfaz" nota="Lo que usan los componentes.">
            <Doble>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {TOKENS.map(([nombre, variable]) => (
                  <Token key={variable} nombre={nombre} variable={variable} />
                ))}
              </div>
            </Doble>
          </Seccion>

          <Seccion
            id="graficos-color"
            titulo="Series de gráfico"
            nota="La marca llevada a la luz donde funciona sobre cada fondo."
          >
            <div className="flex flex-col gap-3 lg:flex-row">
              {([['Sobre claro', SERIE_CLARO, '#ffffff'], ['Sobre oscuro', SERIE_OSCURO, '#212529']] as const).map(
                ([titulo, serie, fondo]) => (
                  <div key={titulo} className="min-w-0 flex-1 rounded-lg border border-border p-4" style={{ backgroundColor: fondo }}>
                    <p className="mb-3 text-[10px] font-medium uppercase tracking-wider" style={{ color: fondo === '#ffffff' ? '#6c757d' : '#adb5bd' }}>
                      {titulo}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(serie).map(([k, v]) => (
                        <div key={k} className="flex items-center gap-1.5">
                          <span className="size-5 rounded" style={{ backgroundColor: v }} aria-hidden />
                          <span className="font-mono text-[10px]" style={{ color: fondo === '#ffffff' ? '#6c757d' : '#adb5bd' }}>
                            {k} {v}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
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

          <Seccion id="superficie" titulo="Superficie" nota="Radio según el tamaño de lo que envuelve.">
            <Doble>
              <div className="flex flex-wrap gap-3">
                {([['sm', 'rounded-sm', 'control'], ['md', 'rounded-md', 'botón'],
                   ['lg', 'rounded-lg', 'tarjeta'], ['xl', 'rounded-xl', 'panel']] as const).map(
                  ([n, clase, uso]) => (
                    <div key={n} className="text-center">
                      <div className={`size-16 border border-border bg-card ${clase}`} />
                      <div className="mt-1 text-[10px] text-muted-foreground">{n} · {uso}</div>
                    </div>
                  )
                )}
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
                <StatStrip
                  items={[
                    { label: 'A aprobar', value: '4.678', serie: SERIE_MESES, delta: -18, icon: Inbox },
                    { label: 'Hoy', value: 94, hint: 'reservas programadas', icon: Calendar },
                    { label: 'Usuarios activos', value: 116, hint: 'en este momento', icon: Users },
                  ]}
                />
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

          <Seccion id="graficos" titulo="Gráficos" nota="Mismos componentes que el dashboard.">
            <Doble>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-border bg-card p-3">
                  <p className="mb-1 text-xs text-muted-foreground">Tendencia</p>
                  <Tendencia datos={SERIE_MESES} alto={110} />
                </div>
                <div className="rounded-lg border border-border bg-card p-3">
                  <p className="mb-1 text-xs text-muted-foreground">Anillo</p>
                  <Anillo
                    alto={110}
                    leyendaCentro="reservas"
                    porciones={[
                      { nombre: 'Aprobadas', valor: 11171, color: MARCA.verde },
                      { nombre: 'Pendientes', valor: 4678, color: MARCA.amarillo },
                      { nombre: 'Canceladas', valor: 946, color: MARCA.rojo },
                    ]}
                  />
                </div>
                <div className="rounded-lg border border-border bg-card p-3">
                  <p className="mb-1 text-xs text-muted-foreground">Barras</p>
                  <BarrasHorizontales
                    alto={110}
                    multicolor
                    datos={[
                      { nombre: 'Estudiante', valor: 81 },
                      { nombre: 'Docente', valor: 16 },
                      { nombre: 'Externo', valor: 12 },
                      { nombre: 'Analista', valor: 3 },
                    ]}
                  />
                </div>
              </div>
            </Doble>
          </Seccion>
        </main>
      </div>
  );
}
