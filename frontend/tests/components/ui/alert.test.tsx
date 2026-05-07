import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

describe('Alert', () => {
  it('renderiza con role=alert y children', () => {
    render(
      <Alert>
        <AlertTitle>Titulo</AlertTitle>
        <AlertDescription>Descripcion</AlertDescription>
      </Alert>
    );
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(screen.getByText('Titulo')).toBeInTheDocument();
    expect(screen.getByText('Descripcion')).toBeInTheDocument();
  });

  it('variant=destructive aplica clases de destructive', () => {
    render(<Alert variant="destructive">x</Alert>);
    expect(screen.getByRole('alert').className).toContain('text-destructive');
  });

  it('variant default es por defecto', () => {
    render(<Alert>x</Alert>);
    expect(screen.getByRole('alert').className).toContain('bg-card');
  });
});
