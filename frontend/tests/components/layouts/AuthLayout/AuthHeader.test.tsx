import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('react-router-dom', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

import { AuthHeader } from '@/components/layouts/AuthLayout/AuthHeader';

describe('AuthHeader', () => {
  it('renderiza logo y texto USM', () => {
    render(<AuthHeader />);
    expect(screen.getByAltText('UTEC Logo')).toBeInTheDocument();
    expect(screen.getByText('USM')).toBeInTheDocument();
  });
});
