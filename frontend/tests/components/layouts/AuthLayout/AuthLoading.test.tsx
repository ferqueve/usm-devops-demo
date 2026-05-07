import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthLoading } from '@/components/layouts/AuthLayout/AuthLoading';

describe('AuthLoading', () => {
  it('muestra mensaje de carga', () => {
    render(<AuthLoading />);
    expect(screen.getByText('Verificando autenticación...')).toBeInTheDocument();
  });
});
