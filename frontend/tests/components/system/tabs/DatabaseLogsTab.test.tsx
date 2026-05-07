import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/components/system/sections/DatabaseSection', () => ({
  DatabaseSection: () => <div data-testid="db" />,
}));
vi.mock('@/components/system/sections/LogsSection', () => ({
  LogsSection: () => <div data-testid="logs" />,
}));

import { DatabaseLogsTab } from '@/components/system/tabs/DatabaseLogsTab';

describe('DatabaseLogsTab', () => {
  it('renderiza secciones', () => {
    render(
      <DatabaseLogsTab
        health={null}
        liquibase={null}
        loggers={null}
        logFile=""
        onLoggerUpdate={async () => {}}
      />
    );
    expect(screen.getByTestId('db')).toBeInTheDocument();
    expect(screen.getByTestId('logs')).toBeInTheDocument();
    expect(screen.getByText('Base de Datos')).toBeInTheDocument();
    expect(screen.getByText('Logs del Sistema')).toBeInTheDocument();
  });
});
