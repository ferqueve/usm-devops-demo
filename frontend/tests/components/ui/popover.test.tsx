import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

describe('Popover', () => {
  it('muestra contenido cuando open=true', () => {
    render(
      <Popover open>
        <PopoverTrigger>abrir</PopoverTrigger>
        <PopoverContent>contenido</PopoverContent>
      </Popover>
    );
    expect(screen.getByText('contenido')).toBeInTheDocument();
  });

  it('no muestra contenido cuando open=false', () => {
    render(
      <Popover open={false}>
        <PopoverTrigger>x</PopoverTrigger>
        <PopoverContent>oculto</PopoverContent>
      </Popover>
    );
    expect(screen.queryByText('oculto')).not.toBeInTheDocument();
  });
});
