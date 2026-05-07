import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption, TableFooter } from '@/components/ui/table';

describe('Table', () => {
  it('renderiza estructura completa con data-slot', () => {
    const { container } = render(
      <Table>
        <TableCaption>caption</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Col</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>cell</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell>foot</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    );
    expect(screen.getByText('caption')).toBeInTheDocument();
    expect(screen.getByText('Col')).toBeInTheDocument();
    expect(screen.getByText('cell')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="table"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="table-body"]')).not.toBeNull();
  });
});
