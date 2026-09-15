import { describe, it, expect } from 'vitest';
import { consultaReservas } from '@/lib/api/stats';
import { espacioFuera, filtroDeNovedad, filtrosDeUrl } from '@/components/statistics/reservas/filtros';
import { opciones } from './datosReservas';

describe('filtros de reservas', () => {
  it('lee la URL con prefijo y descarta valores inválidos', () => {
    expect(filtrosDeUrl(new URLSearchParams('redificio=4&respacio=abc&rtipo=-1&rrol=DOCENTE&rcarrera=7&edificio=9'))).toEqual({
      edificioId: 4,
      espacioId: null,
      tipoEspacioId: null,
      rol: 'DOCENTE',
      carreraId: 7,
    });
  });

  it('arma la consulta sin mandar los vacíos', () => {
    expect(consultaReservas({ desde: '2026-01-01', hasta: '2026-01-31', edificioId: null, rol: 'EXTERNO', carreraId: 3 }, { comparar: 'anio', limite: undefined })).toBe(
      '?desde=2026-01-01&hasta=2026-01-31&rol=EXTERNO&carreraId=3&comparar=anio',
    );
  });

  it('descarta el espacio que queda fuera del edificio o tipo elegido', () => {
    const conEdificio = { ...opciones, edificios: [...opciones.edificios, { id: 5, nombre: 'B' }] };
    expect(espacioFuera(conEdificio, { espacioId: 1 }, { edificioId: 5 })).toBe(true);
    expect(espacioFuera(conEdificio, { espacioId: 1 }, { edificioId: 1 })).toBe(false);
    expect(espacioFuera(conEdificio, { espacioId: 1 }, { tipoEspacioId: 9 })).toBe(true);
  });

  it('una novedad filtra sólo por lo que se puede filtrar', () => {
    const base = { titulo: 'x', metrica: 'm', antes: 1, ahora: 2, cambio: 1, unidad: '%', sentido: 'sube', bueno: null };
    expect(filtroDeNovedad({ ...base, tipo: 'espacio', clave: '3' })).toEqual({ espacioId: 3 });
    expect(filtroDeNovedad({ ...base, tipo: 'rol', clave: 'DOCENTE' })).toEqual({ rol: 'DOCENTE' });
    expect(filtroDeNovedad({ ...base, tipo: 'hora', clave: '1-10' })).toBeNull();
    expect(filtroDeNovedad({ ...base, tipo: 'aprobacion', clave: null })).toBeNull();
  });
});
