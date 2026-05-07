import { describe, it, expect } from 'vitest';
import { APP_CONFIG } from '@/lib/config/app';

describe('APP_CONFIG', () => {
  it('tiene NAME y VERSION', () => {
    expect(APP_CONFIG.NAME).toBe('UTEC Space Manager');
    expect(APP_CONFIG.VERSION).toBe('1.0.0');
  });

  it('expone STORAGE_KEYS', () => {
    expect(APP_CONFIG.STORAGE_KEYS.AUTH).toBe('utec-space-manager-auth');
  });

  it('expone ROUTES', () => {
    expect(APP_CONFIG.ROUTES.LOGIN).toBe('/login');
    expect(APP_CONFIG.ROUTES.DASHBOARD).toBe('/dashboard');
  });

  it('API config con timeout', () => {
    expect(APP_CONFIG.API.TIMEOUT).toBe(10000);
    expect(typeof APP_CONFIG.API.BASE_URL).toBe('string');
  });
});
