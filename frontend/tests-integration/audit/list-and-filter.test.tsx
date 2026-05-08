import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import AuditManagement from '@/components/audit/AuditManagement';
import { renderApp } from '../helpers/renderApp';
import { loginAs } from '../helpers/auth';

const routes = [{ path: '/audit', element: <AuditManagement /> }];

describe('Audit list', () => {
  it('lista logs de auditoría retornados por la API', async () => {
    loginAs('ADMIN');
    renderApp({ initialEntries: ['/audit'], routes });

    expect(await screen.findByText('Auditoría del Sistema')).toBeInTheDocument();
    // Cuerpo de la tabla muestra entidades del default handler
    await waitFor(() => {
      expect(screen.getByText('Reserva')).toBeInTheDocument();
    });
    expect(screen.getByText('Espacio')).toBeInTheDocument();
  });
});
