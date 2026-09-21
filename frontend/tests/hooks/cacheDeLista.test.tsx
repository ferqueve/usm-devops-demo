import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';

const toastError = vi.fn();
vi.mock('sonner', () => ({ toast: { error: (...a: unknown[]) => toastError(...a) } }));

import { crearCacheDeLista, CACHE_CORTO } from '@/hooks/cacheDeLista';

interface Fruta { id: number; nombre: string }

function montarCon(pedir: () => Promise<{ data?: Fruta[] | null }>, duracion = CACHE_CORTO) {
  const cache = crearCacheDeLista<Fruta>({ pedir, nombre: 'las frutas', duracion });
  function Vista() {
    const { datos, loading, error } = cache.useLista();
    if (loading) return <p>cargando</p>;
    if (error) return <p>error: {error.message}</p>;
    return <p>{datos.map((f) => f.nombre).join(',') || 'vacío'}</p>;
  }
  return { cache, Vista };
}

const UNA = [{ id: 1, nombre: 'pera' }];

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.useRealTimers());

describe('crearCacheDeLista', () => {
  it('trae la lista y la muestra', async () => {
    const pedir = vi.fn().mockResolvedValue({ data: UNA });
    const { Vista } = montarCon(pedir);
    render(<Vista />);
    expect(await screen.findByText('pera')).toBeInTheDocument();
    expect(pedir).toHaveBeenCalledOnce();
  });

  // Lo que evita la estampida: tres pantallas que montan juntas no largan
  // tres peticiones, esperan a la primera.
  it('tres componentes a la vez hacen una sola llamada', async () => {
    let resolver: (v: { data: Fruta[] }) => void = () => {};
    const pedir = vi.fn(() => new Promise<{ data: Fruta[] }>((r) => { resolver = r; }));
    const { Vista } = montarCon(pedir);
    render(<><Vista /><Vista /><Vista /></>);
    expect(pedir).toHaveBeenCalledOnce();
    await act(async () => { resolver({ data: UNA }); });
    await waitFor(() => expect(screen.getAllByText('pera')).toHaveLength(3));
    expect(pedir).toHaveBeenCalledOnce();
  });

  it('montar de nuevo dentro de la ventana no vuelve a pedir', async () => {
    const pedir = vi.fn().mockResolvedValue({ data: UNA });
    const { Vista } = montarCon(pedir);
    const uno = render(<Vista />);
    await screen.findByText('pera');
    uno.unmount();
    render(<Vista />);
    await screen.findByText('pera');
    expect(pedir).toHaveBeenCalledOnce();
  });

  it('pasada la ventana, vuelve a pedir', async () => {
    const pedir = vi.fn().mockResolvedValue({ data: UNA });
    const { Vista } = montarCon(pedir, 1000);
    const uno = render(<Vista />);
    await screen.findByText('pera');
    uno.unmount();
    vi.useFakeTimers().setSystemTime(Date.now() + 2000);
    render(<Vista />);
    await vi.waitFor(() => expect(pedir).toHaveBeenCalledTimes(2));
  });

  it('invalidar hace que el próximo montaje pida de nuevo', async () => {
    const pedir = vi.fn().mockResolvedValue({ data: UNA });
    const { cache, Vista } = montarCon(pedir);
    const uno = render(<Vista />);
    await screen.findByText('pera');
    uno.unmount();
    cache.invalidar();
    render(<Vista />);
    await waitFor(() => expect(pedir).toHaveBeenCalledTimes(2));
  });

  it('si falla, lo cuenta y no molesta con un toast en la carga inicial', async () => {
    const pedir = vi.fn().mockRejectedValue(new Error('502'));
    const { Vista } = montarCon(pedir);
    render(<Vista />);
    expect(await screen.findByText('error: 502')).toBeInTheDocument();
    // El toast es para cuando alguien apretó actualizar; acá el estado de
    // error ya se ve en pantalla.
    expect(toastError).not.toHaveBeenCalled();
  });

  it('una respuesta sin datos es un error, no una lista vacía', async () => {
    const pedir = vi.fn().mockResolvedValue({ data: null });
    const { Vista } = montarCon(pedir);
    render(<Vista />);
    expect(await screen.findByText(/No se recibieron datos/)).toBeInTheDocument();
  });
});
