import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Box } from 'lucide-react';

vi.mock('@/hooks/useRolePermissions', () => ({
  useRolePermissions: () => ({
    hasPermission: () => true,
    hasAnyPermission: () => true,
    hasAllPermissions: () => true,
  }),
}));

import { TipoCrudShell } from '@/components/common/TipoCrudShell';

describe('TipoCrudShell', () => {
  it('muestra loading label', () => {
    render(
      <TipoCrudShell
        open
        onOpenChange={vi.fn()}
        title="Tipos"
        description="Listado"
        loading
        items={[]}
        loadingLabel="Cargando..."
        emptyLabel="Sin tipos"
        EmptyIcon={Box}
        renderRowLeading={() => null}
        onCreate={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('muestra empty state', () => {
    render(
      <TipoCrudShell
        open
        onOpenChange={vi.fn()}
        title="Tipos"
        description="Listado"
        loading={false}
        items={[]}
        loadingLabel="Cargando..."
        emptyLabel="Sin tipos"
        EmptyIcon={Box}
        renderRowLeading={() => null}
        onCreate={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByText('Sin tipos')).toBeInTheDocument();
  });

  it('renderiza items y dispara callbacks', async () => {
    const onCreate = vi.fn();
    const onEdit = vi.fn();
    const items = [{ id: 1, nombre: 'Aula', descripcion: 'Aula común' }];
    render(
      <TipoCrudShell
        open
        onOpenChange={vi.fn()}
        title="Tipos"
        description="Listado"
        loading={false}
        items={items}
        loadingLabel="Cargando..."
        emptyLabel="Sin tipos"
        EmptyIcon={Box}
        renderRowLeading={() => <span>icon</span>}
        onCreate={onCreate}
        onEdit={onEdit}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByText('Aula')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Crear Tipo/ }));
    expect(onCreate).toHaveBeenCalled();
  });
});
