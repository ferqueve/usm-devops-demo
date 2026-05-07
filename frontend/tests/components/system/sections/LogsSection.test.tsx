import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/components/ui/log-viewer', () => ({
  LogViewer: ({ content }: { content: string }) => <div data-testid="logs">{content}</div>,
}));

import { LogsSection } from '@/components/system/sections/LogsSection';

describe('LogsSection', () => {
  it('pasa logFile al LogViewer', () => {
    render(<LogsSection loggers={null} logFile="hola" onLoggerUpdate={async () => {}} />);
    expect(screen.getByTestId('logs').textContent).toBe('hola');
  });
});
