import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const hasPermission = vi.fn();
vi.mock('@/hooks/useRolePermissions', () => ({
  useRolePermissions: () => ({ hasPermission }),
}));

vi.mock('@/components/statistics/InventoryStats', () => ({
  default: () => <div data-testid="vista-inventario" />,
}));
vi.mock('@/components/statistics/ReservationStatsAnalista', () => ({
  default: () => <div data-testid="vista-reservas" />,
}));
vi.mock('@/components/layouts/PageHeader', () => ({
  PageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
}));

import Statistics from '@/components/statistics/index';

function montar(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Statistics />
    </MemoryRouter>,
  );
}

function conPermisos(...permisos: string[]) {
  hasPermission.mockImplementation((p: string) => permisos.includes(p));
}

describe('Estadísticas', () => {
  beforeEach(() => {
    hasPermission.mockReset();
  });

  it('sin ningún permiso de estadísticas no muestra ninguna vista', () => {
    conPermisos();
    montar('/statistics');
    expect(screen.getByText('No tienes acceso a las estadísticas.')).toBeInTheDocument();
  });

  // MANTENIMIENTO: los endpoints de reservas le responden 403, asi que abrir esa
  // vista por defecto dejaba la pantalla en "Error al cargar estadisticas".
  it('con solo inventario muestra inventario aunque la URL pida reservas', () => {
    conPermisos('estadisticas:ver_inventario');
    montar('/statistics?tab=reservas');
    expect(screen.getByTestId('vista-inventario')).toBeInTheDocument();
    expect(screen.queryByTestId('vista-reservas')).not.toBeInTheDocument();
  });

  it('con solo reservas muestra reservas aunque la URL pida inventario', () => {
    conPermisos('estadisticas:ver_reservas');
    montar('/statistics?tab=inventario');
    expect(screen.getByTestId('vista-reservas')).toBeInTheDocument();
    expect(screen.queryByTestId('vista-inventario')).not.toBeInTheDocument();
  });

  it('con los dos permisos manda la URL, y por defecto son reservas', () => {
    conPermisos('estadisticas:ver_reservas', 'estadisticas:ver_inventario');

    const { unmount } = montar('/statistics');
    expect(screen.getByTestId('vista-reservas')).toBeInTheDocument();
    unmount();

    montar('/statistics?tab=inventario');
    expect(screen.getByTestId('vista-inventario')).toBeInTheDocument();
  });
});
