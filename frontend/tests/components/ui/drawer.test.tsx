import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from '@/components/ui/drawer';

describe('Drawer', () => {
  it('muestra contenido cuando open=true', () => {
    render(
      <Drawer open>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Titulo</DrawerTitle>
            <DrawerDescription>desc</DrawerDescription>
          </DrawerHeader>
          <div>body</div>
          <DrawerFooter>foot</DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
    expect(screen.getByText('Titulo')).toBeInTheDocument();
    expect(screen.getByText('body')).toBeInTheDocument();
  });

  it('no renderiza contenido cuando open=false', () => {
    render(
      <Drawer open={false}>
        <DrawerContent>
          <DrawerTitle>oculto</DrawerTitle>
        </DrawerContent>
      </Drawer>
    );
    expect(screen.queryByText('oculto')).not.toBeInTheDocument();
  });
});
