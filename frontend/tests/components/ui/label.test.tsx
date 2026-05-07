import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Label } from '@/components/ui/label';

describe('Label', () => {
  it('renderiza children', () => {
    render(<Label>Email</Label>);
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('asocia htmlFor', () => {
    render(<Label htmlFor="campo">L</Label>);
    expect(screen.getByText('L')).toHaveAttribute('for', 'campo');
  });

  it('aplica data-slot=label', () => {
    const { container } = render(<Label>x</Label>);
    expect(container.querySelector('[data-slot="label"]')).not.toBeNull();
  });
});
