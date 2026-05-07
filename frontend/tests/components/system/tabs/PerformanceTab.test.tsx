import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/components/system/sections/JvmCharts', () => ({ JvmCharts: () => <div data-testid="jvm-charts" /> }));
vi.mock('@/components/system/sections/JvmDetailsTable', () => ({ JvmDetailsTable: () => <div data-testid="jvm-table" /> }));
vi.mock('@/hooks/useSidebarTransition', () => ({
  useSidebarTransition: () => ({ isTransitioning: false }),
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
      />
    );
    expect(screen.getByTestId('jvm-charts')).toBeInTheDocument();
    expect(screen.getByTestId('jvm-table')).toBeInTheDocument();
  });
});
