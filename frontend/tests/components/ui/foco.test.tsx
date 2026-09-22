import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// requestAnimationFrame no existe en el entorno de los tests.
vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => setTimeout(() => cb(0), 0));

function Pantalla() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>Abrir</button>
      <button type="button">Otro botón</button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Título</AlertDialogTitle>
          <AlertDialogDescription>Cuerpo</AlertDialogDescription>
          <AlertDialogAction onClick={() => setOpen(false)}>Aceptar</AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Los diálogos se controlan por estado, así que Radix no conoce el botón que
// los abrió y al cerrar dejaba el foco en el `body`: con el teclado se volvía
// al principio del documento.
describe('el foco al cerrar un diálogo', () => {
  it('vuelve al botón que lo abrió', async () => {
    const usuario = userEvent.setup();
    render(<Pantalla />);
    const abrir = screen.getByRole('button', { name: 'Abrir' });

    abrir.focus();
    await usuario.keyboard('{Enter}');
    expect(await screen.findByRole('alertdialog')).toBeInTheDocument();

    await usuario.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    await waitFor(() => expect(document.activeElement).toBe(abrir));
  });

  it('vuelve al último foco de afuera, no al primero de la pantalla', async () => {
    const usuario = userEvent.setup();
    render(<Pantalla />);
    const otro = screen.getByRole('button', { name: 'Otro botón' });
    otro.focus();

    await usuario.click(screen.getByRole('button', { name: 'Abrir' }));
    await screen.findByRole('alertdialog');
    await usuario.keyboard('{Escape}');

    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Abrir' })));
    expect(document.activeElement).not.toBe(otro);
  });
});
