import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { ChevronDown, FileDown, GraduationCap, Presentation, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { HEADER_ACTION, HEADER_ACTION_ICON, PAGE_ACTIONS_SLOT } from '@/components/layouts/PageHeader';
import type { Academico } from '@/lib/api/stats';
import { descargarCSV, csvEscape } from '@/lib/utils/csv-helpers';
import { fechaCorta, type Rango } from '../periodo';
import { IndiceSecciones, Seccion } from '../Seccion';
import { PanelEstadistica } from '../PanelEstadistica';
import { EXPLICACIONES } from '../explicaciones';
import { entero, porcentaje, rating } from '../reservas/formato';
import { ChipsFiltros, FiltrosReservas } from '../reservas/FiltrosReservas';
import { textoFiltros, useFiltrosReservas } from '../reservas/filtros';
import { EventosLista, MateriasTutorias, ModalidadTutorias, SemanasTutorias, TutoriasKpis } from './Visuales';
import { EventosPorOcupacion, EventosPorTipo, EventosResumen, MejorCalificados } from './Eventos';
import { useEstadisticasAcademico } from './useEstadisticasAcademico';
import { MARCA } from '@/lib/design/paleta';
import { Skeleton } from '@/components/ui/skeleton';

const SECCIONES = [
  { id: 'tutorias', titulo: 'Tutorías', icono: GraduationCap, color: MARCA.amarillo },
  { id: 'eventos', titulo: 'Eventos', icono: Presentation, color: MARCA.verde },
];

function exportarCSV(datos: Academico, periodoTexto: string, filtrosTexto: string, rango: Rango) {
  const { tutorias: t, eventos: e } = datos;
  const filas = [
    `${csvEscape('Período')},${csvEscape(periodoTexto)}`,
    `Filtros,${csvEscape(filtrosTexto || 'Sin filtros')}`,
    '',
    'Tutorías,Valor',
    `Total,${t.total}`,
    `Presenciales,${t.presenciales}`,
    `Virtuales,${t.virtuales}`,
    `Grupales,${t.grupales}`,
    `Individuales,${t.individuales}`,
    `Cupo total,${t.cupoTotal}`,
    `Agendadas,${t.agendadas}`,
    `Asistieron,${t.asistieron}`,
    `Asistencia %,${t.asistenciaPct == null ? '' : t.asistenciaPct.toFixed(1)}`,
    `Calificación,${t.ratingPromedio == null ? '' : t.ratingPromedio.toFixed(1)}`,
    '',
    'Materia,Carrera,Tutorías,Agendadas,Asistieron,Calificación',
    ...datos.porMateria.map((m) => `${csvEscape(m.nombre)},${csvEscape(m.carreraNombre ?? '')},${m.tutorias},${m.agendadas},${m.asistieron},${m.ratingPromedio == null ? '' : m.ratingPromedio.toFixed(1)}`),
    '',
    'Semana,Tutorías,Agendadas,Asistieron',
    ...datos.porSemana.map((s) => `${s.semana},${s.tutorias},${s.agendadas},${s.asistieron}`),
    '',
    `Eventos,${e.total},Inscripciones,${e.inscripciones},Cupo total,${e.cupoTotal}`,
    'Evento,Tipo,Fecha,Espacio,Cupo,Inscriptos,Calificación',
    ...datos.eventosLista.map((v) => `${csvEscape(v.titulo)},${v.tipo},${v.fecha.slice(0, 10)},${csvEscape(v.espacioNombre ?? '')},${v.cupo ?? ''},${v.inscriptos},${v.ratingPromedio == null ? '' : v.ratingPromedio.toFixed(1)}`),
  ];
  descargarCSV(filas, `estadisticas_academicas_${rango.desde}_${rango.hasta}.csv`);
}

function Esqueleto() {
  return (
    <div className="space-y-3" aria-busy>
      <Skeleton className="h-[74px] rounded-xl" />
      <div className="grid gap-3 lg:grid-cols-3">
        <Skeleton className="h-[360px] rounded-xl" />
        <Skeleton className="h-[360px] rounded-xl lg:col-span-2" />
      </div>
    </div>
  );
}

/**
 * Estadísticas académicas: tutorías y eventos del período, con filtros de
 * espacio y carrera propios (?aedificio=, ?acarrera=…).
 */
export default function EstadisticasAcademico({ rango, periodoLabel }: Readonly<{ rango: Rango; periodoLabel: string }>) {
  const { filtros, activos, cambiar, limpiar } = useFiltrosReservas('a');
  const { datos, opciones, cargando, error, recargar } = useEstadisticasAcademico(rango, filtros);
  const periodoTexto = `${periodoLabel.toLowerCase()} (${fechaCorta(rango.desde)} al ${fechaCorta(rango.hasta)})`;
  const filtrosTexto = textoFiltros(opciones, filtros);

  const exportarPDF = async () => {
    if (!datos) return;
    try {
      const { exportAcademicoToPDF } = await import('@/lib/utils/pdf-export');
      exportAcademicoToPDF({ periodoTexto, filtrosTexto, datos, desde: rango.desde, hasta: rango.hasta });
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
          <Button variant="ghost" className={HEADER_ACTION} aria-label="Exportar" disabled={!datos}>
            <FileDown className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">Exportar</span>
            <ChevronDown className="ml-1 h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => datos && exportarCSV(datos, periodoTexto, filtrosTexto, rango)}>CSV</DropdownMenuItem>
          <DropdownMenuItem onClick={exportarPDF}>PDF</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );

  const t = datos?.tutorias;
  const e = datos?.eventos;
  const eventosLlenos = (datos?.eventosLista ?? []).filter((v) => v.cupo != null && Number(v.cupo) > 0 && Number(v.inscriptos) >= Number(v.cupo)).length;

  return (
    <div className="space-y-6 pb-16">
      {slot && createPortal(acciones, slot)}

      <IndiceSecciones
        // Se vuelve a montar cuando aparecen las secciones, para que el índice las siga.
        key={datos ? 'con-datos' : 'cargando'}
        secciones={SECCIONES}
        extra={<FiltrosReservas opciones={opciones} filtros={filtros} activos={activos} onCambiar={cambiar} onLimpiar={limpiar} sinRol />}
        debajo={activos ? <ChipsFiltros opciones={opciones} filtros={filtros} onCambiar={cambiar} /> : undefined}
      />

      {!datos && cargando ? (
        <Esqueleto />
      ) : !datos || !t || !e ? (
        <p className="rounded-xl border bg-card py-12 text-center text-sm text-muted-foreground">
          {error ? 'No se pudieron cargar las estadísticas académicas. Probá actualizar.' : 'Sin datos.'}
        </p>
      ) : (
        <div className={`space-y-6 transition-opacity ${cargando ? 'opacity-60' : ''}`}>
          <Seccion
            id="tutorias"
            icono={GraduationCap}
            color={MARCA.amarillo}
            titulo="Tutorías"
            descripcion="Cuánto se llenan las tutorías, cuántos de los inscriptos van y cómo las califican."
            destacados={[
              { etiqueta: 'Tutorías', valor: entero(t.total) },
              { etiqueta: 'Asistencia', valor: t.asistenciaPct == null ? '—' : `${Math.round(t.asistenciaPct)}%` },
              { etiqueta: 'Cupo ocupado', valor: t.ocupacionCupoPct == null ? '—' : `${Math.round(t.ocupacionCupoPct)}%` },
              { etiqueta: 'Calificación', valor: `★ ${rating(t.ratingPromedio)}` },
            ]}
          >
            <div className="grid gap-3 lg:h-[360px] lg:grid-cols-3">
              <PanelEstadistica title="Asistencia y cupo" count={`${entero(t.total)} en el período`} accentColor={MARCA.amarillo} centrar explicacion={EXPLICACIONES.tutorias}>
                {(grande) => <TutoriasKpis t={t} grande={grande} />}
              </PanelEstadistica>
              <PanelEstadistica title="Semana a semana" count="agendadas contra asistencias" accentColor={MARCA.verde} className="lg:col-span-2" centrar explicacion={EXPLICACIONES.semanasTutorias}>
                {(grande) => <SemanasTutorias semanas={datos.porSemana} alto={grande ? 440 : 250} desde={rango.desde} hasta={rango.hasta} />}
              </PanelEstadistica>
            </div>
            <div className="grid gap-3 lg:h-[460px] lg:grid-cols-3">
              <PanelEstadistica title="Por materia" count="las 15 con más agendadas" accentColor={MARCA.azul} className="lg:col-span-2" scroll explicacion={EXPLICACIONES.materias}>
                <MateriasTutorias filas={datos.porMateria} />
              </PanelEstadistica>
              <PanelEstadistica title="Modalidad" count="presencial, virtual, grupal" accentColor={MARCA.cian} centrar explicacion={EXPLICACIONES.modalidad}>
                {(grande) => <ModalidadTutorias t={t} grande={grande} />}
              </PanelEstadistica>
            </div>
          </Seccion>

          <Seccion
            id="eventos"
            icono={Presentation}
            color={MARCA.verde}
            titulo="Eventos"
            descripcion="Qué eventos se hicieron, cuánto se llenaron y cómo los calificaron."
            destacados={[
              { etiqueta: 'Eventos', valor: entero(e.total) },
              { etiqueta: 'Cupo ocupado', valor: `${porcentaje(Number(e.inscripciones), Number(e.cupoTotal))}%` },
              { etiqueta: 'Llenos', valor: entero(eventosLlenos) },
              { etiqueta: 'Calificación', valor: `★ ${rating(e.ratingPromedio)}` },
            ]}
          >
            <div className="grid gap-3 lg:h-[380px] lg:grid-cols-3">
              <PanelEstadistica title="Ocupación del cupo" count={`${entero(e.inscripciones)} inscripciones`} accentColor={MARCA.verde} centrar explicacion={EXPLICACIONES.eventosResumen}>
                {(grande) => <EventosResumen e={e} grande={grande} />}
              </PanelEstadistica>
              <PanelEstadistica title="Qué tan llenos" count="eventos por tramo de ocupación" accentColor={MARCA.amarillo} centrar explicacion={EXPLICACIONES.eventosTramos}>
                {(grande) => <EventosPorOcupacion eventos={datos.eventosLista} alto={grande ? 360 : 220} />}
              </PanelEstadistica>
              <PanelEstadistica title="Por tipo" count="cursos, talleres, eventos" accentColor="#9333ea" centrar explicacion={EXPLICACIONES.eventosTipo}>
                {(grande) => <EventosPorTipo eventos={datos.eventosLista} grande={grande} />}
              </PanelEstadistica>
            </div>
            <div className="grid gap-3 lg:h-[440px] lg:grid-cols-3">
              <PanelEstadistica
                title="Todos los eventos"
                count={`${entero(e.total)} · cupo ${entero(e.cupoTotal)}`}
                accentColor={MARCA.verde}
                className="lg:col-span-2"
                scroll
                explicacion={EXPLICACIONES.eventos}
              >
                <EventosLista eventos={datos.eventosLista} />
              </PanelEstadistica>
              <PanelEstadistica title="Mejor calificados" count="promedio de opiniones" accentColor={MARCA.amarillo} scroll explicacion={EXPLICACIONES.eventos}>
                <MejorCalificados eventos={datos.eventosLista} />
              </PanelEstadistica>
            </div>
          </Seccion>
        </div>
      )}
    </div>
  );
}
