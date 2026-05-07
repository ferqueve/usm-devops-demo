import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '@/components/ui/input';

describe('Input', () => {
  it('renderiza con tipo por defecto y permite escritura', async () => {
    const onChange = vi.fn();
    render(<Input placeholder="nombre" onChange={onChange} />);
    const input = screen.getByPlaceholderText('nombre');
    await userEvent.type(input, 'abc');
    expect((input as HTMLInputElement).value).toBe('abc');
    expect(onChange).toHaveBeenCalled();
  });

  it('respeta type=email', () => {
    render(<Input type="email" placeholder="mail" />);
    expect(screen.getByPlaceholderText('mail')).toHaveAttribute('type', 'email');
  });

  it('disabled no permite escribir', async () => {
    render(<Input placeholder="x" disabled />);
    const input = screen.getByPlaceholderText('x');
    await userEvent.type(input, 'no');
    expect((input as HTMLInputElement).value).toBe('');
  });

  it('aplica data-slot=input', () => {
    const { container } = render(<Input />);
    expect(container.querySelector('[data-slot="input"]')).not.toBeNull();
  });
});
