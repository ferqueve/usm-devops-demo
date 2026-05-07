import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
} from '@/components/ui/card';

describe('Card', () => {
  it('renderiza la composición completa con sus data-slots', () => {
    const { container } = render(
      <Card>
        <CardHeader>
          <CardTitle>Titulo</CardTitle>
          <CardDescription>Desc</CardDescription>
          <CardAction>act</CardAction>
        </CardHeader>
        <CardContent>contenido</CardContent>
        <CardFooter>pie</CardFooter>
      </Card>
    );
    expect(screen.getByText('Titulo')).toBeInTheDocument();
    expect(screen.getByText('Desc')).toBeInTheDocument();
    expect(screen.getByText('contenido')).toBeInTheDocument();
    expect(screen.getByText('pie')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="card"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="card-header"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="card-title"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="card-description"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="card-action"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="card-content"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="card-footer"]')).not.toBeNull();
  });

  it('combina className personalizada', () => {
    const { container } = render(<Card className="extra-card">x</Card>);
    expect(container.querySelector('[data-slot="card"]')?.className).toContain('extra-card');
  });
});
