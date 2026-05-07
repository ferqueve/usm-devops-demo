import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/components/system/sections/HttpTraceSection', () => ({
  HttpTraceSection: () => <div data-testid="http-trace" />,
}));
vi.mock('@/components/system/sections/EndpointsSection', () => ({
  EndpointsSection: () => <div data-testid="endpoints" />,
}));

import { ActivityTab } from '@/components/system/tabs/ActivityTab';

describe('ActivityTab', () => {
  it('renderiza ambas secciones', () => {
    render(<ActivityTab httpTrace={null} mappings={null} />);
    expect(screen.getByTestId('http-trace')).toBeInTheDocument();
    expect(screen.getByTestId('endpoints')).toBeInTheDocument();
    expect(screen.getByText('HTTP Trace')).toBeInTheDocument();
    expect(screen.getByText('Endpoints REST')).toBeInTheDocument();
  });
});
