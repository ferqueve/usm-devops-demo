import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { reservationsApi } from '@/lib/api/reservations';
import { usuariosApi } from '@/lib/api/users';
import type { Reserva } from '@/lib/types/spaces';
import type { User } from '@/lib/types/users';
import { toUTC } from '@/lib/utils/timezone';
import {
  HORARIO_VACIO,
  INITIAL_FORM_DATA,
  type ItemSolicitadoForm,
  type ReservaFormDataShape,
  buildItemsParaEnviar,
  buildMensajeExitoReserva,
  calcularCantidadReservas,
  describeReservationError,
  parseHorarioRecomendado,
  resolverAnalistaId,
  toFinDeDiaISO,
  validateReservationFormData,
} from './reservationFormHelpers';

const HORAS_OPCIONES = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTOS_OPCIONES = ['00', '15', '30', '45'];

interface SubmitOptions {
  esPublica?: boolean;
}

export interface UseReservationFormStateOptions {
  needsAnalystAssignment: boolean;
  canApprove: boolean;
  canViewRecommendations: boolean;
  userId?: number;
  // open === undefined => siempre activo (página standalone como ReservationForm).
  // open booleano => se reinicializa cuando el contenedor (Dialog) cambia de estado.
  open?: boolean;
  // Dispara variantes de mensaje según convención por archivo. ReservationForm siempre usa
  // "enviada"; ReservationFormDialog usa "creada" cuando el usuario es EXTERNO (sin canViewRecommendations).
  mensajeExitoVariantDocente?: boolean;
  // Permite añadir efectos secundarios extra (p.ej. cargar recomendaciones generales) cuando
  // se reinicia el formulario.
  onReset?: () => void;
}

export interface UseReservationFormStateResult {
  // Form state
  formData: ReservaFormDataShape;
  setFormData: React.Dispatch<React.SetStateAction<ReservaFormDataShape>>;
  fecha: Date | undefined;
  setFecha: React.Dispatch<React.SetStateAction<Date | undefined>>;
  horaError: string;
  loading: boolean;
  itemsSolicitados: ItemSolicitadoForm[];
  setItemsSolicitados: React.Dispatch<React.SetStateAction<ItemSolicitadoForm[]>>;
  reservasEspacio: Reserva[];
  disabledDates: Date[];
  analistas: User[];
  // Computed
  horasInicioDisponibles: string[];
  horasFinDisponibles: string[];
  minutosInicioDisponibles: string[];
  minutosFinDisponibles: string[];
  isFormValid: boolean;
  // Handlers para items
  agregarItemSolicitado: (defaultTipoId: number) => void;
  eliminarItemSolicitado: (index: number) => void;
  actualizarItemSolicitado: (index: number, field: string, value: string | number) => void;
  agregarItemRecomendado: (tipoElementoId: number, cantidad: number) => void;
  // Handler para horarios recomendados
  handleSelectHorarioRecomendado: (inicio: string, fin: string) => void;
  // Submit
  handleSubmit: (e: React.FormEvent, opts?: SubmitOptions) => Promise<void>;
  // Helpers expuestos para la UI
  calcularCantidadReservasFn: typeof calcularCantidadReservas;
}

interface SubmitDeps {
  needsAnalystAssignment: boolean;
  canApprove: boolean;
  canViewRecommendations: boolean;
  userId?: number;
  mensajeExitoVariantDocente?: boolean;
  onSuccess: () => void;
}

interface SubmitContext {
  formData: ReservaFormDataShape;
  fecha: Date | undefined;
  itemsSolicitados: ItemSolicitadoForm[];
  setLoading: (v: boolean) => void;
}

async function performSubmit(
  ctx: SubmitContext,
  deps: SubmitDeps,
  opts: SubmitOptions
): Promise<void> {
  const { formData, fecha, itemsSolicitados, setLoading } = ctx;

  const horaInicio = `${formData.horaInicioHora}:${formData.horaInicioMinuto}`;
  const horaFin = `${formData.horaFinHora}:${formData.horaFinMinuto}`;
  const fechaStr = fecha?.toISOString().split('T')[0] ?? '';
  const inicio = new Date(`${fechaStr}T${horaInicio}`);
  const fin = new Date(`${fechaStr}T${horaFin}`);

  const validationError = validateReservationFormData({
    titulo: formData.titulo,
    espacioId: formData.espacioId,
    fecha,
    horaInicioHora: formData.horaInicioHora,
    horaFinHora: formData.horaFinHora,
    inicio,
    fin,
    needsAnalystAssignment: deps.needsAnalystAssignment,
    analistaId: formData.analistaId,
    tipoRecurrencia: formData.tipoRecurrencia,
    fechaFinRecurrencia: formData.fechaFinRecurrencia,
  });
  if (validationError) {
    toast.error(validationError);
    return;
  }

  setLoading(true);
  try {
    const inicioISO = toUTC(inicio);
    const finISO = toUTC(fin);
    const fechaFinRecurrenciaISO = formData.fechaFinRecurrencia
      ? toFinDeDiaISO(formData.fechaFinRecurrencia)
      : undefined;

    await reservationsApi.crearReserva({
      espacioId: Number.parseInt(formData.espacioId),
      carreraId: formData.carreraId ? Number.parseInt(formData.carreraId) : undefined,
      titulo: formData.titulo.trim(),
      motivoSolicitud: formData.motivoSolicitud?.trim() || undefined,
      inicio: inicioISO,
      fin: finISO,
      tipoRecurrencia: formData.tipoRecurrencia || undefined,
      fechaFinRecurrencia: fechaFinRecurrenciaISO,
      analistaId: resolverAnalistaId({
        canApprove: deps.canApprove,
        needsAnalystAssignment: deps.needsAnalystAssignment,
        analistaId: formData.analistaId,
        userId: deps.userId,
      }),
      esPublica: opts.esPublica,
      itemsSolicitados: buildItemsParaEnviar(itemsSolicitados),
    });

    const cantidadReservas = formData.tipoRecurrencia && formData.fechaFinRecurrencia && fecha
      ? calcularCantidadReservas(fecha, formData.fechaFinRecurrencia, formData.tipoRecurrencia)
      : 1;
    toast.success(buildMensajeExitoReserva({
      cantidadReservas,
      needsAnalystAssignment: deps.needsAnalystAssignment,
      variantDocente: deps.mensajeExitoVariantDocente,
    }));
    deps.onSuccess();
  } catch (error: unknown) {
    console.error('Error al crear reserva:', error);
    const descriptor = describeReservationError(error);
    if (descriptor.description) {
      toast.error(descriptor.title, { description: descriptor.description });
    } else {
      toast.error(descriptor.title);
    }
  } finally {
    setLoading(false);
  }
}

// Calcula horas ocupadas en una fecha a partir de las reservas aprobadas del espacio
function calcularHorasOcupadas(fecha: Date | undefined, reservasEspacio: Reserva[]): Set<number> {
  if (!fecha || reservasEspacio.length === 0) {
    return new Set<number>();
  }
  const fechaStr = fecha.toISOString().split('T')[0];
  const reservasDia = reservasEspacio.filter(reserva => {
    const inicio = new Date(reserva.inicio);
    const fin = new Date(reserva.fin);
    const inicioStr = inicio.toISOString().split('T')[0];
    const finStr = fin.toISOString().split('T')[0];
    return inicioStr === fechaStr || finStr === fechaStr ||
      (inicio.toISOString() < fecha + 'T23:59:59' && fin.toISOString() > fecha + 'T00:00:00');
  });

  const horasOcupadas = new Set<number>();
  reservasDia.forEach(reserva => {
    const inicio = new Date(reserva.inicio);
    const fin = new Date(reserva.fin);
    const inicioStr = inicio.toISOString().split('T')[0];
    const finStr = fin.toISOString().split('T')[0];
    if (inicioStr === fechaStr && finStr === fechaStr) {
      const horaInicio = inicio.getHours();
      const horaFin = fin.getHours();
      for (let h = horaInicio; h <= horaFin; h++) {
        horasOcupadas.add(h);
      }
    }
  });
  return horasOcupadas;
}

interface FiltroHoraOpcionesArgs {
  horasOcupadas: Set<number>;
  fecha: Date | undefined;
  formData: ReservaFormDataShape;
}

function filtrarHorasInicio({ horasOcupadas, fecha, formData }: FiltroHoraOpcionesArgs): string[] {
  const ahora = new Date();
  const esHoy = fecha?.toDateString() === ahora.toDateString();
  const horaActual = ahora.getHours();

  return HORAS_OPCIONES.filter(hora => {
    const horaNum = Number.parseInt(hora);
    if (horasOcupadas.has(horaNum)) return false;
    if (esHoy) {
      if (horaNum < horaActual) return false;
      if (horaNum === horaActual) return true;
    }
    if (formData.horaFinHora) {
      const horaFinNum = Number.parseInt(formData.horaFinHora);
      if (horaNum === horaFinNum) {
        const minInicio = Number.parseInt(formData.horaInicioMinuto || '0');
        const minFin = Number.parseInt(formData.horaFinMinuto || '0');
        return minInicio < minFin;
      }
      return horaNum < horaFinNum;
    }
    return true;
  });
}

function filtrarHorasFin({ horasOcupadas, fecha, formData }: FiltroHoraOpcionesArgs): string[] {
  const ahora = new Date();
  const esHoy = fecha?.toDateString() === ahora.toDateString();
  const horaActual = ahora.getHours();

  return HORAS_OPCIONES.filter(hora => {
    const horaNum = Number.parseInt(hora);
    if (horasOcupadas.has(horaNum)) return false;
    if (esHoy && horaNum < horaActual) return false;
    if (formData.horaInicioHora) {
      const horaInicioNum = Number.parseInt(formData.horaInicioHora);
      if (horaNum === horaInicioNum) return true;
      return horaNum > horaInicioNum;
    }
    return true;
  });
}

function filtrarMinutosInicio(formData: ReservaFormDataShape, fecha: Date | undefined): string[] {
  if (!formData.horaInicioHora) return MINUTOS_OPCIONES;
  const ahora = new Date();
  const esHoy = fecha?.toDateString() === ahora.toDateString();
  const horaActual = ahora.getHours();
  const minutoActual = ahora.getMinutes();
  const horaInicioNum = Number.parseInt(formData.horaInicioHora);
  if (esHoy && horaInicioNum === horaActual) {
    return MINUTOS_OPCIONES.filter(min => Number.parseInt(min) > minutoActual);
  }
  if (formData.horaFinHora && formData.horaInicioHora === formData.horaFinHora) {
    const minFin = Number.parseInt(formData.horaFinMinuto || '0');
    return MINUTOS_OPCIONES.filter(min => Number.parseInt(min) < minFin);
  }
  return MINUTOS_OPCIONES;
}

function filtrarMinutosFin(formData: ReservaFormDataShape, fecha: Date | undefined): string[] {
  if (!formData.horaFinHora) return MINUTOS_OPCIONES;
  const ahora = new Date();
  const esHoy = fecha?.toDateString() === ahora.toDateString();
  const horaActual = ahora.getHours();
  const minutoActual = ahora.getMinutes();
  const horaFinNum = Number.parseInt(formData.horaFinHora);
  if (esHoy && horaFinNum === horaActual) {
    return MINUTOS_OPCIONES.filter(min => Number.parseInt(min) > minutoActual);
  }
  if (formData.horaInicioHora && formData.horaInicioHora === formData.horaFinHora) {
    const minInicio = Number.parseInt(formData.horaInicioMinuto || '0');
    return MINUTOS_OPCIONES.filter(min => Number.parseInt(min) - minInicio >= 30);
  }
  return MINUTOS_OPCIONES;
}

// Hook que encapsula todo el estado y lógica del formulario de reservas
// (compartido entre ReservationForm y ReservationFormDialog).
export function useReservationFormState(
  options: UseReservationFormStateOptions,
  onSuccess: () => void
): UseReservationFormStateResult {
  const { needsAnalystAssignment, canApprove, canViewRecommendations, userId, open, mensajeExitoVariantDocente, onReset } = options;

  const [loading, setLoading] = useState(false);
  const [analistas, setAnalistas] = useState<User[]>([]);
  const [fecha, setFecha] = useState<Date | undefined>(new Date());
  const [horaError, setHoraError] = useState<string>('');
  const [reservasEspacio, setReservasEspacio] = useState<Reserva[]>([]);
  const [disabledDates, setDisabledDates] = useState<Date[]>([]);
  const [itemsSolicitados, setItemsSolicitados] = useState<ItemSolicitadoForm[]>([]);
  const [formData, setFormData] = useState<ReservaFormDataShape>(INITIAL_FORM_DATA);

  const fetchAnalistas = useCallback(async () => {
    try {
      const response = await usuariosApi.listarAnalistas();
      if (response.data) {
        setAnalistas(response.data);
        if (response.data.length === 0) {
          toast.warning('No hay analistas disponibles en el sistema. Contacta al administrador.', {
            duration: 5000,
          });
        }
      }
    } catch (error) {
      console.error('Error al cargar analistas:', error);
      toast.error('Error al cargar analistas disponibles', {
        description: 'Por favor, contacta al administrador del sistema',
      });
    }
  }, []);

  const fetchAnalistasRef = useRef(fetchAnalistas);
  const onResetRef = useRef(onReset);
  useEffect(() => {
    fetchAnalistasRef.current = fetchAnalistas;
    onResetRef.current = onReset;
  });

  // Reset del formulario cuando cambia el contenedor (open) o el flag de necesidad de analista.
  useEffect(() => {
    if (needsAnalystAssignment) {
      fetchAnalistasRef.current();
    }
    setFecha(new Date());
    setHoraError('');
    setItemsSolicitados([]);
    setFormData(INITIAL_FORM_DATA);
    if (onResetRef.current) onResetRef.current();
  }, [needsAnalystAssignment, open]);

  // Calcular días completamente ocupados (24h) deshabilitados en el date picker
  const calcularDiasOcupados = useCallback((reservas: Reserva[]) => {
    const diasOcupados = new Set<string>();
    reservas.forEach(reserva => {
      const inicio = new Date(reserva.inicio);
      const fin = new Date(reserva.fin);
      if (inicio.getHours() === 0 && inicio.getMinutes() === 0
        && fin.getHours() === 23 && fin.getMinutes() === 59) {
        const fechaKey = inicio.toISOString().split('T')[0];
        diasOcupados.add(fechaKey);
      }
    });
    const fechasDeshabilitadas = Array.from(diasOcupados).map(fechaStr => {
      const [year, month, day] = fechaStr.split('-').map(Number);
      return new Date(year, month - 1, day);
    });
    setDisabledDates(fechasDeshabilitadas);
  }, []);

  // Cargar reservas del espacio seleccionado
  const fetchReservasEspacio = useCallback(async (espacioId: string) => {
    if (!espacioId) {
      setReservasEspacio([]);
      setDisabledDates([]);
      return;
    }
    try {
      const response = await reservationsApi.obtenerReservasPorEspacio(Number.parseInt(espacioId));
      if (response.data) {
        const reservasAprobadas = response.data.filter(r => r.estado === 'APROBADO');
        setReservasEspacio(reservasAprobadas);
        calcularDiasOcupados(reservasAprobadas);
      }
    } catch (error) {
      console.error('Error al cargar reservas del espacio:', error);
      setReservasEspacio([]);
      setDisabledDates([]);
    }
  }, [calcularDiasOcupados]);

  useEffect(() => {
    if (formData.espacioId) {
      fetchReservasEspacio(formData.espacioId);
    } else {
      setReservasEspacio([]);
      setDisabledDates([]);
    }
  }, [formData.espacioId, fetchReservasEspacio]);

  // Validar horas en tiempo real
  useEffect(() => {
    if (formData.horaInicioHora && formData.horaFinHora && fecha) {
      const horaInicio = `${formData.horaInicioHora}:${formData.horaInicioMinuto}`;
      const horaFin = `${formData.horaFinHora}:${formData.horaFinMinuto}`;
      const fechaStr = fecha.toISOString().split('T')[0];
      const inicio = new Date(`${fechaStr}T${horaInicio}`);
      const fin = new Date(`${fechaStr}T${horaFin}`);
      if (fin <= inicio) {
        setHoraError('La hora de fin debe ser posterior a la hora de inicio');
      } else {
        setHoraError('');
      }
    } else {
      setHoraError('');
    }
  }, [formData, fecha]);

  // Computed: opciones de horas/minutos disponibles
  const horasOcupadas = calcularHorasOcupadas(fecha, reservasEspacio);
  const horasInicioDisponibles = filtrarHorasInicio({ horasOcupadas, fecha, formData });
  const horasFinDisponibles = filtrarHorasFin({ horasOcupadas, fecha, formData });
  const minutosInicioDisponibles = filtrarMinutosInicio(formData, fecha);
  const minutosFinDisponibles = filtrarMinutosFin(formData, fecha);

  // Handlers para items
  const agregarItemSolicitado = useCallback((defaultTipoId: number) => {
    setItemsSolicitados(prev => [...prev, {
      tipoElementoId: defaultTipoId,
      cantidadSolicitada: 1,
      observaciones: '',
    }]);
  }, []);

  const eliminarItemSolicitado = useCallback((index: number) => {
    setItemsSolicitados(prev => prev.filter((_, i) => i !== index));
  }, []);

  const actualizarItemSolicitado = useCallback(
    (index: number, field: string, value: string | number) => {
      setItemsSolicitados(prev => prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ));
    },
    []
  );

  const agregarItemRecomendado = useCallback((tipoElementoId: number, cantidad: number) => {
    setItemsSolicitados(prev => {
      if (prev.some(item => item.tipoElementoId === tipoElementoId)) return prev;
      return [...prev, {
        tipoElementoId,
        cantidadSolicitada: cantidad,
        observaciones: '',
      }];
    });
  }, []);

  // Handler para horarios recomendados
  const handleSelectHorarioRecomendado = useCallback((inicio: string, fin: string) => {
    if (!inicio && !fin) {
      setFormData(prev => ({ ...prev, ...HORARIO_VACIO }));
      return;
    }
    const parsed = parseHorarioRecomendado(inicio, fin);
    if (!parsed) {
      toast.error('Error al seleccionar el horario. Por favor, inténtalo de nuevo.');
      return;
    }
    setFormData(prev => ({ ...prev, ...parsed }));
  }, []);

  // Form valid?
  const isFormValid = !!(
    formData.titulo &&
    formData.titulo.trim() !== '' &&
    formData.espacioId &&
    fecha &&
    formData.horaInicioHora &&
    formData.horaFinHora &&
    !horaError &&
    (!needsAnalystAssignment || formData.analistaId)
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent, opts: SubmitOptions = {}) => {
      e.preventDefault();
      await performSubmit(
        { formData, fecha, itemsSolicitados, setLoading },
        {
          needsAnalystAssignment,
          canApprove,
          canViewRecommendations,
          userId,
          mensajeExitoVariantDocente,
          onSuccess,
        },
        opts
      );
    },
    [formData, fecha, itemsSolicitados, needsAnalystAssignment, canApprove, canViewRecommendations, userId, mensajeExitoVariantDocente, onSuccess]
  );

  return {
    formData,
    setFormData,
    fecha,
    setFecha,
    horaError,
    loading,
    itemsSolicitados,
    setItemsSolicitados,
    reservasEspacio,
    disabledDates,
    analistas,
    horasInicioDisponibles,
    horasFinDisponibles,
    minutosInicioDisponibles,
    minutosFinDisponibles,
    isFormValid,
    agregarItemSolicitado,
    eliminarItemSolicitado,
    actualizarItemSolicitado,
    agregarItemRecomendado,
    handleSelectHorarioRecomendado,
    handleSubmit,
    calcularCantidadReservasFn: calcularCantidadReservas,
  };
}
