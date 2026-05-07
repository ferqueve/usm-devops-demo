import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIsMobile } from '@/hooks/use-mobile';

describe('useIsMobile', () => {
  let listeners: Array<() => void>;
  beforeEach(() => {
    listeners = [];
    vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: (_: string, cb: () => void) => listeners.push(cb),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('retorna false cuando innerWidth >= breakpoint', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1024 });
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it('retorna true cuando innerWidth < breakpoint', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 500 });
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it('responde a cambio de media query', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1024 });
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    act(() => {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: 400 });
      listeners.forEach(l => l());
    });
    expect(result.current).toBe(true);
  });
});
