import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import UserManagement from '@/components/users/UserManagement';
import { renderApp } from '../helpers/renderApp';
import { loginAs } from '../helpers/auth';
import { server } from '../msw/server';

const API = 'http://localhost:8080/api/v1';
const routes = [{ path: '/users', element: <UserManagement /> }];

describe('Toggle user activo', () => {
  it('click en el switch dispara PUT /usuarios/:id/toggle-activo', async () => {
    loginAs('ADMIN');

    const calls: number[] = [];
    server.use(
      http.put(`${API}/usuarios/:userId/toggle-activo`, ({ params }) => {
        calls.push(Number(params.userId));
        return HttpResponse.json({
          success: true,
          data: {
            id: Number(params.userId),
            email: 'estudiante@utec.edu.uy',
            nombre: 'Estu Diante',
            rol: 'ESTUDIANTE',
            rolApp: 'ESTUDIANTE',
            verificado: true,
            activo: false,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        });
      })
    );

    const user = userEvent.setup();
    renderApp({ initialEntries: ['/users'], routes });

    await waitFor(() => {
      expect(
        screen.getAllByText('estudiante@utec.edu.uy').length
      ).toBeGreaterThan(0);
    });

    const switches = screen.getAllByRole('switch');
    // El primer switch corresponde a "admin@utec.edu.uy" (id 11), tomamos el segundo (estudiante)
    await user.click(switches[1]);

    // Aparece el AlertDialog de confirmación
    const confirmar = await screen.findByRole('button', { name: /confirmar/i });
    await user.click(confirmar);

    await waitFor(() => {
      expect(calls).toContain(12);
    });
  });
});
