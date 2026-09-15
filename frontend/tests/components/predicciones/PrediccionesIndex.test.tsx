import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const permisos = vi.hoisted(() => ({ admin: true, verReservas: true }));
vi.mock('@/hooks/useRolePermissions', () => ({
  useRolePermissions: () => ({
    hasRole: (r: string) => r === 'ADMIN' && permisos.admin,
    hasPermission: (p: string) => p === 'estadisticas:ver_reservas' && permisos.verReservas,
  }),
}));

const api = vi.hoisted(() => ({ reentrenarModeloML: vi.fn() }));
vi.mock('@/lib/api/stats', () => ({ statsApi: api }));
const toast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn(), warning: vi.fn() }));
vi.mock('sonner', () => ({ toast }));

// Cada vista se prueba aparte: acá sólo importa cuál se monta y con qué versión.
vi.mock('@/components/predicciones/reservas/PrediccionesReservas', () => ({
  default: ({ version }: { version: number }) => <div data-testid="vista-reservas">v{version}</div>,
}));
vi.mock('@/components/predicciones/inventario/PrediccionesInventario', () => ({
  default: ({ version }: { version: number }) => <div data-testid="vista-inventario">v{version}</div>,
}));
vi.mock('@/components/predicciones/academico/PrediccionesAcademico', () => ({
  default: ({ version }: { version: number }) => <div data-testid="vista-academico">v{version}</div>,
}));
vi.mock('@/components/layouts/PageHeader', () => ({
  HEADER_ACTION_ICON: '',
  HEADER_PRIMARY: '',
  PageHeader: ({ title, description, actions }: { title: string; description: string; actions?: React.ReactNode }) => (
    <header>
      <h1>{title}</h1>
      <p data-testid="bajada">{description}</p>
      {actions}
    </header>
  ),
}));

import Predicciones from '@/components/predicciones';

function montar(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Predicciones />
    </MemoryRouter>,
  );
}

describe('Predicciones', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    permisos.admin = true;
    permisos.verReservas = true;
    api.reentrenarModeloML.mockResolvedValue({ success: true, data: { status: 'ok', wape: 18.2 } });
  });

  it('por defecto muestra reservas, y la URL elige la vista con su bajada', () => {
    const { unmount } = montar('/predicciones');
    expect(screen.getByTestId('vista-reservas')).toBeInTheDocument();
    expect(screen.getByTestId('bajada')).toHaveTextContent(/Reservas/);
    unmount();

    const segundo = montar('/predicciones?tab=inventario');
    expect(screen.getByTestId('vista-inventario')).toBeInTheDocument();
    expect(screen.getByTestId('bajada')).toHaveTextContent(/equipamiento/);
    segundo.unmount();

    montar('/predicciones?tab=academico');
    expect(screen.getByTestId('vista-academico')).toBeInTheDocument();
    expect(screen.getByTestId('bajada')).toHaveTextContent(/tutoría/);
  });

  it('una vista desconocida cae en reservas', () => {
    montar('/predicciones?tab=cualquiera');
    expect(screen.getByTestId('vista-reservas')).toBeInTheDocument();
  });

  it('sin el permiso de ver reservas no muestra nada', () => {
    permisos.verReservas = false;
    montar('/predicciones');
    expect(screen.getByText('No tenés acceso a las predicciones.')).toBeInTheDocument();
    expect(screen.queryByTestId('vista-reservas')).not.toBeInTheDocument();
  });

  it('reentrenar reentrena el modelo de la vista y la recarga', async () => {
    montar('/predicciones?tab=inventario');
    expect(screen.getByTestId('vista-inventario')).toHaveTextContent('v0');

    await userEvent.click(screen.getByRole('button', { name: 'Reentrenar' }));

    await waitFor(() => expect(api.reentrenarModeloML).toHaveBeenCalledWith('inventario'));
    await waitFor(() => expect(screen.getByTestId('vista-inventario')).toHaveTextContent('v1'));
    expect(toast.success).toHaveBeenCalledWith('Modelo de inventario reentrenado', { description: 'Error en validación: 18.2%' });
  });

  it('el menú ofrece reentrenar todo', async () => {
    api.reentrenarModeloML.mockResolvedValue({
      success: true,
      data: { reservas: { status: 'ok' }, inventario: { status: 'ok' }, academico: { status: 'error', detalle: 'pocas inscripciones' } },
    });
    montar('/predicciones?tab=academico');

    await userEvent.click(screen.getByRole('button', { name: 'Más opciones de reentrenamiento' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: /Reentrenar todo/ }));

    await waitFor(() => expect(api.reentrenarModeloML).toHaveBeenCalledWith('todo'));
    // Uno falló: se avisa cuál, pero los otros dos se recargan.
    await waitFor(() => expect(toast.warning).toHaveBeenCalledWith('Se reentrenó en parte', { description: 'Académico: pocas inscripciones' }));
    expect(screen.getByTestId('vista-academico')).toHaveTextContent('v1');
  });

  it('si el entrenamiento falla lo dice y no recarga', async () => {
    api.reentrenarModeloML.mockResolvedValue({ success: true, data: { status: 'error', detalle: 'Hacen falta 100 inscripciones' } });
    montar('/predicciones?tab=academico');
    await userEvent.click(screen.getByRole('button', { name: 'Reentrenar' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('No se pudo reentrenar', { description: 'Hacen falta 100 inscripciones' }));
    expect(api.reentrenarModeloML).toHaveBeenCalledWith('academico');
    expect(screen.getByTestId('vista-academico')).toHaveTextContent('v0');
  });

  it('quien no es admin no ve el botón de reentrenar', () => {
    permisos.admin = false;
    montar('/predicciones');
    expect(screen.queryByRole('button', { name: 'Reentrenar' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Actualizar' })).toBeInTheDocument();
  });
});
