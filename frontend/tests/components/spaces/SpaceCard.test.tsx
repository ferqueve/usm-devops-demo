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
  imagenUrl: 'https://example.test/aula.jpg',
  edificioNombre: 'Edificio A',
} as never;

describe('SpaceCard', () => {
  it('renderiza nombre, capacidad, edificio y tipo', () => {
    render(<SpaceCard espacio={espacio} onEdit={vi.fn()} />);
    expect(screen.getByText('Aula 7')).toBeInTheDocument();
    // Con imagen, el nombre del tipo aparece sólo en el chip (no en el banner).
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('Edificio A')).toBeInTheDocument();
    expect(screen.getByText('Aula')).toBeInTheDocument();
  });

  it('marca el espacio como Libre cuando no está en curso', () => {
    render(<SpaceCard espacio={espacio} onEdit={vi.fn()} />);
    expect(screen.getByText('Libre')).toBeInTheDocument();
  });

  it('marca el espacio como Ocupado cuando hay una reserva en curso', () => {
    render(<SpaceCard espacio={espacio} onEdit={vi.fn()} enCurso />);
    expect(screen.getByText('Ocupado')).toBeInTheDocument();
  });

  it('muestra el estado en lugar de la disponibilidad si está fuera de servicio', () => {
    const enMantenimiento = { ...(espacio as object), estado: 'MANTENIMIENTO' } as never;
    render(<SpaceCard espacio={enMantenimiento} onEdit={vi.fn()} />);
    expect(screen.getAllByText('En mantenimiento').length).toBeGreaterThan(0);
    expect(screen.queryByText('Libre')).not.toBeInTheDocument();
  });

  it('navega al detalle al hacer click en Ver', async () => {
    render(<SpaceCard espacio={espacio} onEdit={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /Ver/ }));
    expect(navigateMock).toHaveBeenCalledWith('/rooms/7');
  });

  it('llama a onEdit al hacer click en Editar', async () => {
    const onEdit = vi.fn();
    render(<SpaceCard espacio={espacio} onEdit={onEdit} />);
    await userEvent.click(screen.getByRole('button', { name: /Editar/ }));
    expect(onEdit).toHaveBeenCalledWith(espacio);
  });
});
