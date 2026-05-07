import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuditFilters from '@/components/audit/AuditFilters';

describe('AuditFilters', () => {
  it('muestra el botón Mostrar cuando filtros están ocultos', () => {
    render(
      <AuditFilters
        filters={{}}
        onFiltersChange={vi.fn()}
        onClearFilters={vi.fn()}
        showFilters={false}
        onToggleFilters={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /Mostrar/ })).toBeInTheDocument();
  });

  it('muestra los inputs cuando showFilters es true', () => {
    render(
      <AuditFilters
        filters={{}}
        onFiltersChange={vi.fn()}
        onClearFilters={vi.fn()}
        showFilters
        onToggleFilters={vi.fn()}
      />
    );
    expect(screen.getByLabelText('Búsqueda')).toBeInTheDocument();
    expect(screen.getByLabelText('ID Usuario')).toBeInTheDocument();
  });

  it('llama onFiltersChange al escribir en búsqueda', async () => {
    const onFiltersChange = vi.fn();
    render(
      <AuditFilters
        filters={{}}
        onFiltersChange={onFiltersChange}
        onClearFilters={vi.fn()}
        showFilters
        onToggleFilters={vi.fn()}
      />
    );
    await userEvent.type(screen.getByLabelText('Búsqueda'), 'a');
    expect(onFiltersChange).toHaveBeenCalledWith(expect.objectContaining({ search: 'a' }));
  });

  it('muestra botón Limpiar cuando hay filtros activos', () => {
    render(
      <AuditFilters
        filters={{ search: 'foo' }}
        onFiltersChange={vi.fn()}
        onClearFilters={vi.fn()}
        showFilters
        onToggleFilters={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /Limpiar/ })).toBeInTheDocument();
  });
});
