import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { AlertTriangle, Boxes, CheckCircle2, ChevronDown, FileDown, MapPinOff, Package, RefreshCw, Target, TrendingUp, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { HEADER_ACTION, HEADER_ACTION_ICON, PAGE_ACTIONS_SLOT } from '@/components/layouts/PageHeader';
import { TarjetasKpi, type Kpi } from '../graficos/TarjetasKpi';
import type { DemandaInventario, EstadoInventario, FiltrosInventario as Filtros } from '@/lib/api/stats';
import { csvEscape, downloadBlob } from '@/lib/utils/csv-helpers';
import { fechaCorta, hoyEnElCampus, type Rango } from '../periodo';
import { IndiceSecciones, NotaHastaAnoche, Seccion } from '../Seccion';
import { PanelEstadistica } from '../PanelEstadistica';
import { EXPLICACIONES } from '../explicaciones';
import { porcentaje } from '../reservas/formato';
import { Atencion, Matriz, TablaGrupos } from './Bloques';
import { DonaEstados, MapaTipos, MedidoresCobertura, WaffleAntiguedad } from './VisualesInventario';
import { EvolucionInventario } from './EvolucionInventario';
import { FiltrosInventario } from './FiltrosInventario';
import { useDemandaInventario, useEstadoInventario, useFiltrosInventario } from './useEstadoInventario';
import { EmbudoEquipos, EspaciosConProblemas, PedidoVsDisponible } from './Demanda';

const n = (v: number) => v.toLocaleString('es-UY');

function textoFiltros(estado: EstadoInventario | null, filtros: Filtros): string {
  if (!estado) return '';
  const nombre = (lista: EstadoInventario['opciones']['tipos'], id: number | null | undefined) =>
    id == null ? null : lista.find((o) => o.id === id)?.nombre ?? null;
  return [
    nombre(estado.opciones.edificios, filtros.edificioId) && `Edificio: ${nombre(estado.opciones.edificios, filtros.edificioId)}`,
    nombre(estado.opciones.espacios, filtros.espacioId) && `Espacio: ${nombre(estado.opciones.espacios, filtros.espacioId)}`,
    nombre(estado.opciones.tipos, filtros.tipoElementoId) && `Tipo: ${nombre(estado.opciones.tipos, filtros.tipoElementoId)}`,
  ]
    .filter(Boolean)
    .join(' | ');
}

function exportarCSV(estado: EstadoInventario, filtrosTexto: string, demanda: DemandaInventario | null, periodoTexto: string) {
  const { totales: t } = estado;
  const grupo = (g: EstadoInventario['porTipo'][number]) =>
    `${csvEscape(g.nombre)},${csvEscape(g.detalle ?? '')},${g.items},${g.unidades},${g.disponibles},${g.mantenimiento},${g.danados}`;
  const filas = [
    `Filtros,${csvEscape(filtrosTexto || 'Sin filtros')}`,
    '',
    'Métrica,Valor',
    `Items,${t.items}`,
    `Unidades,${t.unidades}`,
    `Disponibles,${t.disponibles}`,
    `En mantenimiento,${t.mantenimiento}`,
    `Dañados,${t.danados}`,
    `Sin espacio asignado,${t.sinEspacio}`,
    ...(estado.cobertura ? [`Espacios con inventario,${estado.cobertura.conInventario} de ${estado.cobertura.espacios}`] : []),
    '',
    'Requieren atención',
    'Tipo,Espacio,Estado,Cantidad,Días sin cambios,Observaciones',
    ...estado.atencion.map((i) => `${csvEscape(i.tipo)},${csvEscape(i.espacio ?? 'Sin espacio')},${i.estado},${i.cantidad},${i.diasSinCambios},${csvEscape(i.observaciones)}`),
    '',
    'Tipo,,Items,Unidades,Disponibles,Mantenimiento,Dañados',
    ...estado.porTipo.map(grupo),
    '',
    'Espacio,Edificio,Items,Unidades,Disponibles,Mantenimiento,Dañados',
    ...estado.porEspacio.map(grupo),
    ...(demanda?.porTipo.length
      ? [
          '',
          `Demanda de equipos,${csvEscape(periodoTexto)}`,
          'Tipo de equipo,Pedidos,Unidades,Pendientes,Aprobadas,Entregadas,Rechazadas,Pico diario,Disponibles,En inventario',
          ...demanda.porTipo.map(
            (t) => `${csvEscape(t.nombre)},${t.solicitudes},${t.unidades},${t.pendientes},${t.aprobadas},${t.entregadas},${t.rechazadas},${t.maxUnidadesDia},${t.disponibles},${t.enInventario}`,
          ),
        ]
      : []),
  ];
  // BOM para que Excel lea los acentos.
  downloadBlob(
    new Blob([`\uFEFF${filas.join('\n')}`], { type: 'text/csv;charset=utf-8;' }),
    `estadisticas_inventario_${hoyEnElCampus()}.csv`,
  );
}

const SECCIONES = [
  { id: 'estado', titulo: 'Estado actual', icono: Boxes, color: '#F6CA21' },
  { id: 'demanda', titulo: 'Demanda', icono: Package, color: '#9333ea' },
  { id: 'evolucion', titulo: 'Evolución', icono: TrendingUp, color: '#184897' },
];

function Esqueleto() {
  return (
    <div className="space-y-3" aria-busy>
      <div className="h-[74px] animate-pulse rounded-xl bg-muted" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="h-[92px] animate-pulse rounded-xl bg-muted" />)}
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="h-[320px] animate-pulse rounded-xl bg-muted lg:col-span-2" />
        <div className="h-[320px] animate-pulse rounded-xl bg-muted" />
      </div>
    </div>
  );
}

export default function EstadisticasInventario({ rango }: Readonly<{ rango: Rango }>) {
  const { filtros, activos, cambiar, limpiar } = useFiltrosInventario();
  const { estado, cargando, error, recargar: recargarEstado } = useEstadoInventario(filtros);
  const { demanda, cargando: cargandoDemanda, recargar: recargarDemanda } = useDemandaInventario(rango, filtros);
  const recargar = () => {
    recargarEstado();
    recargarDemanda();
  };
  const periodoTexto = `${fechaCorta(rango.desde)} al ${fechaCorta(rango.hasta)}`;
  const tiposQueNoAlcanzan = (demanda?.porTipo ?? []).filter((t) => Number(t.maxUnidadesDia) > Number(t.disponibles)).length;

  /** Desde la demanda: filtra el estado por ese espacio y lo muestra. */
  const verEstadoDe = (espacioId: number) => {
    cambiar({ espacioId });
    document.getElementById('estado')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const filtrosTexto = textoFiltros(estado, filtros);

  const exportarPDF = async () => {
    if (!estado) return;
    try {
      // jsPDF pesa: se baja recién cuando alguien exporta.
      const { exportInventarioToPDF } = await import('@/lib/utils/pdf-export');
      exportInventarioToPDF({ estado, filtrosTexto, demanda, periodoTexto });
      toast.success('PDF generado');
    } catch (e) {
      toast.error('No se pudo generar el PDF', { description: e instanceof Error ? e.message : undefined });
    }
  };

  const slot = typeof document === 'undefined' ? null : document.getElementById(PAGE_ACTIONS_SLOT);
  const acciones = (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={recargar} aria-label="Actualizar" className={HEADER_ACTION_ICON}>
            <RefreshCw className={`h-4 w-4 ${cargando ? 'animate-spin' : ''}`} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Actualizar</TooltipContent>
      </Tooltip>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className={HEADER_ACTION} aria-label="Exportar" disabled={!estado}>
            <FileDown className="h-3.5 w-3.5 sm:mr-1.5" />
            {/* En celular sólo el ícono: con el texto no entraba el título de la pantalla. */}
            <span className="hidden sm:inline">Exportar</span>
            <ChevronDown className="ml-1 h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => estado && exportarCSV(estado, filtrosTexto, demanda, periodoTexto)}>CSV</DropdownMenuItem>
          <DropdownMenuItem onClick={exportarPDF}>PDF</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );

  const t = estado?.totales;
  const tarjetas: Kpi[] = t
    ? [
        { etiqueta: 'Items', valor: n(t.items), detalle: `${n(t.unidades)} unidades`, icono: Package, fondo: 'dark' },
        { etiqueta: 'Disponibles', valor: n(t.disponibles), detalle: `${porcentaje(t.disponibles, t.items)}% del total`, icono: CheckCircle2, fondo: 'green' },
        { etiqueta: 'En mantenimiento', valor: n(t.mantenimiento), detalle: `${porcentaje(t.mantenimiento, t.items)}% del total`, icono: Wrench, fondo: 'yellow' },
        { etiqueta: 'Dañados', valor: n(t.danados), detalle: `${porcentaje(t.danados, t.items)}% del total`, icono: AlertTriangle, fondo: 'red' },
        { etiqueta: 'Sin espacio', valor: n(t.sinEspacio), detalle: t.sinEspacio > 0 ? 'items sin asignar' : 'todo asignado', icono: MapPinOff, fondo: 'blue' },
        estado.cobertura
          ? {
              etiqueta: 'Espacios con inventario',
              valor: `${estado.cobertura.conInventario}/${estado.cobertura.espacios}`,
              detalle: estado.cobertura.espacios - estado.cobertura.conInventario > 0
                ? `${estado.cobertura.espacios - estado.cobertura.conInventario} vacíos`
                : 'ninguno vacío',
              icono: Target,
              fondo: 'cyan',
            }
          : { etiqueta: 'Tipos distintos', valor: n(estado.porTipo.filter((g) => g.items > 0).length), detalle: 'en este espacio', icono: Target, fondo: 'cyan' },
      ]
    : [];

  return (
    <div className="space-y-6 pb-16">
      {slot && createPortal(acciones, slot)}

      <IndiceSecciones
        secciones={SECCIONES}
        // Los filtros cambian el estado actual y la demanda: en Evolución confundían.
        extraEn={['estado', 'demanda']}
        extra={<FiltrosInventario opciones={estado?.opciones} filtros={filtros} activos={activos} onCambiar={cambiar} onLimpiar={limpiar} />}
      />

      <Seccion
        id="estado"
        icono={Boxes}
        color="#F6CA21"
        titulo="Estado actual"
        descripcion="Cómo está el inventario ahora. Es una foto de hoy: el período elegido no la cambia."
        destacados={
          estado
            ? [
                { etiqueta: 'Disponible', valor: `${porcentaje(estado.totales.disponibles, estado.totales.items)}%` },
                { etiqueta: 'A resolver', valor: `${estado.atencion.length} ${estado.atencion.length === 1 ? 'item' : 'items'}` },
                ...(estado.cobertura
                  ? [{ etiqueta: 'Espacios vacíos', valor: String(estado.cobertura.espacios - estado.cobertura.conInventario) }]
                  : []),
              ]
            : []
        }
      >
        {!estado && cargando ? (
          <Esqueleto />
        ) : !estado || error ? (
          <p className="rounded-xl border bg-card py-12 text-center text-sm text-muted-foreground">
            No se pudo cargar el inventario. Probá actualizar.
          </p>
        ) : (
          <div className={`space-y-3 transition-opacity ${cargando ? 'opacity-60' : ''}`}>
            <TarjetasKpi items={tarjetas} />

            <div className="grid gap-3 lg:grid-cols-3">
              <PanelEstadistica title="Estado del parque" count={`${n(estado.totales.items)} items`} accentColor="#86bb4c" centrar explicacion={EXPLICACIONES.estadoParque}>
                {(grande) => <DonaEstados totales={estado.totales} tamano={grande ? 260 : 150} />}
              </PanelEstadistica>
              <PanelEstadistica title="Cobertura" count="espacios y asignación" accentColor="#00c7ff" centrar explicacion={EXPLICACIONES.cobertura}>
                {(grande) => <MedidoresCobertura estado={estado} grande={grande} />}
              </PanelEstadistica>
              <PanelEstadistica title="Antigüedad" count="cada cuadrado es 1% del parque" accentColor="#184897" centrar explicacion={EXPLICACIONES.antiguedad}>
                <WaffleAntiguedad a={estado.antiguedad} />
              </PanelEstadistica>
            </div>

            {/* Alto fijo en escritorio: la lista scrollea por dentro y coincide con el mapa. */}
            <div className="grid gap-3 lg:h-[400px] lg:grid-cols-5">
              <PanelEstadistica
                title="Requieren atención"
                count={estado.atencion.length > 0 ? `${estado.atencion.length} items · el más estancado primero` : undefined}
                accentColor="#DF2B31"
                action={{ label: 'inventario', to: '/inventory' }}
                scroll
                centrar={estado.atencion.length === 0}
                className="lg:col-span-2"
                explicacion={EXPLICACIONES.atencion}
              >
                <Atencion items={estado.atencion} />
              </PanelEstadistica>
              <PanelEstadistica
                title="Qué hay, por tipo"
                count="tamaño = items · color = problemas"
                accentColor="#DE7A27"
                className="lg:col-span-3"
                explicacion={EXPLICACIONES.mapaTipos}
              >
                {(grande) => <MapaTipos porTipo={estado.porTipo} alto={grande ? 480 : 290} />}
              </PanelEstadistica>
            </div>

            <div className="grid gap-3 xl:h-[460px] xl:grid-cols-2">
              <PanelEstadistica title="Por tipo" count={`${estado.porTipo.length} tipos`} accentColor="#00c7ff" flush scroll explicacion={EXPLICACIONES.tablaTipos}>
                <TablaGrupos grupos={estado.porTipo} columna="Tipo" />
              </PanelEstadistica>
              <PanelEstadistica title="Por espacio" count={`${estado.porEspacio.length} espacios`} accentColor="#86bb4c" flush scroll explicacion={EXPLICACIONES.tablaEspacios}>
                <TablaGrupos grupos={estado.porEspacio} columna="Espacio" conDetalle />
              </PanelEstadistica>
            </div>

            <PanelEstadistica title="Qué hay en cada espacio" count="items por tipo" accentColor="#184897" explicacion={EXPLICACIONES.matriz}>
              <Matriz estado={estado} />
            </PanelEstadistica>
          </div>
        )}
      </Seccion>

      <Seccion
        id="demanda"
        icono={Package}
        color="#9333ea"
        titulo="Demanda"
        descripcion={`Equipos pedidos con las reservas del ${periodoTexto}. A diferencia del estado, cambia con el período.`}
        destacados={
          demanda
            ? [
                { etiqueta: 'Pedidos', valor: `${n(Number(demanda.totales.solicitudes))} · ${n(Number(demanda.totales.unidades))} u.` },
                { etiqueta: 'Sin resolver', valor: `${porcentaje(Number(demanda.totales.pendientes), Number(demanda.totales.solicitudes))}%` },
                { etiqueta: 'No alcanzan', valor: `${tiposQueNoAlcanzan} ${tiposQueNoAlcanzan === 1 ? 'tipo' : 'tipos'}` },
              ]
            : []
        }
      >
        {!demanda && cargandoDemanda ? (
          <div className="h-[500px] animate-pulse rounded-xl bg-muted" aria-busy />
        ) : !demanda ? (
          <p className="rounded-xl border border-dashed bg-card py-10 text-center text-sm text-muted-foreground">
            No se pudo cargar la demanda de equipos. Probá actualizar.
          </p>
        ) : (
          <div className={`grid gap-3 transition-opacity lg:h-[500px] lg:grid-cols-3 ${cargandoDemanda ? 'opacity-60' : ''}`}>
            <PanelEstadistica title="Del pedido a la entrega" count={`${n(Number(demanda.totales.solicitudes))} pedidos`} accentColor="#9333ea" centrar explicacion={EXPLICACIONES.embudoEquipos}>
              {(grande) => <EmbudoEquipos totales={demanda.totales} grande={grande} />}
            </PanelEstadistica>
            <PanelEstadistica title="¿Alcanza lo que hay?" count="pico diario contra disponibles" accentColor="#DF2B31" scroll explicacion={EXPLICACIONES.pedidoVsDisponible}>
              {(grande) => <PedidoVsDisponible filas={demanda.porTipo} limite={grande ? undefined : 5} />}
            </PanelEstadistica>
            <PanelEstadistica
              title="Con problemas y reservados"
              count={`${demanda.espaciosConProblemas.length} espacios`}
              accentColor="#DE7A27"
              scroll
              centrar={demanda.espaciosConProblemas.length === 0}
              explicacion={EXPLICACIONES.espaciosProblemas}
            >
              <EspaciosConProblemas filas={demanda.espaciosConProblemas} onVerEstado={verEstadoDe} />
            </PanelEstadistica>
          </div>
        )}
      </Seccion>

      <Seccion
        id="evolucion"
        icono={TrendingUp}
        color="#184897"
        titulo="Evolución"
        descripcion="Cómo cambió el inventario dentro del período, a partir de la foto que se toma cada madrugada. No usa los filtros de arriba."
        nota={<NotaHastaAnoche />}
      >
        <EvolucionInventario rango={rango} />
      </Seccion>
    </div>
  );
}
