import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import DashboardCharts from '@/components/dashboard/DashboardCharts';

// Lunes 2 de junio de 2025, para que el día pico sea determinista.
const reservas = [
  { estado: 'APROBADO', espacioNombre: 'Aula 7', inicio: '2025-06-02T10:00:00', fin: '2025-06-02T12:00:00' },
  { estado: 'APROBADO', espacioNombre: 'Aula 7', inicio: '2025-06-02T14:00:00', fin: '2025-06-02T15:00:00' },
  { estado: 'PENDIENTE', espacioNombre: 'Lab 1', inicio: '2025-06-03T09:00:00', fin: '2025-06-03T10:00:00' },
] as never;

describe('DashboardCharts', () => {
  it('muestra las cuatro métricas con sus etiquetas', () => {
    render(<DashboardCharts reservas={reservas} />);
    for (const label of ['Tasa de Aprobación', 'Día Pico', 'Espacio Más Usado', 'Horas Reservadas']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('calcula las métricas a partir de las reservas cuando no hay stats', () => {
    render(<DashboardCharts reservas={reservas} />);
    expect(screen.getByText('67%')).toBeInTheDocument();       // 2 aprobadas de 3
    expect(screen.getByText('Lunes')).toBeInTheDocument();     // 2 reservas el lunes
    // El día pico y el espacio top comparten el conteo de 2.
    expect(screen.getAllByText('2 reservas')).toHaveLength(2);
    expect(screen.getByText('Aula 7')).toBeInTheDocument();    // espacio más usado
    expect(screen.getByText('4h')).toBeInTheDocument();        // 2h + 1h + 1h
  });

  it('prefiere las agregaciones del backend por sobre el cálculo local', () => {
    const stats = {
      reservasPorEstado: { APROBADO: 9, PENDIENTE: 1 },
      reservasPorDiaSemana: { FRIDAY: 5 },
      nombreEspacioMasUsado: 'Salón de actos',
      reservasPorEspacio: { '3': 5 },
      duracionTotalHoras: 42.4,
    } as never;
    render(<DashboardCharts reservas={reservas} stats={stats} />);
    expect(screen.getByText('90%')).toBeInTheDocument();
    expect(screen.getByText('Viernes')).toBeInTheDocument();
    expect(screen.getByText('Salón de actos')).toBeInTheDocument();
    expect(screen.getByText('42h')).toBeInTheDocument();
  });

  it('sin reservas deja las métricas en cero y sin datos', () => {
    render(<DashboardCharts reservas={[] as never} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Sin datos').length).toBe(2);
  });

  it('muestra esqueletos mientras carga, sin etiquetas', () => {
    render(<DashboardCharts reservas={reservas} loading />);
    expect(screen.queryByText('Tasa de Aprobación')).not.toBeInTheDocument();
  });
});
