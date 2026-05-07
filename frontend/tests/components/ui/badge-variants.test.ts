import { describe, it, expect } from 'vitest';
import { badgeVariants } from '@/components/ui/badge-variants';

describe('badgeVariants', () => {
  it('default incluye bg-primary', () => {
    expect(badgeVariants()).toContain('bg-primary');
  });

  it('destructive incluye bg-destructive', () => {
    expect(badgeVariants({ variant: 'destructive' })).toContain('bg-destructive');
  });

  it('outline incluye text-foreground', () => {
    expect(badgeVariants({ variant: 'outline' })).toContain('text-foreground');
  });

  it('secondary incluye bg-secondary', () => {
    expect(badgeVariants({ variant: 'secondary' })).toContain('bg-secondary');
  });
});
