import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Separator } from '@/components/ui/separator';

describe('Separator', () => {
  it('renderiza con orientación horizontal por defecto', () => {
    const { container } = render(<Separator />);
    const el = container.querySelector('[data-slot="separator"]');
    expect(el).not.toBeNull();
    expect(el).toHaveAttribute('data-orientation', 'horizontal');
  });

  it('respeta orientation=vertical', () => {
    const { container } = render(<Separator orientation="vertical" />);
    expect(container.querySelector('[data-slot="separator"]')).toHaveAttribute(
      'data-orientation',
      'vertical'
    );
  });
});
