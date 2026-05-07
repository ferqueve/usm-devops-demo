import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Skeleton } from '@/components/ui/skeleton';

describe('Skeleton', () => {
  it('renderiza con clases por defecto', () => {
    const { container } = render(<Skeleton />);
    const el = container.querySelector('[data-slot="skeleton"]');
    expect(el).not.toBeNull();
    expect(el?.className).toContain('animate-pulse');
  });

  it('combina className personalizada', () => {
    const { container } = render(<Skeleton className="h-10 w-10" />);
    const el = container.querySelector('[data-slot="skeleton"]');
    expect(el?.className).toContain('h-10');
    expect(el?.className).toContain('w-10');
  });
});
