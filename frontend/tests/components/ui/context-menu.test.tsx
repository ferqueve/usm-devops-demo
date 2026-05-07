import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ContextMenu, ContextMenuTrigger } from '@/components/ui/context-menu';

describe('ContextMenu', () => {
  it('renderiza el trigger con data-slot', () => {
    const { container } = render(
      <ContextMenu>
        <ContextMenuTrigger>area</ContextMenuTrigger>
      </ContextMenu>
    );
    expect(screen.getByText('area')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="context-menu-trigger"]')).not.toBeNull();
  });
});
