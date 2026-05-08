import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import SpacesManagement from '@/components/spaces/SpacesManagement';
import { renderApp } from '../helpers/renderApp';
import { loginAs } from '../helpers/auth';

const routes = [{ path: '/rooms', element: <SpacesManagement /> }];

describe('Spaces list', () => {
  it('lista espacios con sus nombres', async () => {
    loginAs('ADMIN');
    renderApp({ initialEntries: ['/rooms'], routes });

    expect(await screen.findByText('Gestión de Espacios')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryAllByText(/sala 101/i).length).toBeGreaterThan(0);
    });
    await waitFor(() => {
      expect(screen.queryAllByText(/auditorio a/i).length).toBeGreaterThan(0);
    });
  });
});
