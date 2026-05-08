import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import PermissionGuard from '@/components/auth/PermissionGuard';
import { renderApp } from '../helpers/renderApp';
import { loginAs } from '../helpers/auth';

const adminPanel = (
  <div>
    <PermissionGuard requiredPermission="reserva:aprobar">
      <button data-testid="aprobar-btn">Aprobar</button>
    </PermissionGuard>
    <PermissionGuard requiredPermission="usuario:gestionar">
      <button data-testid="gestionar-btn">Gestionar usuarios</button>
    </PermissionGuard>
    <span data-testid="ready">ready</span>
  </div>
);

const routes = [{ path: '/', element: adminPanel }];

describe('PermissionGuard', () => {
  it('ESTUDIANTE no ve botones de admin (aprobar / gestionar usuarios)', async () => {
    loginAs('ESTUDIANTE');

    renderApp({ initialEntries: ['/'], routes });

    await waitFor(() => {
      expect(screen.getByTestId('ready')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('aprobar-btn')).not.toBeInTheDocument();
    expect(screen.queryByTestId('gestionar-btn')).not.toBeInTheDocument();
  });

  it('ADMIN ve los botones protegidos por permisos', async () => {
    loginAs('ADMIN');

    renderApp({ initialEntries: ['/'], routes });

    expect(await screen.findByTestId('aprobar-btn')).toBeInTheDocument();
    expect(screen.getByTestId('gestionar-btn')).toBeInTheDocument();
  });
});
