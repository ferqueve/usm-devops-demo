import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cargarConRecarga, MARCA_RECARGA } from '@/lib/utils/lazyConRecarga';

const Componente = () => null;

describe('cargarConRecarga', () => {
  let reload: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    sessionStorage.clear();
    reload = vi.fn();
    vi.spyOn(globalThis, 'location', 'get').mockReturnValue({ reload } as unknown as Location);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('devuelve el módulo y limpia la marca cuando la carga anda', async () => {
    sessionStorage.setItem(MARCA_RECARGA, '1');

    const modulo = await cargarConRecarga(async () => ({ default: Componente }));

    expect(modulo.default).toBe(Componente);
    expect(sessionStorage.getItem(MARCA_RECARGA)).toBeNull();
    expect(reload).not.toHaveBeenCalled();
  });

  // Es el caso de un deploy: la pestaña vieja pide un chunk que ya no existe.
  it('recarga una vez si el chunk no existe', async () => {
    const promesa = cargarConRecarga(async () => {
      throw new Error('Failed to fetch dynamically imported module');
    });
    // Queda pendiente a propósito: la recarga corta la ejecución.
    const resuelta = await Promise.race([promesa, Promise.resolve('pendiente')]);

    expect(resuelta).toBe('pendiente');
    expect(reload).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem(MARCA_RECARGA)).toBe('1');
  });

  it('a la segunda propaga el error en vez de recargar de nuevo', async () => {
    sessionStorage.setItem(MARCA_RECARGA, '1');

    await expect(
      cargarConRecarga(async () => {
        throw new Error('sin red');
      }),
    ).rejects.toThrow('sin red');
    expect(reload).not.toHaveBeenCalled();
  });
});
