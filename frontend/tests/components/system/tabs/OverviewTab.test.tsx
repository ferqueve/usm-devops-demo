import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/components/system/sections/MetricsCards', () => ({ MetricsCards: () => <div data-testid="metrics-cards" /> }));
vi.mock('@/components/system/sections/AppInfoCard', () => ({ AppInfoCard: () => <div data-testid="app-info" /> }));
vi.mock('@/components/system/sections/ActiveUsersCard', () => ({ ActiveUsersCard: () => <div data-testid="active-users" /> }));
vi.mock('@/components/system/sections/ExternalServicesCard', () => ({ ExternalServicesCard: () => <div data-testid="external-services" /> }));
vi.mock('@/hooks/useSidebarTransition', () => ({
  useSidebarTransition: () => ({ isTransitioning: false }),
}));

import { OverviewTab } from '@/components/system/tabs/OverviewTab';

describe('OverviewTab', () => {
  it('renderiza todas las secciones', () => {
    render(
      <OverviewTab
        health={null}
        memoryMetrics={null}
        memoryMaxMetrics={null}
        cpuMetrics={null}
        uptimeMetrics={null}
        info={null}
        activeUsers={null}
      />
    );
    expect(screen.getByTestId('metrics-cards')).toBeInTheDocument();
    expect(screen.getByTestId('app-info')).toBeInTheDocument();
    expect(screen.getByTestId('active-users')).toBeInTheDocument();
    expect(screen.getByTestId('external-services')).toBeInTheDocument();
  });
});
