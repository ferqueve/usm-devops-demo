import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

vi.mock('@/lib/api/reservations', () => ({
  reservationsApi: {
    crearReserva: vi.fn(),
    obtenerReservasPorEspacio: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

vi.mock('@/lib/api/users', () => ({
  usuariosApi: {
    listarAnalistas: vi.fn().mockResolvedValue({ data: [{ id: 1, nombre: 'Ana' }] }),
  },
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() },
}));

import { useReservationFormState } from '@/components/reservations/_shared/useReservationFormState';
import { reservationsApi } from '@/lib/api/reservations';
import { usuariosApi } from '@/lib/api/users';
import { toast } from 'sonner';

const baseOptions = {
  needsAnalystAssignment: false,
  puedeElegirAnalista: false,
  canApprove: true,
  canViewRecommendations: true,
  userId: 1,
};

describe('useReservationFormState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(reservationsApi.obtenerReservasPorEspacio).mockResolvedValue({ data: [] } as never);
    vi.mocked(usuariosApi.listarAnalistas).mockResolvedValue({ data: [{ id: 1, nombre: 'Ana' }] } as never);
  });

  it('inicializa con INITIAL_FORM_DATA', () => {
    const onSuccess = vi.fn();
    const { result } = renderHook(() =>
      useReservationFormState(baseOptions, onSuccess)
    );
    expect(result.current.formData.titulo).toBe('');
    expect(result.current.formData.espacioId).toBe('');
    expect(result.current.fecha).toBeInstanceOf(Date);
    expect(result.current.isFormValid).toBe(false);
    expect(result.current.itemsSolicitados).toEqual([]);
  });

  it('no carga analistas si el usuario no elige analista', async () => {
    renderHook(() => useReservationFormState(baseOptions, vi.fn()));
    await waitFor(() => {
      expect(usuariosApi.listarAnalistas).not.toHaveBeenCalled();
    });
  });

  it('carga analistas solo si el usuario elige analista', async () => {
    renderHook(() =>
      useReservationFormState({ ...baseOptions, needsAnalystAssignment: true, puedeElegirAnalista: true }, vi.fn())
    );
    await waitFor(() => {
      expect(usuariosApi.listarAnalistas).toHaveBeenCalled();
    });
  });

  // Un EXTERNO no puede listar analistas: si el formulario se los pidiera, se
  // comeria un 403 y el envio quedaria bloqueado para siempre.
  it('un usuario que no elige analista puede enviar sin elegirlo', async () => {
    const { result } = renderHook(() =>
      useReservationFormState(
        { ...baseOptions, canApprove: false, needsAnalystAssignment: true, puedeElegirAnalista: false },
        vi.fn(),
      )
    );

    await waitFor(() => {
      expect(usuariosApi.listarAnalistas).not.toHaveBeenCalled();
    });

    act(() => {
      result.current.setFormData((prev) => ({
        ...prev,
        titulo: 'Charla abierta',
        espacioId: '1',
        horaInicioHora: '10',
        horaFinHora: '11',
      }));
    });

    expect(result.current.isFormValid).toBe(true);
  });

  it('agregar/eliminar/actualizar item solicitado', () => {
    const { result } = renderHook(() =>
      useReservationFormState(baseOptions, vi.fn())
    );

    act(() => result.current.agregarItemSolicitado(5));
    expect(result.current.itemsSolicitados).toHaveLength(1);
    expect(result.current.itemsSolicitados[0].tipoElementoId).toBe(5);

    act(() => result.current.actualizarItemSolicitado(0, 'cantidadSolicitada', 7));
    expect(result.current.itemsSolicitados[0].cantidadSolicitada).toBe(7);

    act(() => result.current.eliminarItemSolicitado(0));
    expect(result.current.itemsSolicitados).toHaveLength(0);
  });

  it('agregarItemRecomendado evita duplicados por tipoElementoId', () => {
    const { result } = renderHook(() =>
      useReservationFormState(baseOptions, vi.fn())
    );
    act(() => result.current.agregarItemRecomendado(3, 2));
    act(() => result.current.agregarItemRecomendado(3, 9));
    expect(result.current.itemsSolicitados).toHaveLength(1);
    expect(result.current.itemsSolicitados[0].cantidadSolicitada).toBe(2);
  });

  it('handleSelectHorarioRecomendado vacía limpia campos', () => {
    const { result } = renderHook(() =>
      useReservationFormState(baseOptions, vi.fn())
    );
    act(() => {
      result.current.setFormData(prev => ({
        ...prev,
        horaInicioHora: '10',
        horaInicioMinuto: '30',
        horaFinHora: '12',
        horaFinMinuto: '00',
      }));
    });
    act(() => result.current.handleSelectHorarioRecomendado('', ''));
    expect(result.current.formData.horaInicioHora).toBe('');
    expect(result.current.formData.horaFinHora).toBe('');
  });

  it('handleSubmit muestra error de validación si faltan campos', async () => {
    const onSuccess = vi.fn();
    const { result } = renderHook(() =>
      useReservationFormState(baseOptions, onSuccess)
    );

    const fakeEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;
    await act(async () => {
      await result.current.handleSubmit(fakeEvent);
    });
    expect(fakeEvent.preventDefault).toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalled();
    expect(reservationsApi.crearReserva).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('valida hora fin posterior a hora inicio (horaError)', async () => {
    const { result } = renderHook(() =>
      useReservationFormState(baseOptions, vi.fn())
    );
    act(() => {
      result.current.setFormData(prev => ({
        ...prev,
        horaInicioHora: '14',
        horaInicioMinuto: '00',
        horaFinHora: '10',
        horaFinMinuto: '00',
      }));
    });
    await waitFor(() => expect(result.current.horaError).not.toBe(''));
  });

  it('handleSubmit envía con datos válidos y llama onSuccess', async () => {
    vi.mocked(reservationsApi.crearReserva).mockResolvedValueOnce({ data: { id: 99 } } as never);
    const onSuccess = vi.fn();
    const { result } = renderHook(() =>
      useReservationFormState(baseOptions, onSuccess)
    );

    act(() => {
      result.current.setFecha(new Date('2030-06-15T00:00:00Z'));
      result.current.setFormData(prev => ({
        ...prev,
        titulo: 'Reunion',
        espacioId: '1',
        horaInicioHora: '10',
        horaInicioMinuto: '00',
        horaFinHora: '11',
        horaFinMinuto: '00',
      }));
    });

    await waitFor(() => expect(result.current.isFormValid).toBe(true));

    const fakeEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;
    await act(async () => {
      await result.current.handleSubmit(fakeEvent);
    });

    expect(reservationsApi.crearReserva).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalled();
  });
});
