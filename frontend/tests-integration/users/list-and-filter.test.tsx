import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import UserManagement from '@/components/users/UserManagement';
import { renderApp } from '../helpers/renderApp';
import { loginAs } from '../helpers/auth';

const routes = [{ path: '/users', element: <UserManagement /> }];

describe('Users list', () => {
  it('lista usuarios con sus emails', async () => {
    loginAs('ADMIN');
    renderApp({ initialEntries: ['/users'], routes });

    await waitFor(() => {
      expect(screen.getAllByText('admin@utec.edu.uy').length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText('estudiante@utec.edu.uy').length).toBeGreaterThan(0);
  });
});
