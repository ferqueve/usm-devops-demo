import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Switch } from '@/components/ui/switch';

describe('Switch', () => {
  it('dispara onCheckedChange al click', async () => {
    const onCheckedChange = vi.fn();
    render(<Switch onCheckedChange={onCheckedChange} aria-label="modo" />);
    await userEvent.click(screen.getByRole('switch', { name: 'modo' }));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('respeta disabled', async () => {
    const onCheckedChange = vi.fn();
    render(<Switch disabled onCheckedChange={onCheckedChange} aria-label="x" />);
    await userEvent.click(screen.getByRole('switch', { name: 'x' }));
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it('aplica data-slot=switch', () => {
    const { container } = render(<Switch aria-label="y" />);
    expect(container.querySelector('[data-slot="switch"]')).not.toBeNull();
  });
});
