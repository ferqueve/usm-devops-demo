import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import InventoryManagement from '@/components/inventory/InventoryManagement';
import { renderApp } from '../helpers/renderApp';
import { loginAs } from '../helpers/auth';

const routes = [{ path: '/inventory', element: <InventoryManagement /> }];

describe('Inventory list', () => {
  it('lista items del inventario retornados por la API', async () => {
    loginAs('ADMIN');

    renderApp({ initialEntries: ['/inventory'], routes });

    expect(
      await screen.findByText(/gestión de inventario/i)
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getAllByText(/proyector/i).length).toBeGreaterThan(0);
    });
  });
});
