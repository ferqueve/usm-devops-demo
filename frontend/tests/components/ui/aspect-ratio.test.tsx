import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AspectRatio } from '@/components/ui/aspect-ratio';

describe('AspectRatio', () => {
  it('renderiza children y aplica data-slot', () => {
    const { container } = render(
      <AspectRatio ratio={16 / 9}>
        <span>media</span>
      </AspectRatio>
    );
    expect(screen.getByText('media')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="aspect-ratio"]')).not.toBeNull();
  });
});
