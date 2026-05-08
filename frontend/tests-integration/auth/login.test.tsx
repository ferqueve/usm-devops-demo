import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuthPage from '@/app/auth/page';
import { renderApp } from '../helpers/renderApp';

const dashboardStub = <div data-testid="dashboard-stub">Dashboard</div>;

const routes = [
  { path: '/auth', element: <AuthPage /> },
  { path: '/dashboard', element: dashboardStub },
];

describe('Login flow', () => {
  it('login con credenciales válidas redirige al dashboard y persiste el token', async () => {
    const user = userEvent.setup();
    renderApp({ initialEntries: ['/auth'], routes });

    await user.type(
      await screen.findByLabelText(/correo electrónico/i),
      'admin@utec.edu.uy'
    );
    await user.type(screen.getByLabelText(/contraseña/i), 'password123');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    expect(await screen.findByTestId('dashboard-stub')).toBeInTheDocument();
    expect(localStorage.getItem('token')).toMatch(/^mock-jwt-token-/);
    const storedUser = JSON.parse(localStorage.getItem('user') ?? '{}');
    expect(storedUser.email).toBe('admin@utec.edu.uy');
    expect(storedUser.rol).toBe('ADMIN');
  });

  it('login con credenciales inválidas muestra el error del backend y no guarda token', async () => {
    const user = userEvent.setup();
    renderApp({ initialEntries: ['/auth'], routes });

    await user.type(
      await screen.findByLabelText(/correo electrónico/i),
      'admin@utec.edu.uy'
    );
    await user.type(screen.getByLabelText(/contraseña/i), 'wrong-password');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    expect(await screen.findByText(/credenciales inválidas/i)).toBeInTheDocument();
    expect(screen.queryByTestId('dashboard-stub')).not.toBeInTheDocument();
    expect(localStorage.getItem('token')).toBeNull();
  });
});
