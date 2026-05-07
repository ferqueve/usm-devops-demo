import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AvatarInitials } from '@/components/ui/avatar-initials';

describe('AvatarInitials', () => {
  it('muestra iniciales de nombre + apellido', () => {
    render(<AvatarInitials name="Juan Perez" />);
    expect(screen.getByText('JP')).toBeInTheDocument();
  });

  it('una sola palabra -> primera letra', () => {
    render(<AvatarInitials name="Juan" />);
    expect(screen.getByText('J')).toBeInTheDocument();
  });

  it('nombre vacío + email -> primera letra del email', () => {
    render(<AvatarInitials name="" email="hola@x.com" />);
    expect(screen.getByText('H')).toBeInTheDocument();
  });

  it('nombre vacío sin email -> "?"', () => {
    render(<AvatarInitials name="" />);
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('respeta el size sm con clase h-8', () => {
    const { container } = render(<AvatarInitials name="Juan Perez" size="sm" />);
    expect(container.firstChild).toHaveClass('h-8');
  });

  it('respeta size xl', () => {
    const { container } = render(<AvatarInitials name="Juan Perez" size="xl" />);
    expect(container.firstChild).toHaveClass('h-16');
  });

  it('agrega className extra', () => {
    const { container } = render(<AvatarInitials name="X" className="extra" />);
    expect(container.firstChild).toHaveClass('extra');
  });

  it('expone title con el nombre', () => {
    render(<AvatarInitials name="Juan Perez" />);
    expect(screen.getByTitle('Juan Perez')).toBeInTheDocument();
  });
});
