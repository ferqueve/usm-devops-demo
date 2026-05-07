import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ActiveUsersCard } from '@/components/system/sections/ActiveUsersCard';

describe('ActiveUsersCard', () => {
  it('muestra mensaje de carga si data=null', () => {
    render(<ActiveUsersCard data={null} />);
    expect(screen.getByText(/Cargando información de usuarios activos/)).toBeInTheDocument();
  });

  it('muestra mensaje vacio cuando totalActiveUsers=0', () => {
    render(<ActiveUsersCard data={{ totalActiveUsers: 0, activeUsers: [] } as never} />);
    expect(screen.getByText(/No hay usuarios activos/)).toBeInTheDocument();
  });

  it('renderiza lista cuando hay usuarios', () => {
    const data = {
      totalActiveUsers: 1,
      activeUsers: [
        {
          email: 'a@b.com',
          nombre: 'Ana',
          apellido: 'Lopez',
          rol: 'ADMIN',
          lastActivity: new Date().toISOString(),
        },
      ],
    } as never;
    render(<ActiveUsersCard data={data} />);
    expect(screen.getByText('Ana Lopez')).toBeInTheDocument();
    expect(screen.getByText('a@b.com')).toBeInTheDocument();
    expect(screen.getByText('ADMIN')).toBeInTheDocument();
  });
});
