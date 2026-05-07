import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/components/ui/http-trace-table', () => ({
  HttpTraceTable: ({ data }: { data: unknown }) => <div data-testid="trace">{data ? 'with' : 'none'}</div>,
}));

import { HttpTraceSection } from '@/components/system/sections/HttpTraceSection';

describe('HttpTraceSection', () => {
  it('renderiza HttpTraceTable', () => {
    render(<HttpTraceSection httpTrace={{ traces: [] } as never} />);
    expect(screen.getByTestId('trace').textContent).toBe('with');
  });
});
