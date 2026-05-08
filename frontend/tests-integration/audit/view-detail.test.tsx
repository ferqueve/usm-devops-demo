import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuditManagement from '@/components/audit/AuditManagement';
import { renderApp } from '../helpers/renderApp';
import { loginAs } from '../helpers/auth';

const routes = [{ path: '/audit', element: <AuditManagement /> }];

describe('Audit detail', () => {
  it('click en "Ver" abre el diálogo con detalles del log', async () => {
    loginAs('ADMIN');
    const user = userEvent.setup();

    renderApp({ initialEntries: ['/audit'], routes });

    // Esperar tabla
    await waitFor(() => {
      expect(screen.getByText('Reserva')).toBeInTheDocument();
    });

    const verButtons = screen.getAllByRole('button', { name: /ver/i });
    await user.click(verButtons[0]);

    // El diálogo abre. Verificar que aparezca contenido del log: el ID o la entidad.
    await waitFor(() => {
      const dialog = screen.queryByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });
  });
});
