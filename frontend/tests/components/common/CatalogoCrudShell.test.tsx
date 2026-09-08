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

import { CatalogoCrudShell } from '@/components/common/CatalogoCrudShell';

const base = {
  title: 'Tipos',
  description: 'Listado',
  Icon: Box,
  emptyLabel: 'Sin tipos',
  createLabel: 'Crear tipo',
  onCreate: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
};

describe('CatalogoCrudShell', () => {
  it('muestra el esqueleto mientras carga', () => {
    const { container } = render(<CatalogoCrudShell {...base} loading items={[]} />);
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('muestra empty state', () => {
    render(<CatalogoCrudShell {...base} loading={false} items={[]} />);
    expect(screen.getByText('Sin tipos')).toBeInTheDocument();
  });

  it('renderiza items y dispara callbacks', async () => {
    const onCreate = vi.fn();
    const onEdit = vi.fn();
    const items = [{ id: 1, nombre: 'Aula', descripcion: 'Aula común' }];
    render(
      <CatalogoCrudShell
        {...base}
        loading={false}
        items={items}
        onCreate={onCreate}
        onEdit={onEdit}
      />
    );
    expect(screen.getByText('Aula')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Crear tipo/ }));
    expect(onCreate).toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: /Editar Aula/ }));
    expect(onEdit).toHaveBeenCalledWith(items[0]);
  });

  it('filtra por el buscador y pagina', async () => {
    const items = Array.from({ length: 8 }, (_, i) => ({ id: i + 1, nombre: `Tipo ${i + 1}` }));
    render(<CatalogoCrudShell {...base} loading={false} items={items} />);

    // La primera página muestra 6 de los 8
    expect(screen.getByText('1–6 de 8')).toBeInTheDocument();
    expect(screen.queryByText('Tipo 7')).not.toBeInTheDocument();

    await userEvent.type(screen.getByPlaceholderText(/Buscar en tipos/i), 'Tipo 7');
    expect(screen.getByText('Tipo 7')).toBeInTheDocument();
    expect(screen.queryByText('Tipo 1')).not.toBeInTheDocument();
  });
});
