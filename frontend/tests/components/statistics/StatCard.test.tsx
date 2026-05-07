import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Activity } from 'lucide-react';
import { StatCard } from '@/components/statistics/StatCard';

describe('StatCard', () => {
  it('renderiza title y value', () => {
    render(<StatCard title="Total" value={42} icon={Activity} />);
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renderiza subtitle si se pasa', () => {
    render(<StatCard title="T" value={1} subtitle="sub" icon={Activity} />);
    expect(screen.getByText('sub')).toBeInTheDocument();
  });

  it('aplica accentClass al value cuando iconOnly=false', () => {
    const { container } = render(
      <StatCard title="T" value={1} icon={Activity} accentClass="text-red-500" />
    );
    const valueDiv = container.querySelector('.text-2xl');
    expect(valueDiv?.className).toContain('text-red-500');
  });

  it('iconOnly=true -> value sin accentClass', () => {
    const { container } = render(
      <StatCard title="T" value={1} icon={Activity} accentClass="text-red-500" iconOnly />
    );
    const valueDiv = container.querySelector('.text-2xl');
    expect(valueDiv?.className).not.toContain('text-red-500');
  });

  it('value puede ser string', () => {
    render(<StatCard title="T" value="N/A" icon={Activity} />);
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });
});
