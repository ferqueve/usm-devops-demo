import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScrollArea } from '@/components/ui/scroll-area';

describe('ScrollArea', () => {
  it('renderiza children dentro del viewport', () => {
    const { container } = render(
      <ScrollArea>
        <div>contenido scrollable</div>
      </ScrollArea>
    );
    expect(screen.getByText('contenido scrollable')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="scroll-area"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="scroll-area-viewport"]')).not.toBeNull();
  });
});
