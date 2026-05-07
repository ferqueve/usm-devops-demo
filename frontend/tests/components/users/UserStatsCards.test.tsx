import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

const obtenerEstadisticas = vi.fn();
vi.mock('@/lib/api/users', () => ({
  usuariosApi: {
    obtenerEstadisticas: (...a: unknown[]) => obtenerEstadisticas(...a),
  },
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}));

vi.mock('@/lib/config/constants', () => ({
  ROLE_LABELS: { ADMIN: 'Administrador', USUARIO: 'Usuario' },
}));

import { UserStatsCards } from '@/components/users/UserStatsCards';

describe('UserStatsCards', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renderiza estadísticas tras el fetch', async () => {
    obtenerEstadisticas.mockResolvedValue({
      totalUsuarios: 10,
      totalActivos: 8,
      totalInactivos: 2,
      totalVerificados: 7,
      totalNoVerificados: 3,
      usuariosPorProveedor: { LOCAL: 6, GOOGLE: 4 },
      usuariosPorRol: { ADMIN: 1, USUARIO: 9 },
    });
    render(<UserStatsCards />);
    await waitFor(() => expect(screen.getByText('10')).toBeInTheDocument());
    expect(screen.getByText('8 activos, 2 inactivos')).toBeInTheDocument();
    expect(screen.getByText('Administrador')).toBeInTheDocument();
  });

  it('muestra estado de error cuando el fetch falla', async () => {
    obtenerEstadisticas.mockRejectedValue(new Error('boom'));
    render(<UserStatsCards />);
    await waitFor(() => expect(screen.getByText('Error al cargar estadísticas')).toBeInTheDocument());
  });
});
