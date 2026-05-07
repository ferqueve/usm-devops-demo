import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toggle } from '@/components/ui/toggle';

describe('Toggle', () => {
  it('renderiza children y dispara onPressedChange', async () => {
    const onPressedChange = vi.fn();
    render(
      <Toggle aria-label="bold" onPressedChange={onPressedChange}>
        B
      </Toggle>
    );
    await userEvent.click(screen.getByRole('button', { name: 'bold' }));
    expect(onPressedChange).toHaveBeenCalledWith(true);
  });

  it('variant=outline aplica clase de borde', () => {
    render(
      <Toggle aria-label="x" variant="outline">
        X
      </Toggle>
    );
    expect(screen.getByRole('button', { name: 'x' }).className).toContain('border');
  });

  it('size=sm aplica altura sm', () => {
    render(
      <Toggle aria-label="s" size="sm">
        S
      </Toggle>
    );
    expect(screen.getByRole('button', { name: 's' }).className).toContain('h-8');
  });

  it('aplica data-slot=toggle', () => {
    const { container } = render(<Toggle aria-label="z">Z</Toggle>);
    expect(container.querySelector('[data-slot="toggle"]')).not.toBeNull();
  });
});
