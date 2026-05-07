import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from '@/components/ui/pagination';

describe('Pagination', () => {
  it('marca el link activo con aria-current=page', () => {
    render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationLink isActive href="#1">
              1
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#2">2</PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
    expect(screen.getByText('1').closest('a')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('2').closest('a')).not.toHaveAttribute('aria-current');
  });

  it('renderiza Previous, Next y Ellipsis con etiquetas', () => {
    render(
      <Pagination>
        <PaginationContent>
          <PaginationPrevious href="#" />
          <PaginationEllipsis />
          <PaginationNext href="#" />
        </PaginationContent>
      </Pagination>
    );
    expect(screen.getByText('Anterior')).toBeInTheDocument();
    expect(screen.getByText('Siguiente')).toBeInTheDocument();
    expect(screen.getByText('Más páginas')).toBeInTheDocument();
  });
});
