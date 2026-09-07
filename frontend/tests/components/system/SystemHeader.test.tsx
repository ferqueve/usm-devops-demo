import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SystemHeader } from '@/components/system/SystemHeader';

const props = {
  hasConnectionError: false,
  autoRefresh: false,
  setAutoRefresh: vi.fn(),
  isRefreshing: false,
  handleRefresh: vi.fn(),
};

describe('SystemHeader', () => {
  it('muestra la descripción y, si hay error, el badge de sin conexión', () => {
    render(<SystemHeader {...props} hasConnectionError />);
    expect(screen.getByText('Monitoreo en tiempo real del servidor.')).toBeInTheDocument();
    expect(screen.getByText('Sin conexión')).toBeInTheDocument();
  });

  it('no muestra el badge cuando la conexión está bien', () => {
    render(<SystemHeader {...props} />);
    expect(screen.queryByText('Sin conexión')).not.toBeInTheDocument();
  });

  it('ejecuta handleRefresh al hacer click en Actualizar', async () => {
    const handleRefresh = vi.fn();
    render(<SystemHeader {...props} handleRefresh={handleRefresh} />);
    await userEvent.click(screen.getByRole('button', { name: 'Actualizar' }));
    expect(handleRefresh).toHaveBeenCalled();
  });

  it('deshabilita Actualizar mientras está refrescando', () => {
    render(<SystemHeader {...props} isRefreshing />);
    expect(screen.getByRole('button', { name: 'Actualizar' })).toBeDisabled();
  });

  it('propaga el cambio del switch de auto-refresh', async () => {
    const setAutoRefresh = vi.fn();
    render(<SystemHeader {...props} setAutoRefresh={setAutoRefresh} />);
    await userEvent.click(screen.getByLabelText('Auto-refresh'));
    expect(setAutoRefresh).toHaveBeenCalledWith(true);
  });
});
