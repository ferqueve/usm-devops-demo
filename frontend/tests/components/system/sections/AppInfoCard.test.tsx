import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppInfoCard } from '@/components/system/sections/AppInfoCard';

describe('AppInfoCard', () => {
  it('muestra placeholder sin info', () => {
    render(<AppInfoCard info={null} />);
    expect(screen.getByText('No hay información disponible')).toBeInTheDocument();
  });

  it('renderiza datos de app', () => {
    const info = {
      app: {
        name: 'USM',
        version: '1.0.0',
        environment: 'development',
        description: 'Gestor',
        'java.version': '21',
      },
    } as never;
    render(<AppInfoCard info={info} />);
    expect(screen.getByText('USM')).toBeInTheDocument();
    expect(screen.getByText('1.0.0')).toBeInTheDocument();
    expect(screen.getByText('development')).toBeInTheDocument();
    expect(screen.getByText('21')).toBeInTheDocument();
  });
});
