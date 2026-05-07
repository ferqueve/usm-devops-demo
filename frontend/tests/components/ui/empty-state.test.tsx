import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Inbox } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

describe('EmptyState', () => {
  it('renderiza title', () => {
    render(<EmptyState title="Sin datos" />);
    expect(screen.getByText('Sin datos')).toBeInTheDocument();
  });

  it('renderiza description cuando se da', () => {
    render(<EmptyState title="X" description="desc" />);
    expect(screen.getByText('desc')).toBeInTheDocument();
  });

  it('renderiza el botón con la action y dispara onClick', async () => {
    const onClick = vi.fn();
    render(<EmptyState title="X" action={{ label: 'Crear', onClick }} />);
    const btn = screen.getByRole('button', { name: 'Crear' });
    await userEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renderiza el icono cuando se da', () => {
    const { container } = render(<EmptyState title="X" icon={Inbox} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
