import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthSidePanel } from '@/components/layouts/AuthLayout/AuthSidePanel';

describe('AuthSidePanel', () => {
  it('renderiza titulo de la app', () => {
    render(<AuthSidePanel />);
    expect(screen.getByText('UTEC SPACE MANAGER')).toBeInTheDocument();
    expect(screen.getByText('Gestor de espacios de UTEC')).toBeInTheDocument();
  });
});
