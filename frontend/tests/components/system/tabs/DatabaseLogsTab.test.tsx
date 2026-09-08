import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { HealthInfo, LiquibaseInfo, LoggersInfo } from '@/lib/types/actuator';

const databaseSpy = vi.fn();
const logsSpy = vi.fn();

vi.mock('@/components/system/sections/DatabaseSection', () => ({
  DatabaseSection: (props: { health: unknown; liquibase: unknown }) => {
    databaseSpy(props);
    return <div data-testid="db" />;
  },
}));
vi.mock('@/components/system/sections/LogsSection', () => ({
  LogsSection: (props: { loggers: unknown; logFile: string }) => {
    logsSpy(props);
    return <div data-testid="logs" />;
  },
}));

import { DatabaseLogsTab } from '@/components/system/tabs/DatabaseLogsTab';

describe('DatabaseLogsTab', () => {
  it('renderiza la sección de base de datos y la de logs', () => {
    render(
      <DatabaseLogsTab
        health={null}
        liquibase={null}
        loggers={null}
        logFile=""
        pool={null}
        onLoggerUpdate={async () => {}}
      />
    );
    expect(screen.getByTestId('db')).toBeInTheDocument();
    expect(screen.getByTestId('logs')).toBeInTheDocument();
  });

  it('reparte los datos del actuator entre las dos secciones', () => {
    const health = { status: 'UP' } as HealthInfo;
    const liquibase = { contexts: {} } as unknown as LiquibaseInfo;
    const loggers = { levels: [], loggers: {} } as unknown as LoggersInfo;
    const onLoggerUpdate = vi.fn(async () => {});

    render(
      <DatabaseLogsTab
        health={health}
        liquibase={liquibase}
        loggers={loggers}
        logFile="app.log"
        pool={null}
        onLoggerUpdate={onLoggerUpdate}
      />
    );

    expect(databaseSpy).toHaveBeenCalledWith(expect.objectContaining({ health, liquibase }));
    expect(logsSpy).toHaveBeenCalledWith(
      expect.objectContaining({ loggers, logFile: 'app.log', onLoggerUpdate })
    );
  });
});
