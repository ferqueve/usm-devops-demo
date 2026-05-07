import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SystemHeader } from '@/components/system/SystemHeader';

describe('SystemHeader', () => {
  it('muestra titulo y badge cuando hay error de conexion', () => {
    render(
      <SystemHeader
        hasConnectionError
        autoRefresh={false}
        setAutoRefresh={vi.fn()}
        isRefreshing={false}
        handleRefresh={vi.fn()}
      />
    );
    expect(screen.getByText('Estado del Sistema')).toBeInTheDocument();
    expect(screen.getByText('Sin conexión')).toBeInTheDocument();
  });

  it('handleRefresh se ejecuta al hacer click si no esta refreshing', async () => {
    const handleRefresh = vi.fn();
    render(
      <SystemHeader
        hasConnectionError={false}
        autoRefresh={false}
        setAutoRefresh={vi.fn()}
        isRefreshing={false}
        handleRefresh={handleRefresh}
      />
    );
    await userEvent.click(screen.getByText('Actualizar'));
    expect(handleRefresh).toHaveBeenCalled();
  });

  it('boton actualizar deshabilitado si isRefreshing', () => {
    render(
      <SystemHeader
        hasConnectionError={false}
        autoRefresh={false}
        setAutoRefresh={vi.fn()}
        isRefreshing
        handleRefresh={vi.fn()}
      />
    );
    const btn = screen.getByText('Actualizar').closest('button');
    expect(btn).toBeDisabled();
  });
});
