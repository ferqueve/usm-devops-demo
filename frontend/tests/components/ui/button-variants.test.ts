import { describe, it, expect } from 'vitest';
import { buttonVariants } from '@/components/ui/button-variants';

describe('buttonVariants', () => {
  it('default genera clases de tamaño default', () => {
    const r = buttonVariants();
    expect(r).toContain('h-8');
    expect(r).toContain('bg-primary');
  });

  it.each(['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'] as const)(
    'variant=%s no tira',
    (variant) => {
      expect(typeof buttonVariants({ variant })).toBe('string');
    }
  );

  it.each(['default', 'sm', 'lg', 'icon'] as const)('size=%s no tira', (size) => {
    expect(typeof buttonVariants({ size })).toBe('string');
  });

  it('size icon -> size-8', () => {
    expect(buttonVariants({ size: 'icon' })).toContain('size-8');
  });
});
