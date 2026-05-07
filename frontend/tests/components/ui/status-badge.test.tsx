import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '@/components/ui/status-badge';

describe('StatusBadge', () => {
  it('renderiza la etiqueta', () => {
    render(<StatusBadge status="success" label="OK" />);
    expect(screen.getByText('OK')).toBeInTheDocument();
  });

  it.each([
    ['success'],
    ['error'],
    ['warning'],
    ['info'],
    ['neutral'],
  ] as const)('renderiza para status %s', (status) => {
    render(<StatusBadge status={status} label={`L-${status}`} />);
    expect(screen.getByText(`L-${status}`)).toBeInTheDocument();
  });

  it('aplica clase pulse cuando pulse=true', () => {
    const { container } = render(<StatusBadge status="info" label="x" pulse />);
    const badge = container.querySelector('[data-slot="badge"]');
    expect(badge?.className).toContain('badge-pulse');
  });

  it('icon=false no rompe el render', () => {
    render(<StatusBadge status="info" label="ok" icon={false} />);
    expect(screen.getByText('ok')).toBeInTheDocument();
  });
});
