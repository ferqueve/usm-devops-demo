import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuditFilters from '@/components/audit/AuditFilters';

describe('AuditFilters', () => {
  it('muestra siempre los campos de búsqueda y de ID de usuario', () => {
    render(
      <AuditFilters filters={{}} onFiltersChange={vi.fn()} onClearFilters={vi.fn()} />
    );
    expect(screen.getByPlaceholderText(/Buscar por entidad/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('ID Usuario')).toBeInTheDocument();
  });

  it('llama onFiltersChange al escribir en búsqueda', async () => {
    const onFiltersChange = vi.fn();
    render(
      <AuditFilters filters={{}} onFiltersChange={onFiltersChange} onClearFilters={vi.fn()} />
    );
    await userEvent.type(screen.getByPlaceholderText(/Buscar por entidad/), 'a');
    expect(onFiltersChange).toHaveBeenCalledWith(expect.objectContaining({ search: 'a' }));
  });

  it('llama onFiltersChange con el ID de usuario como número', async () => {
    const onFiltersChange = vi.fn();
    render(
      <AuditFilters filters={{}} onFiltersChange={onFiltersChange} onClearFilters={vi.fn()} />
    );
    await userEvent.type(screen.getByPlaceholderText('ID Usuario'), '7');
    expect(onFiltersChange).toHaveBeenCalledWith(expect.objectContaining({ usuarioId: 7 }));
  });

  it('oculta el botón Limpiar si no hay filtros activos', () => {
    render(
      <AuditFilters filters={{}} onFiltersChange={vi.fn()} onClearFilters={vi.fn()} />
    );
    expect(screen.queryByRole('button', { name: 'Limpiar filtros' })).not.toBeInTheDocument();
  });

  it('muestra el botón Limpiar cuando hay filtros activos y lo dispara', async () => {
    const onClearFilters = vi.fn();
    render(
      <AuditFilters
        filters={{ search: 'foo' }}
        onFiltersChange={vi.fn()}
        onClearFilters={onClearFilters}
      />
    );
    const boton = screen.getByRole('button', { name: 'Limpiar filtros' });
    await userEvent.click(boton);
    expect(onClearFilters).toHaveBeenCalled();
  });
});
