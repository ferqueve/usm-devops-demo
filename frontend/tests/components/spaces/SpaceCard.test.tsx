import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const navigateMock = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}));

vi.mock('@/hooks/useRolePermissions', () => ({
  useRolePermissions: () => ({
    hasPermission: () => true,
    hasAnyPermission: () => true,
    hasAllPermissions: () => true,
  }),
}));

import { SpaceCard } from '@/components/spaces/SpaceCard';

const espacio = {
  id: 7,
  nombre: 'Aula 7',
  capacidad: 30,
  estado: 'DISPONIBLE',
  tipoEspacioNombre: 'Aula',
  tipoEspacioColor: '#ff0000',
  imagenUrl: '',
  edificioNombre: 'Edificio A',
} as never;

describe('SpaceCard', () => {
  it('renderiza nombre, capacidad y badge del tipo', () => {
    render(<SpaceCard espacio={espacio} canEdit={false} onEdit={vi.fn()} />);
    expect(screen.getByText('Aula 7')).toBeInTheDocument();
    expect(screen.getByText('30 personas')).toBeInTheDocument();
    expect(screen.getByText('Aula')).toBeInTheDocument();
    expect(screen.getByText('Disponible')).toBeInTheDocument();
  });

  it('navega al click sobre Ver Detalles', async () => {
    render(<SpaceCard espacio={espacio} canEdit={false} onEdit={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /Ver Detalles/ }));
    expect(navigateMock).toHaveBeenCalledWith('/rooms/7');
  });

  it('llama a onEdit al hacer click en Editar', async () => {
    const onEdit = vi.fn();
    render(<SpaceCard espacio={espacio} canEdit={true} onEdit={onEdit} />);
    await userEvent.click(screen.getByRole('button', { name: /Editar/ }));
    expect(onEdit).toHaveBeenCalledWith(espacio);
  });
});
