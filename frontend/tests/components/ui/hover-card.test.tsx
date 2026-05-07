import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';

describe('HoverCard', () => {
  it('muestra contenido cuando open=true', () => {
    render(
      <HoverCard open>
        <HoverCardTrigger>trigger</HoverCardTrigger>
        <HoverCardContent>tip</HoverCardContent>
      </HoverCard>
    );
    expect(screen.getByText('tip')).toBeInTheDocument();
  });

  it('no muestra contenido cuando open=false', () => {
    render(
      <HoverCard open={false}>
        <HoverCardTrigger>x</HoverCardTrigger>
        <HoverCardContent>oculto</HoverCardContent>
      </HoverCard>
    );
    expect(screen.queryByText('oculto')).not.toBeInTheDocument();
  });
});
