import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '@/components/ui/badge';

describe('Badge', () => {
  it('renderiza children', () => {
    render(<Badge>Hola</Badge>);
    expect(screen.getByText('Hola')).toBeInTheDocument();
  });

  it('aplica data-slot=badge', () => {
    const { container } = render(<Badge>X</Badge>);
    expect(container.querySelector('[data-slot="badge"]')).not.toBeNull();
  });

  it('asChild renderiza el slot', () => {
    render(
      <Badge asChild>
        <a href="/x">link</a>
      </Badge>
    );
    expect(screen.getByRole('link')).toBeInTheDocument();
  });

  it('combina className', () => {
    const { container } = render(<Badge className="extra">X</Badge>);
    expect(container.firstChild).toHaveClass('extra');
  });
});
