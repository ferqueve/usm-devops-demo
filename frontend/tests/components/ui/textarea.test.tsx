import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Textarea } from '@/components/ui/textarea';

describe('Textarea', () => {
  it('permite escritura', async () => {
    const onChange = vi.fn();
    render(<Textarea placeholder="bio" onChange={onChange} />);
    const ta = screen.getByPlaceholderText('bio');
    await userEvent.type(ta, 'hi');
    expect((ta as HTMLTextAreaElement).value).toBe('hi');
    expect(onChange).toHaveBeenCalled();
  });

  it('disabled no acepta input', async () => {
    render(<Textarea placeholder="bio" disabled />);
    const ta = screen.getByPlaceholderText('bio');
    await userEvent.type(ta, 'hi');
    expect((ta as HTMLTextAreaElement).value).toBe('');
  });

  it('aplica data-slot=textarea', () => {
    const { container } = render(<Textarea />);
    expect(container.querySelector('[data-slot="textarea"]')).not.toBeNull();
  });
});
