import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

describe('Tooltip', () => {
  it('renderiza el trigger sin abrir el contenido', () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>trigger</TooltipTrigger>
          <TooltipContent>contenido</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
    expect(screen.getByText('trigger')).toBeInTheDocument();
  });

  it('muestra el contenido cuando defaultOpen=true', () => {
    render(
      <TooltipProvider>
        <Tooltip defaultOpen>
          <TooltipTrigger>t</TooltipTrigger>
          <TooltipContent>visible</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
    // Radix portal: usa getAllByText porque puede haber duplicados accesibles
    const matches = screen.getAllByText('visible');
    expect(matches.length).toBeGreaterThan(0);
  });
});
