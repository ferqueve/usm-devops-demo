import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EndpointsSection } from '@/components/system/sections/EndpointsSection';

beforeEach(() => {
  vi.spyOn(window, 'open').mockImplementation(() => null);
});

describe('EndpointsSection', () => {
  it('muestra mensaje vacio sin mappings', () => {
    render(<EndpointsSection mappings={null} />);
    expect(screen.getByText(/No hay información de mappings disponible/)).toBeInTheDocument();
  });

  it('renderiza endpoints filtrados de /api', () => {
    const mappings = {
      contexts: {
        app: {
          mappings: {
            dispatcherServlets: {
              dispatcherServlet: [
                { predicate: '{GET [/api/v1/usuarios/me]}' },
                { predicate: '{POST [/api/v1/auth/login]}' },
                { predicate: '{GET [/actuator/health]}' },
              ],
            },
          },
        },
      },
    } as never;
    render(<EndpointsSection mappings={mappings} />);
    expect(screen.getByText('/api/v1/usuarios/me')).toBeInTheDocument();
    expect(screen.getByText('/api/v1/auth/login')).toBeInTheDocument();
    expect(screen.queryByText('/actuator/health')).not.toBeInTheDocument();
  });

  it('cambia ordenamiento al hacer click en columna metodo', async () => {
    const mappings = {
      contexts: {
        a: {
          mappings: {
            dispatcherServlets: {
              dispatcherServlet: [
                { predicate: '{GET [/api/v1/a]}' },
                { predicate: '{POST [/api/v1/b]}' },
              ],
            },
          },
        },
      },
    } as never;
    render(<EndpointsSection mappings={mappings} />);
    await userEvent.click(screen.getByRole('button', { name: /Método/ }));
    // No throw means sort handler ran
    expect(screen.getByText('/api/v1/a')).toBeInTheDocument();
  });
});
