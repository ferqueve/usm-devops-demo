import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const eliminarEspacio = vi.fn();
vi.mock('@/lib/api/spaces', () => ({
  espaciosApi: {
    eliminarEspacio: (...args: unknown[]) => eliminarEspacio(...args),
  },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { DeleteSpaceDialog } from '@/components/spaces/DeleteSpaceDialog';

const espacio = { id: 11, nombre: 'Aula 11' } as never;

describe('DeleteSpaceDialog', () => {
  beforeEach(() => vi.clearAllMocks());

  it('no renderiza nada cuando espacio es null', () => {
    const { container } = render(
      <DeleteSpaceDialog espacio={null} open onOpenChange={vi.fn()} onSuccess={vi.fn()} />
    );
    expect(container.textContent).toBe('');
  });

  it('llama a eliminarEspacio y onSuccess al confirmar', async () => {
    eliminarEspacio.mockResolvedValue({});
    const onSuccess = vi.fn();
    render(
      <DeleteSpaceDialog espacio={espacio} open onOpenChange={vi.fn()} onSuccess={onSuccess} />
    );
    expect(screen.getByText(/Aula 11/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(eliminarEspacio).toHaveBeenCalledWith(11);
  });
});
