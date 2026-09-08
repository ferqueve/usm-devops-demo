import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/components/system/sections/JvmCharts', () => ({ JvmCharts: () => <div data-testid="jvm-charts" /> }));
vi.mock('@/components/system/sections/JvmDetailsTable', () => ({ JvmDetailsTable: () => <div data-testid="jvm-table" /> }));
vi.mock('@/hooks/useSidebarTransition', () => ({
  useSidebarTransition: () => ({ isTransitioning: false }),
}));

// PerformanceTab monta SlowEndpointsCard, que consulta el actuator al montarse.
// Sin este mock el test hace una petición de red real.
vi.mock('@/lib/api/stats', () => ({
  statsApi: {
    getSlowEndpoints: vi.fn().mockResolvedValue({ top: [] }),
  },
}));

import { PerformanceTab } from '@/components/system/tabs/PerformanceTab';

describe('PerformanceTab', () => {
  it('renderiza JvmCharts y JvmDetailsTable', () => {
    render(
      <PerformanceTab
        memoryMetrics={null}
        memoryMaxMetrics={null}
        cpuMetrics={null}
        threadsMetrics={null}
        gcMetrics={null}
        uptimeMetrics={null}
        httpMetrics={null}
        metricsHistory={[]}
        pool={null}
      />
    );
    expect(screen.getByTestId('jvm-charts')).toBeInTheDocument();
    expect(screen.getByTestId('jvm-table')).toBeInTheDocument();
  });
});
