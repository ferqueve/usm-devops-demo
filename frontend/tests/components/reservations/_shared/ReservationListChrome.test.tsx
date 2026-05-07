import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  ViewModeToggle,
  FullScreenToggle,
  ReservationListPagination,
} from '@/components/reservations/_shared/ReservationListChrome';

function renderWithTooltip(ui: React.ReactElement) {
  return render(<TooltipProvider>{ui}</TooltipProvider>);
}

describe('ViewModeToggle', () => {
  it('renderiza tres botones de modo de vista', () => {
    const { container } = renderWithTooltip(
      <ViewModeToggle viewMode="cards" onViewModeChange={vi.fn()} />
    );
    expect(container.querySelectorAll('button')).toHaveLength(3);
  });

  it('llama onViewModeChange al hacer click en un modo', () => {
    const onChange = vi.fn();
    const { container } = renderWithTooltip(
      <ViewModeToggle viewMode="cards" onViewModeChange={onChange} />
    );
    const buttons = container.querySelectorAll('button');
    fireEvent.click(buttons[1]);
    expect(onChange).toHaveBeenCalledWith('table');
  });
});

describe('FullScreenToggle', () => {
  it('llama onToggle al click', () => {
    const onToggle = vi.fn();
    const { container } = renderWithTooltip(
      <FullScreenToggle isFullScreen={false} onToggle={onToggle} />
    );
    fireEvent.click(container.querySelector('button')!);
    expect(onToggle).toHaveBeenCalled();
  });
});

describe('ReservationListPagination', () => {
  it('no renderiza nada si totalPages <= 1', () => {
    const { container } = render(
      <ReservationListPagination page={0} totalPages={1} onPageChange={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renderiza paginación con varias páginas', () => {
    render(
      <ReservationListPagination page={0} totalPages={5} onPageChange={vi.fn()} />
    );
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('llama onPageChange al click en otra página', () => {
    const onChange = vi.fn();
    render(
      <ReservationListPagination page={0} totalPages={5} onPageChange={onChange} />
    );
    fireEvent.click(screen.getByText('2'));
    expect(onChange).toHaveBeenCalledWith(1);
  });
});
