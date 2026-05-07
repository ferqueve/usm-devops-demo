import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  it('renderiza children y dispara onClick', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    await userEvent.click(screen.getByRole('button', { name: 'Click' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('respeta disabled', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick} disabled>X</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('asChild renderiza slot', () => {
    render(
      <Button asChild>
        <a href="/x">go</a>
      </Button>
    );
    expect(screen.getByRole('link')).toBeInTheDocument();
  });

  it('aplica data-slot=button', () => {
    const { container } = render(<Button>X</Button>);
    expect(container.querySelector('[data-slot="button"]')).not.toBeNull();
  });
});
