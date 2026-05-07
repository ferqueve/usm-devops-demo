import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { SpaceCardSkeleton } from '@/components/spaces/SpaceCardSkeleton';

describe('SpaceCardSkeleton', () => {
  it('renderiza placeholders sin crashear', () => {
    const { container } = render(<SpaceCardSkeleton />);
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
  });
});
