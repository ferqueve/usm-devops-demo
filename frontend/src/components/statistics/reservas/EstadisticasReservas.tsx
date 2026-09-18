import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { BarChart3, Building, CalendarCheck, CalendarClock, ChevronDown, ClipboardCheck, Clock, FileDown, Hourglass, MapPinned, RefreshCw, Users, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { HEADER_ACTION, HEADER_ACTION_ICON, PAGE_ACTIONS_SLOT } from '@/components/layouts/PageHeader';
import { Panel } from '@/components/dashboard/views/_components/Panel';
import { csvEscape, downloadBlob } from '@/lib/utils/csv-helpers';
import { fechaCorta, type Rango } from '../periodo';
import { IndiceSecciones, Seccion } from '../Seccion';
import { PanelEstadistica } from '../PanelEstadistica';
import { EXPLICACIONES } from '../explicaciones';
import { ComoTerminaron } from './ComoTerminaron';
import { demora, dias, entero, horas, nombreRolPlural, porcentaje, semana } from './formato';
import { MapaDeCalor } from './MapaDeCalor';
import { MenosUsados, OcupacionEspacios, PorCarrera, QuienesMasReservan } from './Listas';
import { BurbujasCarreras, DonaEdificios, DonaRoles, MapaOcupacion } from './Visuales';
import { CalendarioCalor } from '../graficos/CalendarioCalor';
import { RadarSemana } from '../graficos/RadarSemana';
import { TarjetasKpi } from '../graficos/TarjetasKpi';
import { ResumenIA } from './ResumenIA';
import { Tendencia } from './Tendencia';
import { useEstadisticasReservas, type DatosReservas } from './useEstadisticasReservas';
import type { FiltrosReservas as Filtros } from '@/lib/api/stats';
import { Analistas, Antelacion, HistogramaRespuesta, PendientesAntiguedad, RespuestaKpis } from './Aprobacion';
import { CapacidadOcupacion, Saturacion, UsoDeCapacidad } from './Espacios';
import { OrganizadoresExternos, ResumenExternos } from './Externos';
import { Vacio } from '../Vacio';
import { CompararContra } from './CompararContra';
import { ChipsFiltros, FiltrosReservas } from './FiltrosReservas';
import { Novedades } from './Novedades';
import { espacioFuera, textoComparacion, textoFiltros, useFiltrosReservas } from './filtros';
import { MARCA } from '@/lib/design/paleta';

const SECCIONES = [
  { id: 'resumen', titulo: 'Resumen', icono: BarChart3, color: MARCA.azul },
  { id: 'uso', titulo: 'Uso', icono: MapPinned, color: MARCA.verde },
  { id: 'quien', titulo: 'Quién reserva', icono: Users, color: MARCA.naranja },
  { id: 'aprobacion', titulo: 'Aprobación', icono: ClipboardCheck, color: MARCA.rojo },
  { id: 'espacios', titulo: 'Espacios', icono: Building, color: MARCA.cian },
];

// 0 = domingo, como EXTRACT(DOW).
const DIAS_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];


function Esqueleto() {
  return (
    <div className="space-y-3" aria-busy>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="h-[92px] animate-pulse rounded-xl bg-muted" />)}
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="h-[340px] animate-pulse rounded-xl bg-muted lg:col-span-2" />
        <div className="h-[340px] animate-pulse rounded-xl bg-muted" />
      </div>
    </div>
  );
}


/** Aviso dentro de una sección cuyo pedido falló. */
function NoCargo() {
  return (
    <p className="rounded-xl border border-dashed bg-card py-10 text-center text-sm text-muted-foreground">
      No se pudieron cargar estas estadísticas. Probá actualizar.
    </p>
  );
}

/** Fecha con año, para cuando se compara contra el año pasado. */
function fechaConAnio(fecha: string): string {
  return new Date(`${fecha}T00:00:00Z`)
    .toLocaleDateString('es-UY', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
    .replaceAll('.', '');
}

function exportarCSV(datos: DatosReservas, periodoTexto: string, filtrosTexto: string) {
  const { resumen } = datos;
  if (!resumen) return;
  const { actual, anterior } = resumen;
  const filas: string[] = [
    `${csvEscape('Período')},${csvEscape(periodoTexto)}`,
    `Filtros,${csvEscape(filtrosTexto || 'Sin filtros')}`,
    ...(resumen.desdeAnterior && resumen.hastaAnterior ? [`Comparado con,${resumen.desdeAnterior} al ${resumen.hastaAnterior}`] : []),
    '',
    'Métrica,Período,Comparación',
    `Reservas,${actual.total},${anterior.total}`,
    `Aprobadas,${actual.aprobadas},${anterior.aprobadas}`,
    `Pendientes,${actual.pendientes},${anterior.pendientes}`,
    `Canceladas,${actual.canceladas},${anterior.canceladas}`,
    `Horas aprobadas,${actual.horasAprobadas.toFixed(1)},${anterior.horasAprobadas.toFixed(1)}`,
    `Espacios usados,${actual.espaciosUsados},${anterior.espaciosUsados}`,
    `Personas que reservaron,${actual.usuarios},${anterior.usuarios}`,
    '',
    'Periodo,Aprobadas,Pendientes,Canceladas',
    ...resumen.serie.map((p) => `${p.periodo},${p.aprobadas},${p.pendientes},${p.canceladas}`),
    '',
    'Espacio,Horas reservadas,Ocupación %',
    ...datos.ocupacion.map((o) => `${csvEscape(o.espacioNombre)},${Number(o.horasReservadas).toFixed(1)},${Number(o.porcentaje).toFixed(1)}`),
    '',
    'Edificio,Reservas',
    ...datos.edificios.map((e) => `${csvEscape(e.edificioNombre)},${e.cantReservas}`),
    '',
    'Carrera,Aprobadas,Canceladas,Cancelación %',
    ...datos.carreras.map((c) => `${csvEscape(c.carreraNombre)},${c.aprobadas},${c.canceladas},${Number(c.tasaCancelacion).toFixed(1)}`),
    '',
    'Persona,Email,Reservas',
    ...datos.usuarios.map((u) => `${csvEscape(u.nombre)},${csvEscape(u.email)},${u.cantReservas}`),
    ...(datos.aprobacion?.analistas.length
      ? [
          '',
          'Analista,Asignadas,Aprobadas,Canceladas,Pendientes,Vencidas,Mediana de respuesta (h)',
          ...datos.aprobacion.analistas.map(
            (a) => `${csvEscape(a.nombre)},${a.asignadas},${a.aprobadas},${a.canceladas},${a.pendientes},${a.vencidas},${a.medianaHoras == null ? '' : a.medianaHoras.toFixed(1)}`,
          ),
        ]
      : []),
    ...(datos.externos?.organizadores.length
      ? [
          '',
          'Organizador externo,Eventos,Aprobadas,Canceladas,Horas,Espacios',
          ...datos.externos.organizadores.map(
            (o) => `${csvEscape(o.organizador)},${o.eventos},${o.aprobadas},${o.canceladas},${Number(o.horas).toFixed(1)},${o.espacios}`,
          ),
        ]
      : []),
  ];
  // BOM para que Excel lea los acentos.
  downloadBlob(
    new Blob([`\uFEFF${filas.join('\n')}`], { type: 'text/csv;charset=utf-8;' }),
    `estadisticas_reservas_${resumen.desde}_${resumen.hasta}.csv`,
  );
}

export default function EstadisticasReservas({ rango, periodoLabel }: Readonly<{ rango: Rango; periodoLabel: string }>) {
  const { filtros, activos, cambiar, limpiar, comparar, elegirComparacion } = useFiltrosReservas();
  const datos = useEstadisticasReservas(rango, filtros, comparar);
  const { resumen, ocupacion, heatmap, carreras, edificios, usuarios, novedades, aprobacion, espacios, externos, opciones, cargando, primeraCarga, recargar } = datos;
  const periodoTexto = `${periodoLabel.toLowerCase()} (${fechaCorta(rango.desde)} al ${fechaCorta(rango.hasta)})`;
  const filtrosTexto = textoFiltros(opciones, filtros);

  /** Aplica un filtro desde un gráfico; si ya estaba, lo saca. */
  const filtrarPor = (cambios: Filtros) => {
    const yaEsta = (Object.entries(cambios) as Array<[keyof Filtros, unknown]>).every(([k, v]) => filtros[k] === v);
    if (yaEsta) {
      cambiar(Object.fromEntries(Object.keys(cambios).map((k) => [k, null])));
      return;
    }
    cambiar(espacioFuera(opciones, filtros, cambios) ? { ...cambios, espacioId: null } : cambios);
  };
  const porEspacio = (espacioId: number) => filtrarPor({ espacioId });
  const porEdificio = (edificioId: number) => filtrarPor({ edificioId });
  const porCarrera = (carreraId: number) => filtrarPor({ carreraId });
  const porRol = (rol: string) => filtrarPor({ rol });

  const exportarPDF = async () => {
    if (!resumen) return;
    try {
      // jsPDF pesa: se baja recién cuando alguien exporta.
      const { exportReservasToPDF } = await import('@/lib/utils/pdf-export');
      exportReservasToPDF({ periodoTexto, resumen, ocupacion, edificios, carreras, usuarios, filtrosTexto, aprobacion, externos });
      toast.success('PDF generado');
    } catch (error) {
      toast.error('No se pudo generar el PDF', { description: error instanceof Error ? error.message : undefined });
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
          <Button variant="ghost" className={HEADER_ACTION} aria-label="Exportar" disabled={!resumen}>
            <FileDown className="h-3.5 w-3.5 sm:mr-1.5" />
            {/* En celular sólo el ícono: con el texto no entraba el título de la pantalla. */}
            <span className="hidden sm:inline">Exportar</span>
            <ChevronDown className="ml-1 h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => exportarCSV(datos, periodoTexto, filtrosTexto)}>CSV</DropdownMenuItem>
          <DropdownMenuItem onClick={exportarPDF}>PDF</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );

  if (primeraCarga) {
    return (
      <>
        {slot && createPortal(acciones, slot)}
        <Esqueleto />
      </>
    );
  }

  if (!resumen) {
    return (
      <p className="rounded-xl border bg-card py-12 text-center text-sm text-muted-foreground">
        No se pudieron cargar las estadísticas. Probá actualizar.
      </p>
    );
  }

  const { actual, anterior } = resumen;
  const masOcupado = ocupacion[0];
  const cambio = (a: number, b: number) => (b > 0 ? ((a - b) / b) * 100 : null);
  const diario = resumen.diario ?? resumen.serie;
  const pico = heatmap.reduce<(typeof heatmap)[number] | null>((m, c) => (!m || Number(c.cant) > Number(m.cant) ? c : m), null);
  const rolPrincipal = [...(resumen.porRol ?? [])].sort((a, b) => b.total - a.total)[0];
  const carrerasQueCancelan = carreras.filter((c) => c.carreraId != null && Number(c.tasaCancelacion) > 15).length;
  const comparacion = resumen.comparacion ?? comparar;
  const contra = textoComparacion(comparacion, resumen.desdeAnterior, resumen.hastaAnterior, comparacion === 'anio' ? fechaConAnio : fechaCorta);

  // Aprobación
  const vencidasPendientes = aprobacion?.pendientesPorAntiguedad.reduce((a, t) => a + Number(t.vencidas), 0) ?? 0;
  const pendientesTotal = aprobacion?.pendientesPorAntiguedad.reduce((a, t) => a + Number(t.cantidad), 0) ?? 0;
  // Espacios
  const promedioPorTipo = new Map<string, { suma: number; n: number; llenas: number }>();
  for (const c of espacios?.saturacion ?? []) {
    const p = promedioPorTipo.get(c.tipoEspacio) ?? { suma: 0, n: 0, llenas: 0 };
    promedioPorTipo.set(c.tipoEspacio, { suma: p.suma + Number(c.ocupacionPct), n: p.n + 1, llenas: p.llenas + (Number(c.espacios) > 1 ? Number(c.horasLlenas) : 0) });
  }
  const tipoMasSaturado = [...promedioPorTipo.entries()].sort((a, b) => b[1].suma / b[1].n - a[1].suma / a[1].n)[0];
  const horasLlenas = [...promedioPorTipo.values()].reduce((a, p) => a + p.llenas, 0);
  const excedidos = (espacios?.capacidad ?? []).filter((c) => c.capacidad != null && (Number(c.inscriptos) > Number(c.capacidad) || Number(c.cupo ?? 0) > Number(c.capacidad))).length;
  const sobrados = (espacios?.capacidad ?? []).filter((c) => !(c.capacidad != null && (Number(c.inscriptos) > Number(c.capacidad) || Number(c.cupo ?? 0) > Number(c.capacidad))) && c.usoPct != null && Number(c.usoPct) < 25).length;
  const ocupacionesEspacios = (espacios?.espacios ?? []).filter((e) => Number(e.capacidad ?? 0) > 0).map((e) => Number(e.ocupacionPct));
  const rangoOcupacion = ocupacionesEspacios.length > 1 ? `${Math.round(Math.min(...ocupacionesEspacios))}–${Math.round(Math.max(...ocupacionesEspacios))}%` : null;

  return (
    // pb-16: el botón flotante del asistente tapaba lo último de la página.
    <div className={`space-y-6 pb-16 transition-opacity ${cargando ? 'opacity-60' : ''}`}>
      {slot && createPortal(acciones, slot)}

      <IndiceSecciones
        secciones={SECCIONES}
        extra={<FiltrosReservas opciones={opciones} filtros={filtros} activos={activos} onCambiar={cambiar} onLimpiar={limpiar} />}
        debajo={activos ? <ChipsFiltros opciones={opciones} filtros={filtros} onCambiar={cambiar} /> : undefined}
      />

      <Seccion
        id="resumen"
        icono={BarChart3}
        color={MARCA.azul}
        titulo="Resumen"
        descripcion={`Cuántas reservas hubo y cómo terminaron, contra ${comparacion === 'anio' ? 'las mismas fechas del año pasado' : 'el período anterior del mismo largo'}.`}
        destacados={[
          { etiqueta: 'Se aprueban', valor: `${porcentaje(actual.aprobadas, actual.aprobadas + actual.canceladas)}%` },
          { etiqueta: 'Vencidas', valor: actual.pendientesVencidas.toLocaleString('es-UY') },
        ]}
        nota={<CompararContra valor={comparar} onCambiar={elegirComparacion} />}
      >
        <Novedades novedades={novedades} contra={contra} onFiltrar={filtrarPor} />

        <div>
          <p className="mb-1.5 px-1 text-right text-2xs text-muted-foreground">
            Los cambios de las tarjetas comparan contra <b className="text-foreground">{contra}</b>.
          </p>
          <TarjetasKpi
            contra={contra}
            items={[
              {
                etiqueta: 'Reservas',
                valor: actual.total.toLocaleString('es-UY'),
                detalle: `${actual.usuarios.toLocaleString('es-UY')} personas pidieron`,
                icono: BarChart3,
                fondo: 'dark',
                serie: diario.map((p) => p.aprobadas + p.pendientes + p.canceladas),
                cambio: cambio(actual.total, anterior.total),
                nuevo: anterior.total === 0 && actual.total > 0,
              },
              {
                etiqueta: 'Aprobadas',
                valor: actual.aprobadas.toLocaleString('es-UY'),
                detalle: `${porcentaje(actual.aprobadas, actual.total)}% del total`,
                icono: CalendarCheck,
                fondo: 'green',
                serie: diario.map((p) => p.aprobadas),
                cambio: cambio(actual.aprobadas, anterior.aprobadas),
                nuevo: anterior.aprobadas === 0 && actual.aprobadas > 0,
              },
              {
                etiqueta: 'Pendientes',
                valor: actual.pendientes.toLocaleString('es-UY'),
                detalle: actual.pendientesVencidas > 0
                  ? `${actual.pendientesVencidas.toLocaleString('es-UY')} ya vencidas`
                  : 'todas a tiempo de resolverse',
                icono: Hourglass,
                fondo: 'yellow',
                serie: diario.map((p) => p.pendientes),
                cambio: cambio(actual.pendientes, anterior.pendientes),
                nuevo: anterior.pendientes === 0 && actual.pendientes > 0,
                subirEsMalo: true,
              },
              {
                etiqueta: 'Canceladas',
                valor: actual.canceladas.toLocaleString('es-UY'),
                detalle: `${porcentaje(actual.canceladas, actual.total)}% del total`,
                icono: XCircle,
                fondo: 'red',
                serie: diario.map((p) => p.canceladas),
                cambio: cambio(actual.canceladas, anterior.canceladas),
                nuevo: anterior.canceladas === 0 && actual.canceladas > 0,
                subirEsMalo: true,
              },
              {
                etiqueta: 'Horas reservadas',
                valor: horas(actual.horasAprobadas),
                detalle: `${horas(actual.duracionPromedioHoras)} por reserva`,
                icono: Clock,
                fondo: 'blue',
                cambio: cambio(actual.horasAprobadas, anterior.horasAprobadas),
                nuevo: anterior.horasAprobadas === 0 && actual.horasAprobadas > 0,
              },
              {
                etiqueta: 'Anticipación',
                valor: dias(actual.anticipacionPromedioDias),
                detalle: 'entre el pedido y el uso',
                icono: CalendarClock,
                fondo: 'cyan',
                cambio: cambio(actual.anticipacionPromedioDias, anterior.anticipacionPromedioDias),
                nuevo: anterior.anticipacionPromedioDias === 0 && actual.anticipacionPromedioDias > 0,
              },
            ]}
          />
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          <PanelEstadistica
            title="Cómo evolucionó"
            count={periodoLabel.toLowerCase()}
            accentColor={MARCA.azul}
            className="lg:col-span-2"
            explicacion={EXPLICACIONES.evolucion}
          >
            {(grande) =>
              actual.total === 0 ? (
                <p className="py-16 text-center text-sm text-muted-foreground">No hubo reservas en el período.</p>
              ) : (
                <Tendencia resumen={resumen} alto={grande ? 520 : 320} />
              )
            }
          </PanelEstadistica>
          <PanelEstadistica
            title="Cómo terminaron"
            count={`${actual.total.toLocaleString('es-UY')} reservas`}
            accentColor={MARCA.verde}
            centrar
            explicacion={EXPLICACIONES.terminaron}
          >
            {(grande) => <ComoTerminaron t={actual} grande={grande} />}
          </PanelEstadistica>
        </div>

        <Panel title="En pocas palabras" count="resumen con IA" accentColor={MARCA.amarillo}>
          <ResumenIA
            resumen={resumen}
            periodoTexto={periodoTexto}
            espacioMasOcupado={masOcupado?.espacioNombre}
            carreras={carreras}
          />
        </Panel>
      </Seccion>

      <Seccion
        id="uso"
        icono={MapPinned}
        color={MARCA.verde}
        titulo="Uso"
        descripcion="Cuándo y dónde se concentran las reservas aprobadas, y a qué hora se llena cada tipo de espacio."
        destacados={[
          ...(pico ? [{ etiqueta: 'Hora pico', valor: `${DIAS_CORTOS[pico.diaSemana]} ${pico.hora}:00` }] : []),
          { etiqueta: 'Espacios usados', valor: `${actual.espaciosUsados} de ${resumen.espaciosTotal}` },
          ...(tipoMasSaturado ? [{ etiqueta: 'Tipo más saturado', valor: `${tipoMasSaturado[0]} ${Math.round(tipoMasSaturado[1].suma / tipoMasSaturado[1].n)}%` }] : []),
          ...(espacios ? [{ etiqueta: 'Horas sin lugar', valor: entero(horasLlenas) }] : []),
        ]}
      >
        <div className="grid gap-3 lg:grid-cols-3">
          <PanelEstadistica
            title="Día por día"
            count="reservas aprobadas de cada día"
            accentColor={MARCA.azul}
            className="lg:col-span-2"
            centrar
            explicacion={EXPLICACIONES.calendario}
          >
            <CalendarioCalor dias={diario.map((p) => ({ fecha: p.periodo, valor: p.aprobadas }))} unidad="reservas aprobadas" />
          </PanelEstadistica>
          <PanelEstadistica title="Forma de la semana" count="peso de cada día" accentColor={MARCA.cian} centrar explicacion={EXPLICACIONES.semana}>
            {(grande) => <RadarSemana dias={semana(heatmap)} alto={grande ? 440 : 230} />}
          </PanelEstadistica>
        </div>

        <PanelEstadistica title="Día y hora" count="reservas aprobadas por hora de inicio" accentColor={MARCA.azul} explicacion={EXPLICACIONES.diaHora}>
          <MapaDeCalor celdas={heatmap} />
        </PanelEstadistica>

        <PanelEstadistica title="Saturación por tipo y hora" count="lunes a viernes · % de espacios del tipo ocupados" accentColor={MARCA.cian} explicacion={EXPLICACIONES.saturacion}>
          {espacios ? <Saturacion celdas={espacios.saturacion} /> : <Vacio texto="No se pudo cargar la saturación. Probá actualizar." />}
        </PanelEstadistica>

        <div className="grid gap-3 lg:grid-cols-3">
          <PanelEstadistica
            title="Dónde se reserva"
            count={`${actual.espaciosUsados} de ${resumen.espaciosTotal} espacios · tamaño = horas, color = ocupación`}
            accentColor={MARCA.verde}
            action={{ label: 'espacios', to: '/rooms' }}
            className="lg:col-span-2"
            explicacion={EXPLICACIONES.ocupacion}
          >
            {(grande) => (
              <div className="flex h-full flex-col">
                <MapaOcupacion filas={ocupacion} alto={grande ? 460 : 300} onFiltrar={porEspacio} />
                {grande ? (
                  <div className="mt-5 border-t pt-4">
                    <OcupacionEspacios filas={ocupacion} onFiltrar={porEspacio} />
                  </div>
                ) : (
                  <p className="mt-auto pt-3 text-xs text-muted-foreground">Clic en un espacio para filtrar por él; ampliá para ver la ocupación de cada uno.</p>
                )}
              </div>
            )}
          </PanelEstadistica>
          {/* Dos filas iguales que suman el alto del mapa de al lado. */}
          <div className="grid gap-3 lg:grid-rows-2">
            <PanelEstadistica title="Por edificio" count="reservas aprobadas" accentColor={MARCA.azul} centrar explicacion={EXPLICACIONES.edificio}>
              {(grande) => <DonaEdificios filas={edificios} tamano={grande ? 240 : 124} onFiltrar={porEdificio} />}
            </PanelEstadistica>
            <PanelEstadistica title="Menos usados" count="los que más margen tienen" accentColor={MARCA.naranja} centrar explicacion={EXPLICACIONES.menosUsados}>
              {(grande) => <MenosUsados filas={ocupacion} cantidad={grande ? 13 : 5} onFiltrar={porEspacio} />}
            </PanelEstadistica>
          </div>
        </div>
      </Seccion>

      <Seccion
        id="quien"
        icono={Users}
        color={MARCA.naranja}
        titulo="Quién reserva"
        descripcion="Qué carreras y qué personas piden más espacios, y cuánto cancelan."
        destacados={[
          ...(rolPrincipal ? [{ etiqueta: 'Pide más', valor: `${nombreRolPlural(rolPrincipal.nombre)} ${porcentaje(rolPrincipal.total, actual.total)}%` }] : []),
          { etiqueta: 'Cancelan +15%', valor: `${carrerasQueCancelan} ${carrerasQueCancelan === 1 ? 'carrera' : 'carreras'}` },
        ]}
      >
        <div className="grid gap-3 lg:grid-cols-3">
          <PanelEstadistica
            title="Volumen contra cancelación"
            count="cada burbuja es una carrera · tamaño = cancelaciones tardías"
            accentColor={MARCA.naranja}
            className="lg:col-span-2"
            explicacion={EXPLICACIONES.burbujas}
          >
            {(grande) => <BurbujasCarreras filas={carreras} alto={grande ? 500 : 300} onFiltrar={porCarrera} />}
          </PanelEstadistica>
          <PanelEstadistica title="Por rol" count="quién pide las reservas" accentColor="#7c4dbe" centrar explicacion={EXPLICACIONES.rol}>
            {(grande) => <DonaRoles filas={resumen.porRol ?? []} tamano={grande ? 240 : 140} onFiltrar={porRol} />}
          </PanelEstadistica>
        </div>
        {/* Alto fijo en escritorio: las dos tablas scrollean por dentro y quedan parejas. */}
        <div className="grid gap-3 lg:h-[500px] lg:grid-cols-2">
          <PanelEstadistica title="Por carrera" count="marca si cancela más del 15%" accentColor={MARCA.naranja} scroll explicacion={EXPLICACIONES.carrera}>
            <PorCarrera filas={carreras} onFiltrar={porCarrera} />
          </PanelEstadistica>
          <PanelEstadistica
            title="Quiénes más reservan"
            count={`top 10 de ${actual.usuarios.toLocaleString('es-UY')} personas`}
            accentColor={MARCA.amarillo}
            scroll
            explicacion={EXPLICACIONES.quienes}
          >
            <QuienesMasReservan filas={usuarios} onFiltrarRol={porRol} />
          </PanelEstadistica>
        </div>
        <div className="grid gap-3 lg:h-[420px] lg:grid-cols-3">
          <PanelEstadistica title="Eventos externos" count={externos ? `${entero(externos.total)} en el período` : undefined} accentColor={MARCA.naranja} centrar explicacion={EXPLICACIONES.externosResumen}>
            {(grande) => (externos ? <ResumenExternos datos={externos} grande={grande} /> : <Vacio texto="No se pudieron cargar los externos. Probá actualizar." />)}
          </PanelEstadistica>
          <PanelEstadistica
            title="Organizadores externos"
            count={externos ? `${externos.organizadores.length} organizadores · de quien más pide` : undefined}
            accentColor="#9333ea"
            className="lg:col-span-2"
            scroll
            explicacion={EXPLICACIONES.externos}
          >
            {externos ? <OrganizadoresExternos filas={externos.organizadores} /> : <Vacio texto="No se pudieron cargar los externos. Probá actualizar." />}
          </PanelEstadistica>
        </div>
      </Seccion>

      <Seccion
        id="aprobacion"
        icono={ClipboardCheck}
        color={MARCA.rojo}
        titulo="Aprobación"
        descripcion="Cuánto se tarda en responder, quién tiene la carga y qué queda esperando."
        destacados={
          aprobacion
            ? [
                { etiqueta: 'Mediana', valor: demora(aprobacion.respuesta.medianaHoras) },
                { etiqueta: 'En 24 h', valor: aprobacion.respuesta.dentroDe24hPct == null ? '—' : `${Math.round(aprobacion.respuesta.dentroDe24hPct)}%` },
                { etiqueta: 'Pendientes vencidas', valor: `${entero(vencidasPendientes)} de ${entero(pendientesTotal)}` },
              ]
            : []
        }
      >
        {aprobacion ? (
          <>
            <div className="grid gap-3 lg:h-[340px] lg:grid-cols-3">
              <PanelEstadistica
                title="Tiempo de respuesta"
                count={`${entero(aprobacion.respuesta.conDato)} respondidas`}
                accentColor={MARCA.rojo}
                centrar
                explicacion={EXPLICACIONES.respuesta}
              >
                {(grande) => <RespuestaKpis datos={aprobacion.respuesta} grande={grande} />}
              </PanelEstadistica>
              <PanelEstadistica title="Cuánto se tarda" count="respuestas por tramo" accentColor={MARCA.amarillo} centrar explicacion={EXPLICACIONES.histogramaRespuesta}>
                {(grande) => <HistogramaRespuesta tramos={aprobacion.distribucionRespuesta} alto={grande ? 360 : 220} />}
              </PanelEstadistica>
              <PanelEstadistica title="Esperando respuesta" count={`${entero(pendientesTotal)} pendientes`} accentColor={MARCA.naranja} centrar explicacion={EXPLICACIONES.pendientesAntiguedad}>
                {(grande) => <PendientesAntiguedad tramos={aprobacion.pendientesPorAntiguedad} alto={grande ? 360 : 200} />}
              </PanelEstadistica>
            </div>
            <div className="grid gap-3 lg:grid-cols-5">
              <PanelEstadistica
                title="Por analista"
                count={`${aprobacion.analistas.length} con reservas asignadas`}
                accentColor={MARCA.rojo}
                className="lg:col-span-3"
                scroll
                explicacion={EXPLICACIONES.analistas}
              >
                <Analistas filas={aprobacion.analistas} />
              </PanelEstadistica>
              <PanelEstadistica title="Según la antelación" count="cómo terminan por días de aviso" accentColor={MARCA.azul} className="lg:col-span-2" centrar explicacion={EXPLICACIONES.antelacion}>
                <Antelacion tramos={aprobacion.antelacion} />
              </PanelEstadistica>
            </div>
          </>
        ) : (
          <NoCargo />
        )}
      </Seccion>

      <Seccion
        id="espacios"
        icono={Building}
        color={MARCA.cian}
        titulo="Espacios y capacidad"
        descripcion="Si el tamaño de cada espacio acompaña lo que se hace en él."
        destacados={
          espacios
            ? [
                { etiqueta: 'Exceden el espacio', valor: entero(excedidos) },
                { etiqueta: 'Sobra espacio', valor: entero(sobrados) },
                ...(rangoOcupacion ? [{ etiqueta: 'Ocupación', valor: rangoOcupacion }] : []),
              ]
            : []
        }
      >
        {espacios ? (
          <>
            <div className="grid gap-3 lg:h-[500px] lg:grid-cols-5">
              <PanelEstadistica
                title="Capacidad contra ocupación"
                count="cada burbuja es un espacio · tamaño = reservas"
                accentColor={MARCA.cian}
                className="lg:col-span-3"
                explicacion={EXPLICACIONES.capacidadOcupacion}
              >
                {(grande) => <CapacidadOcupacion espacios={espacios.espacios} alto={grande ? 500 : 370} onFiltrar={porEspacio} />}
              </PanelEstadistica>
              <PanelEstadistica
                title="Uso de la capacidad"
                count="tutorías y eventos contra el tamaño del espacio"
                accentColor={MARCA.naranja}
                className="lg:col-span-2"
                scroll
                explicacion={EXPLICACIONES.usoCapacidad}
              >
                {(grande) => <UsoDeCapacidad filas={espacios.capacidad} limite={grande ? undefined : 12} espacios={espacios.espacios} onFiltrar={porEspacio} />}
              </PanelEstadistica>
            </div>
          </>
        ) : (
          <NoCargo />
        )}
      </Seccion>
    </div>
  );
}
