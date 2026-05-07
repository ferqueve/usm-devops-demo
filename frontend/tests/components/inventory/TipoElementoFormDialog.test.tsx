import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/lib/api/inventory', () => ({
  inventarioApi: {
    crearTipoElemento: vi.fn().mockResolvedValue({ data: { id: 1, nombre: 'X' } }),
    actualizarTipoElemento: vi.fn().mockResolvedValue({ data: { id: 1, nombre: 'X' } }),
  },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/hooks/useRolePermissions', () => ({
  useRolePermissions: () => ({
    hasPermission: () => true,
    hasAnyPermission: () => true,
    hasAllPermissions: () => true,
  }),
}));

import { TipoElementoFormDialog } from '@/components/inventory/TipoElementoFormDialog';

describe('TipoElementoFormDialog', () => {
  it('renderiza el título de creación', () => {
    render(
      <TipoElementoFormDialog
        tipoElemento={null}
        open
        onOpenChange={vi.fn()}
        onSuccess={vi.fn()}
      />
    );
    expect(screen.getByText('Crear Nuevo Tipo de Elemento')).toBeInTheDocument();
  });

  it('precarga valores en modo edición', () => {
    render(
      <TipoElementoFormDialog
        tipoElemento={{ id: 7, nombre: 'Proyector', descripcion: 'desc' } as never}
        open
        onOpenChange={vi.fn()}
        onSuccess={vi.fn()}
      />
    );
    expect(screen.getByText('Editar Tipo de Elemento')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Proyector')).toBeInTheDocument();
  });
});
