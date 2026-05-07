import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/components/ui/liquibase-timeline', () => ({
  LiquibaseTimeline: ({ data }: { data: unknown }) => <div data-testid="timeline">{data ? 'with-data' : 'no-data'}</div>,
}));

import { DatabaseSection } from '@/components/system/sections/DatabaseSection';

describe('DatabaseSection', () => {
  it('pasa datos al timeline', () => {
    render(<DatabaseSection health={null} liquibase={{ contexts: {} } as never} />);
    expect(screen.getByTestId('timeline').textContent).toBe('with-data');
  });
});
