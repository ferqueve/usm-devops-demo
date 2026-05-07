import { describe, it, expect } from 'vitest';
import {
  validateReservationFormData,
  toFinDeDiaISO,
  buildMensajeExitoReserva,
  resolverAnalistaId,
  calcularCantidadReservas,
  parseHorarioRecomendado,
  buildItemsParaEnviar,
  describeReservationError,
  HORARIO_VACIO,
  INITIAL_FORM_DATA,
  type ReservaFormValidation,
} from '@/components/reservations/_shared/reservationFormHelpers';

const futureStart = new Date(Date.now() + 60 * 60 * 1000);
const futureEnd = new Date(Date.now() + 2 * 60 * 60 * 1000);

const baseValid: ReservaFormValidation = {
  titulo: 'Clase X',
  espacioId: '1',
  fecha: new Date(Date.now() + 60 * 60 * 1000),
  horaInicioHora: '10',
  horaFinHora: '11',
  inicio: futureStart,
  fin: futureEnd,
  needsAnalystAssignment: false,
};

describe('validateReservationFormData', () => {
  it('válida -> null', () => {
    expect(validateReservationFormData(baseValid)).toBeNull();
  });

  it('falta titulo', () => {
    expect(validateReservationFormData({ ...baseValid, titulo: '' })).toContain('título');
  });

  it('falta espacio', () => {
    expect(validateReservationFormData({ ...baseValid, espacioId: '' })).toContain('espacio');
  });

  it('falta fecha', () => {
    expect(validateReservationFormData({ ...baseValid, fecha: undefined })).toContain('fecha');
  });

  it('hora fin <= hora inicio', () => {
    expect(validateReservationFormData({ ...baseValid, fin: futureStart })).toContain('posterior');
  });

  it('fecha en pasado', () => {
    // inicio en el pasado pero con duración >= 30min para llegar al check de "pasado"
    const past = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const pastEnd = new Date(Date.now() - 60 * 60 * 1000);
    expect(validateReservationFormData({ ...baseValid, inicio: past, fin: pastEnd })).toContain('pasado');
  });

  it('duración <30min', () => {
    const start = new Date(Date.now() + 60 * 60 * 1000);
    const end = new Date(start.getTime() + 10 * 60 * 1000);
    expect(validateReservationFormData({ ...baseValid, inicio: start, fin: end })).toContain('30 minutos');
  });

  it('analista requerido', () => {
    expect(
      validateReservationFormData({ ...baseValid, needsAnalystAssignment: true })
    ).toContain('analista');
  });

  it('recurrencia sin fecha fin', () => {
    expect(
      validateReservationFormData({ ...baseValid, tipoRecurrencia: 'DIARIA' })
    ).toContain('recurrencia');
  });

  it('recurrencia con fecha fin <= fecha', () => {
    const fecha = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const fechaFin = new Date(fecha.getTime() - 1000);
    expect(
      validateReservationFormData({
        ...baseValid,
        fecha,
        tipoRecurrencia: 'DIARIA',
        fechaFinRecurrencia: fechaFin,
      })
    ).toContain('posterior');
  });
});

describe('toFinDeDiaISO', () => {
  it('devuelve ISO UTC', () => {
    const r = toFinDeDiaISO(new Date(2025, 0, 15));
    expect(r).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});

describe('buildMensajeExitoReserva', () => {
  it('singular sin analista', () => {
    expect(
      buildMensajeExitoReserva({ cantidadReservas: 1, needsAnalystAssignment: false })
    ).toBe('Reserva creada exitosamente');
  });

  it('plural sin analista', () => {
    expect(
      buildMensajeExitoReserva({ cantidadReservas: 3, needsAnalystAssignment: false })
    ).toContain('3 reservas');
  });

  it('con analista (default docente)', () => {
    const r = buildMensajeExitoReserva({ cantidadReservas: 1, needsAnalystAssignment: true });
    expect(r).toContain('Solicitud');
    expect(r).toContain('enviada');
  });

  it('con analista variantDocente=false (externo)', () => {
    const r = buildMensajeExitoReserva({
      cantidadReservas: 1,
      needsAnalystAssignment: true,
      variantDocente: false,
    });
    expect(r).toContain('creada');
  });

  it('con analista plural', () => {
    const r = buildMensajeExitoReserva({ cantidadReservas: 4, needsAnalystAssignment: true });
    expect(r).toContain('4 reservas');
  });
});

describe('resolverAnalistaId', () => {
  it('canApprove -> userId', () => {
    expect(resolverAnalistaId({ canApprove: true, needsAnalystAssignment: false, userId: 7 })).toBe(7);
  });

  it('needsAnalystAssignment con id -> parsea', () => {
    expect(
      resolverAnalistaId({ canApprove: false, needsAnalystAssignment: true, analistaId: '5' })
    ).toBe(5);
  });

  it('default undefined', () => {
    expect(resolverAnalistaId({ canApprove: false, needsAnalystAssignment: false })).toBeUndefined();
  });
});

describe('calcularCantidadReservas', () => {
  const start = new Date(2025, 0, 1);

  it('fin <= inicio -> 0', () => {
    expect(calcularCantidadReservas(start, start, 'DIARIA')).toBe(0);
  });

  it('DIARIA 7 días', () => {
    const end = new Date(2025, 0, 8);
    expect(calcularCantidadReservas(start, end, 'DIARIA')).toBe(8);
  });

  it('SEMANAL', () => {
    const end = new Date(2025, 0, 22);
    expect(calcularCantidadReservas(start, end, 'SEMANAL')).toBe(4);
  });

  it('MENSUAL', () => {
    const end = new Date(2025, 3, 1);
    expect(calcularCantidadReservas(start, end, 'MENSUAL')).toBe(4);
  });
});

describe('parseHorarioRecomendado', () => {
  it('devuelve null si fechas inválidas', () => {
    expect(parseHorarioRecomendado('xxx', 'yyy')).toBeNull();
  });

  it('parsea correctamente', () => {
    const r = parseHorarioRecomendado('2025-01-15T10:30:00', '2025-01-15T11:45:00');
    expect(r).not.toBeNull();
    expect(r?.horaInicioHora).toMatch(/^\d{2}$/);
    expect(r?.horaInicioMinuto).toMatch(/^\d{2}$/);
  });
});

describe('buildItemsParaEnviar', () => {
  it('lista vacía -> undefined', () => {
    expect(buildItemsParaEnviar([])).toBeUndefined();
  });

  it('mapea items', () => {
    const r = buildItemsParaEnviar([
      { tipoElementoId: 1, inventarioItemId: 2, cantidadSolicitada: 3, observaciones: 'obs' },
    ]);
    expect(r).toHaveLength(1);
    expect(r?.[0]).toMatchObject({ tipoElementoId: 1, inventarioItemId: 2, cantidadSolicitada: 3, observaciones: 'obs' });
  });

  it('observaciones vacías -> undefined', () => {
    const r = buildItemsParaEnviar([
      { tipoElementoId: 1, cantidadSolicitada: 1, observaciones: '' },
    ]);
    expect(r?.[0].observaciones).toBeUndefined();
  });
});

describe('describeReservationError', () => {
  it('detecta conflicto', () => {
    const r = describeReservationError(new Error('espacio ocupado'));
    expect(r.title).toContain('reservado');
  });

  it('detecta pasado', () => {
    const r = describeReservationError(new Error('en el pasado'));
    expect(r.title).toContain('pasado');
  });

  it('genérico', () => {
    const r = describeReservationError(new Error('boom'));
    expect(r.title).toBe('Error al crear reserva');
    expect(r.description).toBe('boom');
  });

  it('non-Error fallback', () => {
    const r = describeReservationError('algo');
    expect(r.title).toBe('Error al crear reserva');
  });
});

describe('constants', () => {
  it('HORARIO_VACIO existe', () => {
    expect(HORARIO_VACIO.horaInicioHora).toBe('');
  });

  it('INITIAL_FORM_DATA existe', () => {
    expect(INITIAL_FORM_DATA.espacioId).toBe('');
  });
});
