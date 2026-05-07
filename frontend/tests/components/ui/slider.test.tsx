import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Slider } from '@/components/ui/slider';

describe('Slider', () => {
  it('renderiza un thumb por valor (default value)', () => {
    const { container } = render(<Slider defaultValue={[25]} />);
    expect(container.querySelectorAll('[data-slot="slider-thumb"]').length).toBe(1);
  });

  it('renderiza dos thumbs para rango', () => {
    const { container } = render(<Slider value={[10, 60]} onValueChange={() => {}} />);
    expect(container.querySelectorAll('[data-slot="slider-thumb"]').length).toBe(2);
  });

  it('aplica data-slot=slider', () => {
    const { container } = render(<Slider defaultValue={[5]} />);
    expect(container.querySelector('[data-slot="slider"]')).not.toBeNull();
  });
});
