import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import RoleProtectedRoute from '@/components/auth/RoleProtectedRoute';
import { renderApp } from '../helpers/renderApp';
import { loginAs } from '../helpers/auth';

const usersStub = <div data-testid="users-page">Users</div>;
const dashboardStub = <div data-testid="dashboard-stub">Dashboard</div>;
const calendarStub = <div data-testid="calendar-stub">Calendar</div>;

const routes = [
  {
    path: '/users',
    element: <RoleProtectedRoute>{usersStub}</RoleProtectedRoute>,
  },
  { path: '/dashboard', element: dashboardStub },
  { path: '/calendar', element: calendarStub },
];

describe('RoleProtectedRoute', () => {
  it('ESTUDIANTE intentando entrar a /users es redirigido fuera de la ruta', async () => {
    loginAs('ESTUDIANTE');

    renderApp({ initialEntries: ['/users'], routes });

    // ESTUDIANTE no debería ver la página de usuarios; el guard redirige a la
    // primera ruta permitida (/dashboard).
    await waitFor(() => {
      expect(screen.queryByTestId('dashboard-stub')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('users-page')).not.toBeInTheDocument();
  });

  it('ADMIN puede acceder a /users', async () => {
    loginAs('ADMIN');

    renderApp({ initialEntries: ['/users'], routes });

    expect(await screen.findByTestId('users-page')).toBeInTheDocument();
  });
});
