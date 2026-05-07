import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

vi.mock('@/lib/api/spaces', () => ({
  espaciosApi: {
    obtenerEspacios: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

vi.mock('@/lib/api/inventory', () => ({
  inventarioApi: {
    listarTiposElemento: vi.fn().mockResolvedValue({ data: [] }),
    obtenerEstadisticasDetalladasInventario: vi.fn().mockResolvedValue({ data: null }),
  },
}));

vi.mock('@/components/auth/PermissionGuard', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/statistics/InventoryCharts', () => ({
  default: () => <div data-testid="inv-charts" />,
}));

vi.mock('@/lib/utils/pdf-export', () => ({
  exportInventoryStatsToPDF: vi.fn(),
}));

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

vi.mock('recharts', () => {
  const S = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  return new Proxy({}, { get: () => S });
});

import InventoryStats from '@/components/statistics/InventoryStats';

describe('InventoryStats', () => {
  it('muestra mensaje sin datos disponibles', async () => {
    render(<InventoryStats />);
    await waitFor(() => {
      expect(screen.getByText(/No hay datos disponibles/i)).toBeInTheDocument();
    });
  });
});
