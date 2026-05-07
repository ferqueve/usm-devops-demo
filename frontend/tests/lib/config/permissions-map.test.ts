import { describe, it, expect } from 'vitest';
import {
  COMPONENT_PERMISSIONS_MAP,
  getComponentPermissions,
  componentRequiresPermission,
} from '@/lib/config/permissions-map';

describe('COMPONENT_PERMISSIONS_MAP', () => {
  it('expone páginas conocidas', () => {
    expect(COMPONENT_PERMISSIONS_MAP['/dashboard']).toEqual([]);
    expect(COMPONENT_PERMISSIONS_MAP['/inventory']).toContain('inventario:ver');
  });
});

describe('getComponentPermissions', () => {
  it('devuelve permisos para componente conocido', () => {
    expect(getComponentPermissions('SpacesManagement')).toContain('espacio:crear');
  });

  it('devuelve [] para componente desconocido', () => {
    expect(getComponentPermissions('Inexistente')).toEqual([]);
  });
});

describe('componentRequiresPermission', () => {
  it('true cuando incluye el permiso', () => {
    expect(componentRequiresPermission('InventoryManagement', 'inventario:crear')).toBe(true);
  });

  it('false cuando no incluye el permiso', () => {
    expect(componentRequiresPermission('InventoryManagement', 'auditoria:ver')).toBe(false);
  });

  it('false para componente inexistente', () => {
    expect(componentRequiresPermission('Inexistente', 'inventario:ver')).toBe(false);
  });
});
