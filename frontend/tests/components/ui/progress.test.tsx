import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Progress } from '@/components/ui/progress';

describe('Progress', () => {
  it('aplica transform según value', () => {
    const { container } = render(<Progress value={40} />);
    const indicator = container.querySelector('[data-slot="progress-indicator"]') as HTMLElement;
    expect(indicator).not.toBeNull();
    expect(indicator.style.transform).toBe('translateX(-60%)');
  });

  it('value undefined cae a 0 (transform -100%)', () => {
    const { container } = render(<Progress />);
    const indicator = container.querySelector('[data-slot="progress-indicator"]') as HTMLElement;
    expect(indicator.style.transform).toBe('translateX(-100%)');
  });

  it('aplica data-slot=progress', () => {
    const { container } = render(<Progress value={10} />);
    expect(container.querySelector('[data-slot="progress"]')).not.toBeNull();
  });
});
