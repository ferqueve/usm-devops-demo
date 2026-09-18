import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StatsListWidget, { type StatsListItem } from '@/components/dashboard/widgets/_shared/StatsListWidget';

function TitleIcon({ className }: Readonly<{ className?: string }>) {
  return <svg data-testid="title-icon" className={className} />;
}

function ItemIcon({ className }: Readonly<{ className?: string }>) {
  return <svg data-testid="item-icon" className={className} />;
}

const items: StatsListItem[] = [
  { label: 'Reservas', value: 5, icon: ItemIcon, color: 'text-blue-500' },
  { label: 'Espacios', value: '12', icon: ItemIcon, color: 'text-green-500' },
];

describe('StatsListWidget', () => {
  it('renderiza skeletons cuando loading=true', () => {
    const { container } = render(
      <StatsListWidget
        title="Resumen"
        TitleIcon={TitleIcon}
        items={null}
        loading
        skeletonRows={3}
      />
    );
    expect(screen.getByText('Resumen')).toBeInTheDocument();
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  // Antes no dibujaba nada: si la llamada fallaba, el widget desaparecía del
  // dashboard sin dejar rastro. Ahora el bloque sigue ahí y dice qué pasó.
  it('sin items y sin cargar, sigue mostrando el bloque y lo dice', () => {
    render(
      <StatsListWidget
        title="Inventario"
        TitleIcon={TitleIcon}
        items={null}
        loading={false}
      />
    );
    expect(screen.getByText('Inventario')).toBeInTheDocument();
    expect(screen.getByText('No se pudo traer el detalle.')).toBeInTheDocument();
  });

  it('con error, lo cuenta y deja reintentar', async () => {
    const reintentar = vi.fn();
    render(
      <StatsListWidget
        title="Inventario"
        TitleIcon={TitleIcon}
        items={null}
        loading={false}
        error="502 Bad Gateway"
        alReintentar={reintentar}
      />
    );
    expect(screen.getByText('No se pudo cargar.')).toBeInTheDocument();
    expect(screen.getByText('502 Bad Gateway')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(reintentar).toHaveBeenCalledOnce();
  });

  it('renderiza títulos, labels y valores cuando hay items', () => {
    render(
      <StatsListWidget
        title="Resumen"
        TitleIcon={TitleIcon}
        items={items}
        loading={false}
      />
    );
    expect(screen.getByText('Resumen')).toBeInTheDocument();
    expect(screen.getByText('Reservas')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Espacios')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });
});
