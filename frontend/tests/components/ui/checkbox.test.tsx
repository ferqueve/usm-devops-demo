import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Checkbox } from '@/components/ui/checkbox';

describe('Checkbox', () => {
  it('dispara onCheckedChange al click', async () => {
    const onCheckedChange = vi.fn();
    render(<Checkbox onCheckedChange={onCheckedChange} aria-label="acepto" />);
    await userEvent.click(screen.getByRole('checkbox', { name: 'acepto' }));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('respeta disabled', async () => {
    const onCheckedChange = vi.fn();
    render(<Checkbox disabled onCheckedChange={onCheckedChange} aria-label="x" />);
    await userEvent.click(screen.getByRole('checkbox', { name: 'x' }));
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it('aplica data-slot=checkbox', () => {
    const { container } = render(<Checkbox aria-label="z" />);
    expect(container.querySelector('[data-slot="checkbox"]')).not.toBeNull();
  });
});
