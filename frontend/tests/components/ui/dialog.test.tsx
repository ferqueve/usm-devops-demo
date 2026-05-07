import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

describe('Dialog', () => {
  it('renderiza titulo y descripcion cuando open=true', () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Titulo</DialogTitle>
            <DialogDescription>Desc</DialogDescription>
          </DialogHeader>
          <p>Body</p>
          <DialogFooter>
            <button type="button">Action</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
    expect(screen.getByText('Titulo')).toBeInTheDocument();
    expect(screen.getByText('Desc')).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
  });

  it('no renderiza contenido cuando open=false', () => {
    render(
      <Dialog open={false}>
        <DialogContent>
          <DialogTitle>Hidden</DialogTitle>
        </DialogContent>
      </Dialog>
    );
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
  });
});
