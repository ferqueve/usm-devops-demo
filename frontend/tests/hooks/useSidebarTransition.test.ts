import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSidebarTransition } from '@/hooks/useSidebarTransition';

describe('useSidebarTransition', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('inicia con isTransitioning=false', () => {
    const { result } = renderHook(() => useSidebarTransition());
    expect(result.current.isTransitioning).toBe(false);
  });

  it('detecta click en elemento con data-sidebar y vuelve a false tras 250ms', () => {
    const { result } = renderHook(() => useSidebarTransition());

    const sidebarEl = document.createElement('div');
    sidebarEl.setAttribute('data-sidebar', 'menu');
    document.body.appendChild(sidebarEl);

    act(() => {
      sidebarEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(result.current.isTransitioning).toBe(true);

    act(() => {
      vi.advanceTimersByTime(260);
    });
    expect(result.current.isTransitioning).toBe(false);

    sidebarEl.remove();
  });

  it('ignora clicks fuera del sidebar', () => {
    const { result } = renderHook(() => useSidebarTransition());
    const other = document.createElement('div');
    document.body.appendChild(other);

    act(() => {
      other.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(result.current.isTransitioning).toBe(false);

    other.remove();
  });
});
