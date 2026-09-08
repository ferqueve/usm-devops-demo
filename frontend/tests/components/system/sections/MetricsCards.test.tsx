import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetricsCards } from '@/components/system/sections/MetricsCards';

const metric = (value: number) => ({ measurements: [{ statistic: 'VALUE', value }] }) as never;

describe('MetricsCards', () => {
  it('renderiza estado de salud, memoria, cpu y uptime', () => {
    render(
      <MetricsCards
        health={{ status: 'UP' } as never}
        memoryMetrics={metric(536870912)}
        memoryMaxMetrics={metric(1073741824)}
        cpuMetrics={metric(0.5)}
        uptimeMetrics={metric(3600)}
      />
    );
    expect(screen.getByText('Estado de salud')).toBeInTheDocument();
    expect(screen.getByText('UP')).toBeInTheDocument();
    expect(screen.getByText('Memoria JVM')).toBeInTheDocument();
    expect(screen.getByText('Uso de CPU')).toBeInTheDocument();
    expect(screen.getByText('Tiempo activo')).toBeInTheDocument();
  });

  it('marca DOWN si health no es UP', () => {
    render(
      <MetricsCards
        health={{ status: 'DOWN' } as never}
        memoryMetrics={null}
        memoryMaxMetrics={null}
        cpuMetrics={null}
        uptimeMetrics={null}
      />
    );
    expect(screen.getByText('DOWN')).toBeInTheDocument();
    expect(screen.getByText('Verificar componentes')).toBeInTheDocument();
  });
});
