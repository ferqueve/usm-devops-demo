import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';

describe('Sheet', () => {
  it('muestra contenido cuando open=true', () => {
    render(
      <Sheet open>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Titulo</SheetTitle>
            <SheetDescription>Desc</SheetDescription>
          </SheetHeader>
          <p>body</p>
          <SheetFooter>
            <button type="button">ok</button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
    expect(screen.getByText('Titulo')).toBeInTheDocument();
    expect(screen.getByText('Desc')).toBeInTheDocument();
    expect(screen.getByText('body')).toBeInTheDocument();
  });

  it('no muestra contenido cuando open=false', () => {
    render(
      <Sheet open={false}>
        <SheetContent>
          <SheetTitle>oculto</SheetTitle>
        </SheetContent>
      </Sheet>
    );
    expect(screen.queryByText('oculto')).not.toBeInTheDocument();
  });
});
