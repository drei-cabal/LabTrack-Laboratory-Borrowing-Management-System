import { useRef, useCallback } from 'react';

/**
 * Creates a wrapped callback that ignores calls occurring within `cooldownMs` of the previous call.
 * This prevents double-taps on buttons from triggering duplicate network requests or duplicate navigation.
 */
export function preventDoublePress<T extends (...args: any[]) => any>(
  fn: T,
  cooldownMs: number = 600
): (...args: Parameters<T>) => void {
  let isLocked = false;
  let timer: any = null;

  return (...args: Parameters<T>) => {
    if (isLocked) return;
    isLocked = true;
    try {
      fn(...args);
    } finally {
      timer = setTimeout(() => {
        isLocked = false;
      }, cooldownMs);
    }
  };
}

/**
 * Hook version of preventDoublePress that preserves dependencies.
 */
export function useGuardedPress<T extends (...args: any[]) => any>(
  callback: T,
  cooldownMs: number = 600
): (...args: Parameters<T>) => void {
  const isLockedRef = useRef(false);

  return useCallback(
    (...args: Parameters<T>) => {
      if (isLockedRef.current) return;
      isLockedRef.current = true;
      try {
        callback(...args);
      } finally {
        setTimeout(() => {
          isLockedRef.current = false;
        }, cooldownMs);
      }
    },
    [callback, cooldownMs]
  );
}
