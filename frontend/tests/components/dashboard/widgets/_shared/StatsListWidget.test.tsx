import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
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

  it('no renderiza nada si items=null y loading=false', () => {
    const { container } = render(
      <StatsListWidget
        title="x"
        TitleIcon={TitleIcon}
        items={null}
        loading={false}
      />
    );
    expect(container).toBeEmptyDOMElement();
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
