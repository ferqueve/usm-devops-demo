import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DashboardStats from '@/components/dashboard/DashboardStats';

vi.mock('@/hooks/useRolePermissions', () => ({
  useRolePermissions: () => ({ hasPermission: () => true }),
}));

const baseStats = {
  totalReservas: 10,
  reservasHoy: 2,
  reservasPendientes: 1,
  reservasAprobadas: 7,
  reservasCanceladas: 2,
  totalEspacios: 5,
  espaciosDisponibles: 3,
  espaciosOcupados: 1,
  espaciosEnMantenimiento: 1,
  capacidadPromedio: 25,
  totalUsuarios: 10,
  usuariosActivos: 8,
  usuariosNuevosHoy: 2,
  promedioReservasPorEspacio: 3.4,
};

describe('DashboardStats', () => {
  it('renderiza skeletons cuando loading=true', () => {
    const { container } = render(<DashboardStats stats={baseStats} loading />);
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('renderiza las cards con valores cuando hay stats', () => {
    render(<DashboardStats stats={baseStats} />);
    expect(screen.getByText('Reservas Activas')).toBeInTheDocument();
    expect(screen.getByText('Espacios Disponibles')).toBeInTheDocument();
    expect(screen.getByText('Usuarios Activos')).toBeInTheDocument();
  });
});
