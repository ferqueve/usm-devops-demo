import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';

describe('DropdownMenu', () => {
  it('muestra contenido cuando open=true', () => {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Item 1</DropdownMenuItem>
          <DropdownMenuItem>Item 2</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('no muestra contenido cuando open=false', () => {
    render(
      <DropdownMenu open={false}>
        <DropdownMenuTrigger>x</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>oculto</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    expect(screen.queryByText('oculto')).not.toBeInTheDocument();
  });
});
