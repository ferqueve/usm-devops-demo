import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 1, nombre: 'Ana', email: 'a@x.com' } }),
}));

vi.mock('@/hooks/useRolePermissions', () => ({
  useRolePermissions: () => ({
    hasPermission: () => true,
    hasAnyPermission: () => true,
    hasAllPermissions: () => true,
  }),
}));

vi.mock('@/hooks/useEspacios', () => ({
  useEspacios: () => ({ espacios: [], loading: false }),
}));

vi.mock('@/hooks/useCarreras', () => ({
  useCarreras: () => ({ carreras: [], loading: false }),
}));

vi.mock('@/hooks/useTiposElemento', () => ({
  useTiposElemento: () => ({ tiposElemento: [], loading: false }),
}));

vi.mock('@/lib/api/reservations', () => ({
  reservationsApi: {
    crearReserva: vi.fn(),
    obtenerReservasPorEspacio: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

vi.mock('@/lib/api/users', () => ({
  usuariosApi: {
    listarAnalistas: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

vi.mock('@/components/recomendaciones/EspaciosRecomendados', () => ({
  EspaciosRecomendados: () => null,
}));
vi.mock('@/components/recomendaciones/HorariosRecomendados', () => ({
  HorariosRecomendados: () => null,
}));
vi.mock('@/components/recomendaciones/ItemsRecomendados', () => ({
  ItemsRecomendados: () => null,
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));

import ReservationForm from '@/components/reservations/ReservationForm';

describe('ReservationForm', () => {
  it('renderiza header y botón Volver', () => {
    render(<ReservationForm onSuccess={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText(/Nueva/i)).toBeInTheDocument();
    expect(screen.getByText('Volver')).toBeInTheDocument();
  });

  it('renderiza secciones del formulario (Espacio, Título, Fecha)', () => {
    render(<ReservationForm onSuccess={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText(/Espacio \*/i)).toBeInTheDocument();
    expect(screen.getByText(/Título \*/i)).toBeInTheDocument();
    expect(screen.getByText(/Fecha \*/i)).toBeInTheDocument();
  });
});
