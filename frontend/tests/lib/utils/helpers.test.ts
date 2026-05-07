import { describe, it, expect, beforeEach, vi } from 'vitest';
import { cn, routeHelpers, storage, validation, errors } from '@/lib/utils/helpers';

describe('cn', () => {
  it('combina clases simples', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('elimina clases falsy', () => {
    expect(cn('a', false, undefined, null, 'b')).toBe('a b');
  });

  it('hace merge de clases tailwind conflictivas', () => {
    // tailwind-merge conserva la última de un mismo grupo
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });
});

describe('routeHelpers', () => {
  it('getRouteName extrae nombre del pathname', () => {
    expect(routeHelpers.getRouteName('/dashboard')).toBe('dashboard');
  });

  it('getRouteName devuelve dashboard si la ruta es /', () => {
    expect(routeHelpers.getRouteName('/')).toBe('dashboard');
  });

  it('capitalize capitaliza la primera letra', () => {
    expect(routeHelpers.capitalize('hola')).toBe('Hola');
    expect(routeHelpers.capitalize('')).toBe('');
  });

  it('isActiveRoute compara rutas', () => {
    expect(routeHelpers.isActiveRoute('/a', '/a')).toBe(true);
    expect(routeHelpers.isActiveRoute('/a', '/b')).toBe(false);
  });
});

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('set/get persisten objetos', () => {
    storage.set('key', { foo: 'bar' });
    expect(storage.get<{ foo: string }>('key')).toEqual({ foo: 'bar' });
  });

  it('get devuelve default si no existe', () => {
    expect(storage.get('missing', 'fallback')).toBe('fallback');
  });

  it('get devuelve null si no existe y no se da default', () => {
    expect(storage.get('missing')).toBeNull();
  });

  it('remove elimina la key', () => {
    storage.set('k', 1);
    storage.remove('k');
    expect(storage.get('k')).toBeNull();
  });

  it('clear vacía localStorage', () => {
    storage.set('a', 1);
    storage.set('b', 2);
    storage.clear();
    expect(storage.get('a')).toBeNull();
    expect(storage.get('b')).toBeNull();
  });

  it('get devuelve default cuando el JSON está corrupto', () => {
    localStorage.setItem('bad', '{not-json');
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(storage.get('bad', 'fb')).toBe('fb');
    errSpy.mockRestore();
  });
});

describe('validation', () => {
  it('isValidEmail acepta emails válidos', () => {
    expect(validation.isValidEmail('a@b.co')).toBe(true);
  });

  it('isValidEmail rechaza emails inválidos', () => {
    expect(validation.isValidEmail('not-an-email')).toBe(false);
    expect(validation.isValidEmail('a@b')).toBe(false);
  });

  it('isValidPassword exige mínimo 8 chars', () => {
    expect(validation.isValidPassword('1234567')).toBe(false);
    expect(validation.isValidPassword('12345678')).toBe(true);
  });

  it('isEmpty detecta strings vacíos o whitespace', () => {
    expect(validation.isEmpty('')).toBe(true);
    expect(validation.isEmpty('   ')).toBe(true);
    expect(validation.isEmpty('hola')).toBe(false);
  });
});

describe('errors', () => {
  it('getMessage devuelve mensaje de Error', () => {
    expect(errors.getMessage(new Error('boom'))).toBe('boom');
  });

  it('getMessage detecta Failed to fetch', () => {
    expect(errors.getMessage(new Error('Failed to fetch')))
      .toContain('Error de conexión');
  });

  it('getMessage detecta timeout', () => {
    expect(errors.getMessage(new Error('request timeout')))
      .toContain('demasiado tiempo');
  });

  it('getMessage acepta strings', () => {
    expect(errors.getMessage('plain string')).toBe('plain string');
  });

  it('getMessage devuelve mensaje genérico para tipos desconocidos', () => {
    expect(errors.getMessage(123)).toContain('inesperado');
  });

  it('log no lanza', () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => errors.log(new Error('x'), 'ctx')).not.toThrow();
    errSpy.mockRestore();
  });
});
