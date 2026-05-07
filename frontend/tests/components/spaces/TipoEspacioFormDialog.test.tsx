import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/lib/api/spaces', () => ({
  espaciosApi: {
    crearTipoEspacio: vi.fn().mockResolvedValue({ data: { id: 1, nombre: 'X' } }),
    actualizarTipoEspacio: vi.fn().mockResolvedValue({ data: { id: 1, nombre: 'X' } }),
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

import { TipoEspacioFormDialog } from '@/components/spaces/TipoEspacioFormDialog';

describe('TipoEspacioFormDialog', () => {
  it('renderiza el título de creación e incluye campo color', () => {
    render(
      <TipoEspacioFormDialog
        tipoEspacio={null}
        open
        onOpenChange={vi.fn()}
        onSuccess={vi.fn()}
      />
    );
    expect(screen.getByText('Crear Nuevo Tipo de Espacio')).toBeInTheDocument();
    expect(screen.getByLabelText('Color (Opcional)')).toBeInTheDocument();
  });

  it('precarga datos en edición', () => {
    render(
      <TipoEspacioFormDialog
        tipoEspacio={{ id: 7, nombre: 'Aula', descripcion: 'd', color: '#abcdef' } as never}
        open
        onOpenChange={vi.fn()}
        onSuccess={vi.fn()}
      />
    );
    expect(screen.getByText('Editar Tipo de Espacio')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Aula')).toBeInTheDocument();
  });
});
