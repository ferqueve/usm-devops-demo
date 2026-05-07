import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

describe('RadioGroup', () => {
  it('selecciona opcion al hacer click', async () => {
    const onValueChange = vi.fn();
    render(
      <RadioGroup onValueChange={onValueChange}>
        <RadioGroupItem value="a" aria-label="A" />
        <RadioGroupItem value="b" aria-label="B" />
      </RadioGroup>
    );
    await userEvent.click(screen.getByRole('radio', { name: 'B' }));
    expect(onValueChange).toHaveBeenCalledWith('b');
  });

  it('aplica data-slot=radio-group', () => {
    const { container } = render(
      <RadioGroup>
        <RadioGroupItem value="x" aria-label="x" />
      </RadioGroup>
    );
    expect(container.querySelector('[data-slot="radio-group"]')).not.toBeNull();
  });
});
