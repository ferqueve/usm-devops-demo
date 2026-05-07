import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import PendingInventoryRequestsAlert from '@/components/dashboard/widgets/PendingInventoryRequestsAlert';

vi.mock('react-router-dom', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

describe('PendingInventoryRequestsAlert', () => {
  it('no renderiza nada si count=0', () => {
    const { container } = render(<PendingInventoryRequestsAlert count={0} />);
    expect(container.firstChild).toBeNull();
  });

  it('usa singular cuando count=1', () => {
    render(<PendingInventoryRequestsAlert count={1} />);
    expect(screen.getByText(/Tienes 1 solicitud de inventario pendiente/)).toBeInTheDocument();
  });

  it('usa plural cuando count>1', () => {
    render(<PendingInventoryRequestsAlert count={3} />);
    expect(screen.getByText(/Tienes 3 solicitudes de inventario pendientes/)).toBeInTheDocument();
  });
});
